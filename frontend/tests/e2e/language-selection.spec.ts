import { test, expect } from './fixtures';

test.describe('Language Selection and Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display language buttons correctly', async ({ page }) => {
    const languageRow = page.locator('.language-buttons-row');
    await expect(languageRow).toBeVisible();

    // Should show multiple language buttons (at least some)
    const languageButtons = page.locator('.language-btn');
    const count = await languageButtons.count();
    expect(count).toBeGreaterThan(0); // Should have at least some languages visible

    // Japanese should always be visible (first in list)
    await expect(page.locator('.language-btn:has-text("Japanese")')).toBeVisible();

    // Check for English and Spanish - they might be in dropdown on mobile
    const englishVisible = await page.locator('.language-btn:has-text("English")').isVisible();
    const spanishVisible = await page.locator('.language-btn:has-text("Spanish")').isVisible();

    if (!englishVisible || !spanishVisible) {
      // On mobile, check if there's a "More" button and dropdown
      const moreButton = page.locator('button:has-text("More")');
      if (await moreButton.isVisible()) {
        await moreButton.click();
        await page.waitForTimeout(500); // Wait for dropdown animation

        // Now check in the dropdown menu
        if (!englishVisible) {
          await expect(page.locator('.menu .menu-item:has-text("English")')).toBeVisible();
        }
        if (!spanishVisible) {
          await expect(page.locator('.menu .menu-item:has-text("Spanish")')).toBeVisible();
        }

        // Close dropdown
        await page.keyboard.press('Escape');
      }
    }

    // Should have flag images
    await expect(page.locator('.flag-img').first()).toBeVisible();
  });

  test('should handle language dropdown for "More" languages', async ({ page }) => {
    // Look for "More" button (appears when there are too many languages to show)
    const moreButton = page.locator('button:has-text("More")');

    if (await moreButton.isVisible()) {
      // Click to open dropdown
      await moreButton.click();

      // Should show dropdown menu
      await expect(page.locator('.menu[role="menu"]')).toBeVisible();

      // Should have menu items
      await expect(page.locator('.menu-item').first()).toBeVisible();

      // Should be able to select a language from dropdown
      await page.locator('.menu-item').first().click();

      // Dropdown should close
      await expect(page.locator('.menu[role="menu"]')).not.toBeVisible();
    }
  });

  test('should handle custom language input', async ({ page }) => {
    // Look for "More" button to access custom language
    const moreButton = page.locator('button:has-text("More")');

    if (await moreButton.isVisible()) {
      await moreButton.click();

      // Look for custom language option
      const customOption = page.locator('.menu-item:has-text("Custom")');
      if (await customOption.isVisible()) {
        await customOption.click();

        // Should show a prompt (we can't test native prompt, but we can test the functionality)
        // In a real test, we'd mock the prompt or use a custom implementation
      }
    }
  });

  test('should auto-detect source language', async ({ page }) => {
    // Enter Japanese text that the mock recognizes
    await page.locator('textarea').first().fill('こんにちは。');

    // Wait for detection (debounced)
    await page.waitForTimeout(500);

    // Should show detected language in header
    await expect(page.locator('.composer-header')).toContainText('Japanese');

    // Screen reader announcement should be present
    await expect(page.locator('[aria-live="polite"]').first()).toContainText('Detected language: Japanese');

    // Change to English text
    await page.locator('textarea').first().fill('Hello.');
    await page.waitForTimeout(500);

    // Should detect English
    await expect(page.locator('.composer-header')).toContainText('American English');
  });

  test('should show target language in footer', async ({ page }) => {
    // Footer should show default target language
    await expect(page.locator('.footer')).toContainText('Last target: Japanese');

    // Should show flag emoji
    await expect(page.locator('.footer')).toContainText('🇯🇵');

    // After selecting different language, footer should update
    await page.locator('textarea').first().fill('Hello');
    await page.waitForTimeout(500);

    // Click Spanish button
    const spanishBtn = page.locator('.language-btn:has-text("Spanish")');
    if (await spanishBtn.isVisible()) {
      await spanishBtn.click();

      // Wait for translation to complete
      await expect(page.locator('#output')).not.toContainText('No output yet', { timeout: 10000 });

      // Footer should update
      await expect(page.locator('.footer')).toContainText('Last target: Spanish');
    }
  });

  test('should handle responsive language button layout', async ({ page }) => {
    // Test on different viewport sizes
    await page.setViewportSize({ width: 800, height: 600 });

    // Language buttons should be visible
    await expect(page.locator('.language-buttons-row')).toBeVisible();
    await expect(page.locator('.language-btn').first()).toBeVisible();

    // Test on mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Should still show language buttons (possibly with "More" dropdown)
    await expect(page.locator('.language-buttons-row')).toBeVisible();
  });
});
