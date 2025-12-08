import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';
import * as api from '../../src/api';

// Mock the API module
vi.mock('../../src/api');

const mockApi = vi.mocked(api);

// Mock UUID generation to be predictable
vi.mock('crypto', () => ({
  getRandomValues: vi.fn(() => new Uint8Array([1, 2, 3, 4])),
}));

// Mock secure context
Object.defineProperty(window, 'isSecureContext', {
  writable: true,
  value: true,
});

describe('App Component', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default API mocks
    mockApi.identifyLanguage.mockResolvedValue({ lang: 'en' });
    mockApi.startTranslation.mockResolvedValue({
      contextId: 'test-context-1',
      result: 'Test translation [ja]',
      sourceLang: 'en'
    });
    mockApi.improveTranslation.mockResolvedValue({
      result: 'Improved translation [ja]'
    });
    mockApi.previewTranslation.mockResolvedValue({
      result: 'Preview translation [en]'
    });
  });

  it('renders the main interface correctly', () => {
    render(<App />);

    // Check header
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('BabelBridge')).toBeInTheDocument();
    expect(screen.getByAltText('BabelBridge logo')).toBeInTheDocument();

    // Check main content
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text to translate…')).toBeInTheDocument();

    // Check language buttons are present
    expect(screen.getByRole('group', { name: 'Translate to' })).toBeInTheDocument();

    // Check output section
    expect(screen.getByText('No output yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /improve/i })).toBeDisabled();

    // Check footer
    expect(screen.getByText(/Last target:/)).toBeInTheDocument();
  });

  it('handles language detection', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByPlaceholderText('Enter text to translate…');

    // Type Japanese text
    await user.type(textarea, 'こんにちは');

    // Wait for debounced API call
    await waitFor(() => {
      expect(mockApi.identifyLanguage).toHaveBeenCalledWith({ source: 'こんにちは' });
    });
  });

  it('performs translation workflow', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByPlaceholderText('Enter text to translate…');

    // Enter text
    await user.type(textarea, 'Hello world');

    // Click translate button (assuming Japanese is first)
    const translateBtn = screen.getByRole('button', { name: /japanese/i });
    await user.click(translateBtn);

    // Should call start translation API
    await waitFor(() => {
      expect(mockApi.startTranslation).toHaveBeenCalledWith({
        source: 'Hello world',
        lang: expect.stringMatching(/ja/i)
      });
    });

    // Should show translation result
    await waitFor(() => {
      expect(screen.getByText('Test translation [ja]')).toBeInTheDocument();
    });

    // Improve button should be enabled
    expect(screen.getByRole('button', { name: /improve/i })).toBeEnabled();
  });

  it('handles translation improvement', async () => {
    const user = userEvent.setup();
    render(<App />);

    // First do a translation
    const textarea = screen.getByPlaceholderText('Enter text to translate…');
    await user.type(textarea, 'Hello world');

    const translateBtn = screen.getByRole('button', { name: /japanese/i });
    await user.click(translateBtn);

    await waitFor(() => {
      expect(screen.getByText('Test translation [ja]')).toBeInTheDocument();
    });

    // Click improve button
    const improveBtn = screen.getByRole('button', { name: /improve/i });
    await user.click(improveBtn);

    // Modal should appear
    expect(screen.getByText('Improve output')).toBeInTheDocument();
    const modal = screen.getByText('Improve output').closest('.modal');
    expect(modal).toBeInTheDocument();

    // Enter feedback
    const feedbackInput = screen.getByPlaceholderText(/More formal/i);
    await user.type(feedbackInput, 'Make it more formal');

    // Wait for input to be populated
    await waitFor(() => {
      expect(feedbackInput).toHaveValue('Make it more formal');
    });

    // Apply improvement
    const applyBtn = screen.getByRole('button', { name: 'Apply' });
    // Wait for button to be enabled (might be disabled initially)
    await waitFor(() => {
      expect(applyBtn).not.toBeDisabled();
    });
    await user.click(applyBtn);

    // Should call improve API
    await waitFor(() => {
      expect(mockApi.improveTranslation).toHaveBeenCalledWith({
        contextId: 'test-context-1',
        feedback: 'Make it more formal'
      });
    });

    // Should show improved result
    await waitFor(() => {
      expect(screen.getByText('Improved translation [ja]')).toBeInTheDocument();
    });

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Improve output')).not.toBeInTheDocument();
    });
  });

  it('handles error states', async () => {
    const user = userEvent.setup();

    // Mock API failure
    mockApi.startTranslation.mockRejectedValue(new Error('Translation failed'));

    render(<App />);

    const textarea = screen.getByPlaceholderText('Enter text to translate…');
    await user.type(textarea, 'Hello world');

    // Try to translate
    const translateBtn = screen.getByRole('button', { name: /japanese/i });
    await user.click(translateBtn);

    // Should show error modal
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Translation failed')).toBeInTheDocument();
    });

    // Dismiss error
    const dismissBtn = screen.getByLabelText('Dismiss');
    await user.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();

    // Mock API failure
    mockApi.startTranslation.mockRejectedValue(new Error('Translation failed'));

    render(<App />);

    const textarea = screen.getByPlaceholderText('Enter text to translate…');
    await user.type(textarea, 'Hello world');

    const translateBtn = screen.getByRole('button', { name: /japanese/i });
    await user.click(translateBtn);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText(/Translation failed/)).toBeInTheDocument();
    });
  });

  it('switches to chain mode when adding messages', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially in single mode
    expect(screen.getByPlaceholderText('Enter text to translate…')).toBeInTheDocument();

    // Add message
    const addBtn = screen.getByRole('button', { name: 'Add message' });
    await user.click(addBtn);

    // Should switch to chain mode
    expect(screen.queryByPlaceholderText('Enter text to translate…')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Earlier context/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Final message/)).toBeInTheDocument();
  });

  it('manages multiple messages in chain mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Enter chain mode
    await user.click(screen.getByRole('button', { name: 'Add message' }));

    // Should have 2 messages
    const textareas = screen.getAllByRole('textbox');
    expect(textareas).toHaveLength(2);

    // Add another message
    await user.click(screen.getByRole('button', { name: 'Add message' }));

    // Should have 3 messages
    expect(screen.getAllByRole('textbox')).toHaveLength(3);

    // Remove a message
    const removeButtons = screen.getAllByLabelText('Remove message');
    await user.click(removeButtons[0]);

    // Should have 2 messages again
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('handles history expansion and reverse translation', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Do a translation first
    const textarea = screen.getByPlaceholderText('Enter text to translate…');
    await user.type(textarea, 'Hello world');

    const translateBtn = screen.getByRole('button', { name: /japanese/i });
    await user.click(translateBtn);

    await waitFor(() => {
      expect(screen.getByText('Test translation [ja]')).toBeInTheDocument();
    });

    // Expand history
    const historyToggle = screen.getByText(/Show context history/);
    await user.click(historyToggle);

    // Should show history list
    expect(screen.getByText('Initial')).toBeInTheDocument();

    // Test reverse translation
    const reverseBtns = screen.getAllByText(/Original/);
    await user.click(reverseBtns[0]); // Click the first one (main output area)

    await waitFor(() => {
      expect(mockApi.previewTranslation).toHaveBeenCalledWith({
        source: 'Test translation [ja]',
        lang: 'en'
      });
    });
  });
});
