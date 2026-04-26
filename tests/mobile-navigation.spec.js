// @ts-check
const { test, expect } = require('@playwright/test');
const { unlockSite } = require('./helpers');

/**
 * Mobile Navigation — tests for hamburger menu, page navigation,
 * horizontal overflow, cart drawer, and footer readability on mobile.
 */

const MOBILE_VIEWPORT = { width: 375, height: 812 };

test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await unlockSite(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('hamburger menu opens and shows navigation links', async ({ page }) => {
    const hamburger = page.locator('.mobile-hdr-menu');
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible({ timeout: 3_000 });

    // Verify key navigation links are present
    await expect(mobileMenu.locator('.mobile-nav-link', { hasText: 'Home' })).toBeVisible();
    await expect(mobileMenu.locator('.mobile-nav-link', { hasText: 'All Products' })).toBeVisible();
    await expect(mobileMenu.locator('.mobile-nav-link', { hasText: 'T-Shirts' })).toBeVisible();
  });

  test('hamburger menu can be closed', async ({ page }) => {
    await page.locator('.mobile-hdr-menu').click();
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible({ timeout: 3_000 });

    await page.locator('.mobile-menu-close').click();
    await expect(mobileMenu).toBeHidden({ timeout: 3_000 });
  });

  test('navigate to shop page via hamburger menu', async ({ page }) => {
    await page.locator('.mobile-hdr-menu').click();
    await page.locator('.mobile-nav-link', { hasText: 'All Products' }).click();

    // Shop page should become active
    await expect(page.locator('#page-shop')).toBeVisible({ timeout: 10_000 });

    // Menu should close after navigation
    await expect(page.locator('#mobile-menu')).toBeHidden({ timeout: 3_000 });
  });

  test('navigate to studio via hamburger menu', async ({ page }) => {
    await page.locator('.mobile-hdr-menu').click();

    // "Start Designing" button in the mobile menu
    await page.locator('#mobile-menu button', { hasText: 'Start Designing' }).click();

    await expect(page.locator('#page-studio')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#mobile-menu')).toBeHidden({ timeout: 3_000 });
  });

  test('navigate between home, shop, and about pages', async ({ page }) => {
    // Start on home
    await expect(page.locator('#page-home')).toBeVisible();

    // Go to shop
    await page.evaluate(() => goShop(''));
    await expect(page.locator('#page-shop')).toBeVisible({ timeout: 10_000 });

    // Go to about
    await page.evaluate(() => showAboutPage());
    await expect(page.locator('#page-about')).toBeVisible({ timeout: 5_000 });

    // Back to home
    await page.evaluate(() => goHome());
    await expect(page.locator('#page-home')).toBeVisible({ timeout: 5_000 });
  });

  test('no horizontal overflow on home page', async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
  });

  test('no horizontal overflow on shop page', async ({ page }) => {
    await page.evaluate(() => goShop(''));
    await page.waitForTimeout(2_000); // Allow products to render
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
  });

  test('no horizontal overflow on about page', async ({ page }) => {
    await page.evaluate(() => showAboutPage());
    await page.waitForTimeout(1_000);
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
  });

  test('no horizontal overflow on studio page', async ({ page }) => {
    await page.waitForFunction(() => typeof PRODUCTS !== 'undefined' && PRODUCTS.length > 0, {
      timeout: 15_000,
    });
    await page.evaluate(() => openStudio());
    await page.waitForSelector('#page-studio.active, #page-studio[style*="display: block"]', {
      timeout: 10_000,
    });
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
  });

  test('cart drawer opens and closes on mobile', async ({ page }) => {
    const cartDrawer = page.locator('#cart-drawer');

    // Open cart via the header cart action
    await page.locator('#hdr-cart-count').click();
    await expect(cartDrawer).toBeVisible({ timeout: 3_000 });

    // Cart drawer body should be visible
    await expect(page.locator('#cart-drawer-body')).toBeVisible();

    // Cart total should be visible
    await expect(page.locator('#cart-drawer-total')).toBeVisible();

    // Close drawer — look for the close button (X)
    const closeBtn = page.locator('.cart-drawer-close, #cart-drawer button', { hasText: '\u00d7' }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await expect(cartDrawer).toBeHidden({ timeout: 3_000 });
    }
  });

  test('footer is readable on mobile', async ({ page }) => {
    // Scroll to the bottom of the page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check that footer text is at least 13px
    const smallText = await page.evaluate(() => {
      const violations = [];
      const footerEl = document.querySelector('footer');
      if (!footerEl) return violations;
      const walk = document.createTreeWalker(footerEl, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walk.nextNode())) {
        const el = node.parentElement;
        if (!el || !el.offsetParent) continue;
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < 13 && node.textContent.trim().length > 0) {
          violations.push({
            text: node.textContent.trim().slice(0, 30),
            size,
          });
        }
      }
      return violations;
    });

    expect(smallText, `Footer text smaller than 13px: ${JSON.stringify(smallText)}`).toHaveLength(0);
  });

  test('footer fits within mobile viewport width', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const footerBox = await page.locator('footer').boundingBox();
    expect(footerBox).not.toBeNull();
    expect(footerBox.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
  });
});
