import { test, expect, clickLanguageButton } from './fixtures';

test.describe('Translation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should perform basic translation workflow', async ({ page }) => {
    // Enter text that matches the mock's expected input
    const textarea = page.locator('textarea').first();
    await textarea.fill('Hello. I like pizza.');

    // Wait for language detection (debounced)
    await page.waitForTimeout(500);

    // Should detect English
    await expect(page.locator('.composer-header')).toContainText('American English');

    // Click Japanese translation button
    const japaneseBtn = page.locator('.language-btn:has-text("Japanese")').first();
    await japaneseBtn.click();

    // Should show loading state on the clicked button
    await expect(japaneseBtn).toHaveAttribute('disabled', '');

    // Wait for translation to complete
    await expect(page.locator('#output')).not.toContainText('No output yet', { timeout: 10000 });

    // Should show actual Japanese translation from mock
    await expect(page.locator('#output')).toContainText('こにちは。ピザがすきです。');

    // Should show detected source language
    await expect(page.locator('.detected-lang')).toContainText('Translated from American English');

    // Improve button should now be enabled
    await expect(page.locator('button:has-text("Improve")')).toBeEnabled();

    // History should be visible
    await expect(page.locator('.history-toggle')).toBeVisible();
    await expect(page.locator('.count')).toContainText('1');
  });

  test('should handle translation improvement', async ({ page }) => {
    // First, do a translation with text that the mock supports
    await page.locator('textarea').first().fill('Hello. I like pizza.');
    await page.waitForTimeout(500);

    // Click Spanish button to get a translation we can improve - mobile aware
    await clickLanguageButton(page, 'Spanish');

    // Wait for translation
    await expect(page.locator('#output')).not.toContainText('No output yet', { timeout: 10000 });
    await expect(page.locator('#output')).toContainText('Hola. Me gusta la pizza.');

    // Click improve button
    await page.locator('button:has-text("Improve")').click();

    // Modal should appear
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal h3')).toContainText('Improve output');

    // Enter improvement feedback that the mock understands
    const modalInput = page.locator('.modal-input');
    await modalInput.fill('Make it more formal');

    // Apply improvement
    await page.locator('.modal button:has-text("Apply")').click();

    // Modal should close
    await expect(page.locator('.modal')).not.toBeVisible();

    // Should show actual improved translation from mock
    await expect(page.locator('#output')).toContainText('Hola. Me encanta la pizza.');

    // History count should increase
    await expect(page.locator('.count')).toContainText('2');
  });

  test('should handle preview (reverse translation)', async ({ page }) => {
    // Do a translation first with supported input
    await page.locator('textarea').first().fill('Hello. I like pizza.');
    await page.waitForTimeout(500);
    await clickLanguageButton(page, 'Spanish');

    // Wait for translation
    await expect(page.locator('#output')).not.toContainText('No output yet', { timeout: 10000 });
    await expect(page.locator('#output')).toContainText('Hola. Me gusta la pizza.');

    // Click reverse translation button
    const reverseBtn = page.locator('button:has-text("Original")');
    await reverseBtn.click();

    // Should show reversed content (preview of translating Spanish back to English)
    // The mock would return the Spanish translation again since it doesn't support English output
    await expect(page.locator('#output')).toContainText('Hola. Me gusta la pizza.');

    // Button text should update to show that we're viewing original
    await expect(reverseBtn).toContainText('Original');

    // Click again to go back to translation view
    await reverseBtn.click();
    await expect(page.locator('#output')).toContainText('Hola. Me gusta la pizza.'); // Back to original
  });

  test('should expand and show history', async ({ page }) => {
    // Do a translation first with supported input
    await page.locator('textarea').first().fill('Hello. I like pizza.');
    await page.waitForTimeout(500);
    await clickLanguageButton(page, 'German');
    await expect(page.locator('#output')).not.toContainText('No output yet', { timeout: 10000 });

    // Expand history
    await page.locator('.history-toggle').click();

    // Should show history list
    await expect(page.locator('.history-list')).toBeVisible();
    await expect(page.locator('.history-item')).toBeVisible();
    await expect(page.locator('.badge:has-text("Initial")')).toBeVisible();

    // Should show timestamp
    await expect(page.locator('.time')).toBeVisible();

    // Collapse history
    await page.locator('.history-toggle').click();
    await expect(page.locator('.history-list')).not.toBeVisible();
  });
});
