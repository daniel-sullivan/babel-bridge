import { test, expect } from './fixtures';

test.describe('BabelBridge Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page correctly', async ({ page }) => {
    // Check page title and main elements
    await expect(page).toHaveTitle(/BabelBridge/);

    // Check header
    await expect(page.locator('.header')).toBeVisible();
    await expect(page.locator('.brand')).toContainText('BabelBridge');
    await expect(page.locator('.logo')).toBeVisible();

    // Check main content areas
    await expect(page.locator('.composer')).toBeVisible();
    await expect(page.locator('.result')).toBeVisible();

    // Check footer
    await expect(page.locator('.footer')).toBeVisible();
    await expect(page.locator('.footer')).toContainText('Last target:');
  });

  test('should have proper initial state', async ({ page }) => {
    // Check input area
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('placeholder', 'Enter text to translate…');

    // Check language buttons are visible
    await expect(page.locator('.language-buttons-row')).toBeVisible();
    await expect(page.locator('.language-btn').first()).toBeVisible();

    // Check output shows no content yet
    await expect(page.locator('#output')).toContainText('No output yet');

    // Check improve button is disabled
    await expect(page.locator('button:has-text("Improve")')).toBeDisabled();
  });

  test('should show error for empty translation', async ({ page }) => {
    // Click translate without entering text
    await page.locator('.language-btn').first().click();

    // Should show error
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toContainText('Please enter a message to translate');

    // Dismiss error
    await page.locator('.error button').click();
    await expect(page.locator('.error')).not.toBeVisible();
  });
});

