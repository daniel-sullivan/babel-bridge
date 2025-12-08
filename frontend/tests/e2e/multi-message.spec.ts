import { test, expect, clickLanguageButton } from './fixtures';

test.describe('Multi-Message Chain Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should switch to chain mode when adding messages', async ({ page }) => {
    // Initially in single mode
    await expect(page.locator('.single-message-row')).toBeVisible();
    await expect(page.locator('.messages')).not.toBeVisible();

    // Add a message
    await page.locator('button[aria-label="Add message"]').click();

    // Should switch to chain mode
    await expect(page.locator('.single-message-row')).not.toBeVisible();
    await expect(page.locator('.messages')).toBeVisible();
    await expect(page.locator('.message')).toHaveCount(2);
  });

  test('should manage multiple messages', async ({ page }) => {
    // Add messages to enter chain mode
    await page.locator('button[aria-label="Add message"]').click();

    // Fill first message (context)
    const firstMessage = page.locator('.message').first().locator('textarea');
    await firstMessage.fill('This is context');
    await expect(firstMessage).toHaveAttribute('placeholder', /Earlier context/);

    // Fill second message (main)
    const secondMessage = page.locator('.message').last().locator('textarea');
    await secondMessage.fill('This is the main message');
    await expect(secondMessage).toHaveAttribute('placeholder', /Final message/);

    // Should show message indices
    await expect(page.locator('.index').first()).toContainText('1');
    await expect(page.locator('.index').last()).toContainText('2');

    // Add another message
    await page.locator('.messages ~ div button[aria-label="Add message"]').click();
    await expect(page.locator('.message')).toHaveCount(3);

    // Remove the second message
    await page.locator('.message').nth(1).locator('button[aria-label="Remove message"]').click();
    await expect(page.locator('.message')).toHaveCount(2);
  });

  test('should prevent removing the last message', async ({ page }) => {
    // Add a message to enter chain mode
    await page.locator('button[aria-label="Add message"]').click();

    // Remove one message - should go back to 1 message
    await page.locator('.message').last().locator('button[aria-label="Remove message"]').click();
    await expect(page.locator('.message')).toHaveCount(1);

    // The remaining message should not have a remove button
    await expect(page.locator('button[aria-label="Remove message"]')).not.toBeVisible();
  });

  test('should translate with multiple messages', async ({ page }) => {
    // Enter chain mode and add context
    await page.locator('button[aria-label="Add message"]').click();

    // Fill messages with supported text
    await page.locator('.message').first().locator('textarea').fill('Context: informal conversation');
    await page.locator('.message').last().locator('textarea').fill('Hello. I like pizza.');

    // Wait for detection on final message
    await page.waitForTimeout(500);

    // Translate to Spanish (supported by mock) - mobile aware
    await clickLanguageButton(page, 'Spanish');

    // Should translate based on the final message
    await expect(page.locator('#output')).not.toContainText('No output yet', { timeout: 10000 });
    await expect(page.locator('#output')).toContainText('Hola. Me gusta la pizza.');
  });

  test('should handle textarea auto-sizing', async ({ page }) => {
    // Enter text in single mode
    const textarea = page.locator('textarea').first();
    const initialHeight = await textarea.evaluate(el => el.offsetHeight);

    // Fill with multi-line text
    await textarea.fill('Line 1\nLine 2\nLine 3\nLine 4');

    // Height should increase
    const newHeight = await textarea.evaluate(el => el.offsetHeight);
    expect(newHeight).toBeGreaterThan(initialHeight);
  });
});
