import { test as base, expect } from '@playwright/test';

// Shared helper function to click language button that works on mobile and desktop
export async function clickLanguageButton(page: any, languageName: string) {
  const buttonLocator = page.locator(`.language-btn:has-text("${languageName}")`);
  
  // Check if button is visible first
  const isVisible = await buttonLocator.isVisible();
  
  if (isVisible) {
    // Button is visible, click it directly
    await buttonLocator.first().click();
  } else {
    // Button might be in dropdown on mobile
    const moreButton = page.locator('button:has-text("More")');
    if (await moreButton.isVisible()) {
      await moreButton.click();
      await page.waitForTimeout(300); // Wait for dropdown animation
      
      // Click the language in the dropdown
      await page.locator(`.menu .menu-item:has-text("${languageName}")`).click();
    } else {
      throw new Error(`Could not find ${languageName} button or More dropdown`);
    }
  }
}

export const test = base.extend({
  // Auto-setup API mocking for each test to match actual mock AISystem responses
  page: async ({ page }, use) => {
    // Mock the API responses with artificial delays to test loading states
    await page.route('**/session', route => {
      // Small delay for session establishment
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'text/plain',
          body: 'OK'
        });
      }, 100);
    });

    await page.route('**/api/translate/identify', route => {
      const request = route.request();
      const postData = request.postDataJSON();

      let lang = 'en-US'; // default from mock
      if (postData?.source?.includes('こんにちは')) lang = 'ja-JP';
      else if (postData?.source?.includes('Hola')) lang = 'es-ES';
      else if (postData?.source?.includes('Hallo')) lang = 'de-DE';
      else if (postData?.source?.includes('Hello')) lang = 'en-US';

      // Add delay to test loading indicators
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ lang })
        });
      }, 500);
    });

    await page.route('**/api/translate/start', route => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Mock responses based on target language and the actual mock AISystem responses
      let result = '';
      let sourceLang = 'en-US';

      if (postData.lang === 'ja') {
        result = 'こにちは。ピザがすきです。'; // Initial Japanese translation from mock
      } else if (postData.lang === 'es') {
        result = 'Hola. Me gusta la pizza.'; // Initial Spanish translation from mock
      } else if (postData.lang === 'de') {
        result = 'Hallo. Ich mag Pizza.'; // Initial German translation from mock
      } else {
        // For unsupported languages, return an error
        setTimeout(() => {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Unsupported language' })
          });
        }, 800);
        return;
      }

      // Add delay to test loading indicators
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            contextId: `ctx-${Date.now()}`,
            result: result,
            sourceLang: sourceLang
          })
        });
      }, 800);
    });

    await page.route('**/api/translate/improve', route => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Mock improvement responses based on feedback type and the actual mock responses
      let result = '';
      if (postData.feedback?.toLowerCase().includes('formal')) {
        // Second level responses from mock (case 4)
        if (postData.contextId?.includes('ja')) {
          result = 'こんにちは。ピザが大好きです。';
        } else if (postData.contextId?.includes('es')) {
          result = 'Hola. Me encanta la pizza.';
        } else if (postData.contextId?.includes('de')) {
          result = 'Hallo. Ich liebe Pizza.';
        } else {
          result = 'Hola. Me encanta la pizza.'; // Default to Spanish
        }
      } else if (postData.feedback?.toLowerCase().includes('detail')) {
        // Third level responses from mock (case 6)
        result = 'Hola. Me encanta la pizza porque tiene tomate y queso.';
      } else if (postData.feedback?.toLowerCase().includes('informal')) {
        // Fourth level responses from mock (case 8)
        result = '¡Hola amigo! ¡La pizza es lo mejor!';
      } else {
        // Default to formal improvement
        result = 'Hola. Me encanta la pizza.';
      }

      // Add delay to test loading indicators
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: result
          })
        });
      }, 600);
    });

    await page.route('**/api/translate/preview', route => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Preview translations using the same logic as start
      let result = '';

      if (postData.lang === 'ja') {
        result = 'こにちは。ピザがすきです。';
      } else if (postData.lang === 'es') {
        result = 'Hola. Me gusta la pizza.';
      } else if (postData.lang === 'de') {
        result = 'Hallo. Ich mag Pizza.';
      } else {
        setTimeout(() => {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Unsupported language' })
          });
        }, 600);
        return;
      }

      // Add delay to test loading indicators
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: result
          })
        });
      }, 600);
    });

    await use(page);
  }
});

export { expect };
