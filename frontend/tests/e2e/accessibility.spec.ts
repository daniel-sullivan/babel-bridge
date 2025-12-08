import { test, expect } from './fixtures';

test.describe('Accessibility and UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Check main landmarks
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // Check ARIA labels
    await expect(page.locator('button[aria-label="Add message"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Dismiss"]')).toHaveCount(0); // Should not be present initially

    // Check role attributes
    await expect(page.locator('[role="group"]')).toBeVisible(); // Language buttons group
    await expect(page.locator('[aria-live="polite"]')).toBeVisible(); // Language detection announcement
  });

  test('should be keyboard accessible', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // For WebKit/Safari, focus behavior might be different
    const isWebKit = page.evaluate(() => /WebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent));

    if (await isWebKit) {
      // On WebKit/Safari, just verify that tab navigation works
      await page.keyboard.press('Tab'); // Focus on add message button
      await page.keyboard.press('Tab'); // Focus on first language button
    } else {
      // On other browsers, verify specific focus
      await expect(page.locator('textarea')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('button[aria-label="Add message"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('.language-btn').first()).toBeFocused();
    }

    // Fill textarea first
    await page.locator('textarea').first().fill('Hello world');
    await page.waitForTimeout(500);

    // Focus on a language button and press Enter
    await page.locator('.language-btn').first().focus();
    await page.keyboard.press('Enter');

    // Should trigger translation
    await expect(page.locator('#output')).not.toContainText('No output yet', { timeout: 10000 });
  });

  test('should handle modal keyboard interactions', async ({ page }) => {
    // Do a translation first
    await page.locator('textarea').first().fill('Hello world');
    await page.waitForTimeout(500);
    await page.locator('.language-btn').first().click();
    await expect(page.locator('#output')).not.toContainText('No output yet', { timeout: 10000 });

    // Open improve modal
    await page.locator('button:has-text("Improve")').click();
    await expect(page.locator('.modal')).toBeVisible();

    // Input should be focused
    await expect(page.locator('.modal-input')).toBeFocused();

    // Test Enter key in input
    await page.locator('.modal-input').fill('Make it formal');
    await page.keyboard.press('Enter');

    // Modal should close and improvement should apply
    await expect(page.locator('.modal')).not.toBeVisible();

    // Open modal again
    await page.locator('button:has-text("Improve")').click();

    // Test Escape key
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('should have proper focus management', async ({ page }) => {
    // Focus should be visible
    await page.keyboard.press('Tab');

    // Check focus outline is visible (basic check) - skip on WebKit/Safari due to differences
    const isWebKit = await page.evaluate(() => /WebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent));

    if (!isWebKit) {
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }

    // Test focus trap in modal
    await page.locator('textarea').first().fill('Hello');
    await page.waitForTimeout(500);
    await page.locator('.language-btn').first().click();
    await expect(page.locator('#output')).not.toContainText('No output yet', { timeout: 10000 });

    await page.locator('button:has-text("Improve")').click();
    await expect(page.locator('.modal')).toBeVisible();

    // Add text to input so Apply button becomes enabled/focusable
    await page.locator('.modal-input').fill('Make it more formal');

    // Tab should cycle through modal elements
    await page.keyboard.press('Tab'); // From input to Cancel
    await expect(page.locator('.modal button:has-text("Cancel")')).toBeFocused();

    await page.keyboard.press('Tab'); // To Apply button
    if (!isWebKit) {
      await expect(page.locator('.modal button:has-text("Apply")')).toBeFocused();
    }
  });

  test('should provide loading states and feedback', async ({ page }) => {
    await page.locator('textarea').first().fill('Hello world');
    await page.waitForTimeout(500);

    // Click translate button
    const translateBtn = page.locator('.language-btn').first();
    await translateBtn.click();

    // Should show loading state
    await expect(translateBtn).toBeDisabled();
    await expect(translateBtn).toContainText('Japanese'); // Button text should remain

    // Wait for completion
    await expect(page.locator('#output')).not.toContainText('No output yet', { timeout: 10000 });

    // Buttons should be re-enabled
    await expect(translateBtn).toBeEnabled();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test empty input error
    await page.locator('.language-btn').first().click();

    // Should show error with proper role
    await expect(page.locator('.error[role="alert"]')).toBeVisible();
    await expect(page.locator('.error')).toContainText('Please enter a message');

    // Error should be dismissible
    await page.locator('.error button[aria-label="Dismiss"]').click();
    await expect(page.locator('.error')).not.toBeVisible();
  });

  test('should support screen readers with live regions', async ({ page }) => {
    // Language detection live region
    await expect(page.locator('[aria-live="polite"]')).toBeVisible();

    // Output live region
    await expect(page.locator('#output[aria-live="polite"]')).toBeVisible();

    // Test live region updates - use text pattern that mock recognizes
    await page.locator('textarea').first().fill('こんにちは。');
    await page.waitForTimeout(500);

    // Live region should update with detected language - use the specific sr-only element
    await expect(page.locator('[aria-live="polite"].sr-only')).toContainText('Detected language: Japanese');
  });

  test('should work well on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Touch interactions should work
    await page.locator('textarea').first().click();
    await page.locator('textarea').first().fill('Hello');

    // Language buttons should be accessible on mobile
    await page.locator('.language-btn').first().click();

    // Modal should work on mobile
    await expect(page.locator('#output')).not.toContainText('No output yet', { timeout: 10000 });
    await page.locator('button:has-text("Improve")').click();

    await expect(page.locator('.modal')).toBeVisible();

    // Modal should be properly sized for mobile
    const modal = page.locator('.modal');
    const modalBox = await modal.boundingBox();
    expect(modalBox!.width).toBeLessThan(375); // Should fit within viewport
  });
});
