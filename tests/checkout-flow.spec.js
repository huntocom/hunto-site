// @ts-check
const { test, expect } = require('@playwright/test');
const { unlockSite, goToStudio, placeTestImage, clearStudioStorage } = require('./helpers');

/**
 * Checkout Flow — tests for the checkout page form validation.
 *
 * The checkout page (#page-checkout) has:
 * - Contact fields: #co2-email, #co2-phone
 * - Name fields: #co2-fname, #co2-lname
 * - Address fields: #co2-address, #co2-city, #co2-state, #co2-zip
 * - IP disclaimer checkbox: #co2-ip-agree
 * - Submit button: #co2-submit-btn (calls submitCheckoutOrder())
 *
 * submitCheckoutOrder() validates:
 * 1. Email is non-empty and contains @
 * 2. First and last name are non-empty
 * 3. Address is non-empty
 * 4. City, state, and zip are filled
 * 5. IP disclaimer checkbox is checked
 * If any fail, sNtf() shows an error message.
 */

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await unlockSite(page);
    await clearStudioStorage(page);
  });

  test('submitting without IP disclaimer shows error', async ({ page }) => {
    // Navigate directly to checkout page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof showPage === 'function', { timeout: 10_000 });

    // Go to checkout page directly
    await page.evaluate(() => showPage('checkout'));
    await page.waitForSelector('#page-checkout', { timeout: 5_000 });

    // Fill in all required fields EXCEPT the IP disclaimer checkbox
    await page.fill('#co2-email', 'test@example.com');
    await page.fill('#co2-fname', 'John');
    await page.fill('#co2-lname', 'Doe');
    await page.fill('#co2-address', '123 Main St');
    await page.fill('#co2-city', 'Springfield');
    await page.selectOption('#co2-state', { index: 1 }); // Pick first state
    await page.fill('#co2-zip', '62701');

    // Verify the checkbox is NOT checked
    const ipCheckbox = page.locator('#co2-ip-agree');
    await expect(ipCheckbox).not.toBeChecked();

    // Listen for the notification toast (sNtf creates a temporary element)
    // We'll check that the submit function returns early with an error
    const errorMessage = await page.evaluate(async () => {
      // Capture sNtf calls by monkey-patching temporarily
      let lastMsg = '';
      const origNtf = window.sNtf;
      window.sNtf = (msg) => { lastMsg = msg; if (origNtf) origNtf(msg); };

      await submitCheckoutOrder();

      window.sNtf = origNtf;
      return lastMsg;
    });

    // The error should mention rights/designs (IP disclaimer validation)
    expect(errorMessage).toContain('rights');
    expect(errorMessage.toLowerCase()).toContain('design');
  });

  test('checking the IP disclaimer checkbox allows form progression', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof showPage === 'function', { timeout: 10_000 });

    await page.evaluate(() => showPage('checkout'));
    await page.waitForSelector('#page-checkout', { timeout: 5_000 });

    // Fill all required fields
    await page.fill('#co2-email', 'test@example.com');
    await page.fill('#co2-fname', 'John');
    await page.fill('#co2-lname', 'Doe');
    await page.fill('#co2-address', '123 Main St');
    await page.fill('#co2-city', 'Springfield');
    await page.selectOption('#co2-state', { index: 1 });
    await page.fill('#co2-zip', '62701');

    // Check the IP disclaimer checkbox
    await page.locator('#co2-ip-agree').check();
    await expect(page.locator('#co2-ip-agree')).toBeChecked();

    // Submit — should NOT show the IP disclaimer error anymore.
    // It may show other errors (no items in cart) or proceed to Shopify,
    // but the IP disclaimer validation should pass.
    const errorMessage = await page.evaluate(async () => {
      let lastMsg = '';
      const origNtf = window.sNtf;
      window.sNtf = (msg) => { lastMsg = msg; if (origNtf) origNtf(msg); };

      await submitCheckoutOrder();

      window.sNtf = origNtf;
      return lastMsg;
    });

    // The error should NOT be about IP/rights (that validation passed)
    if (errorMessage) {
      expect(errorMessage).not.toContain('rights');
    }
  });

  test('submitting with empty email shows email error', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof showPage === 'function', { timeout: 10_000 });

    await page.evaluate(() => showPage('checkout'));
    await page.waitForSelector('#page-checkout', { timeout: 5_000 });

    // Leave email empty, try to submit
    const errorMessage = await page.evaluate(async () => {
      let lastMsg = '';
      const origNtf = window.sNtf;
      window.sNtf = (msg) => { lastMsg = msg; if (origNtf) origNtf(msg); };

      await submitCheckoutOrder();

      window.sNtf = origNtf;
      return lastMsg;
    });

    // Should show email validation error
    expect(errorMessage.toLowerCase()).toContain('email');
  });

  test('submitting with empty name shows name error', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof showPage === 'function', { timeout: 10_000 });

    await page.evaluate(() => showPage('checkout'));
    await page.waitForSelector('#page-checkout', { timeout: 5_000 });

    // Fill email but leave name empty
    await page.fill('#co2-email', 'test@example.com');

    const errorMessage = await page.evaluate(async () => {
      let lastMsg = '';
      const origNtf = window.sNtf;
      window.sNtf = (msg) => { lastMsg = msg; if (origNtf) origNtf(msg); };

      await submitCheckoutOrder();

      window.sNtf = origNtf;
      return lastMsg;
    });

    // Should mention name
    expect(errorMessage.toLowerCase()).toContain('name');
  });

  test('IP disclaimer checkbox is present and has correct label text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof showPage === 'function', { timeout: 10_000 });

    await page.evaluate(() => showPage('checkout'));
    await page.waitForSelector('#page-checkout', { timeout: 5_000 });

    // Verify the checkbox exists
    await expect(page.locator('#co2-ip-agree')).toBeVisible();

    // Verify the label text mentions copyright/trademark
    const labelText = await page.locator('#co2-ip-agree').locator('..').textContent();
    expect(labelText).toContain('copyright');
    expect(labelText).toContain('trademark');
    expect(labelText).toContain('permission');
  });
});
