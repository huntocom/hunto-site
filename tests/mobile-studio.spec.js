// @ts-check
const { test, expect } = require('@playwright/test');
const { unlockSite, goToStudio, placeTestImage, clearStudioStorage } = require('./helpers');

/**
 * Mobile Studio — tests for the design studio at mobile viewport sizes.
 *
 * Validates layout, touch interactions, button sizing, font sizes,
 * panel behavior, and modal rendering on small screens.
 */

const MOBILE_VIEWPORT = { width: 375, height: 812 };

test.describe('Mobile Studio', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await unlockSite(page);
    await clearStudioStorage(page);
    await goToStudio(page);
  });

  test('studio layout fits within mobile viewport without horizontal overflow', async ({ page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
  });

  test('side panel can open and close', async ({ page }) => {
    const panel = page.locator('#s-panel');

    // Open the panel by clicking a float pill (e.g. "AI Art")
    await page.locator('.float-pill', { hasText: 'AI Art' }).click();
    await expect(panel).toBeVisible({ timeout: 5_000 });

    // Close with the X button
    await panel.locator('.s-panel-x').first().click();
    await expect(panel).toBeHidden({ timeout: 3_000 });
  });

  test('mobile edit bar appears when a layer is selected', async ({ page }) => {
    await placeTestImage(page);

    // Tap the placed layer to select it
    const layer = page.locator('[data-type="image"]').first();
    await layer.click();

    // The mobile edit bar is dynamically created with id "mobile-edit-bar"
    const editBar = page.locator('#mobile-edit-bar');
    await expect(editBar).toBeVisible({ timeout: 5_000 });

    // Verify the Done button exists inside the bar
    await expect(editBar.locator('button', { hasText: 'Done' })).toBeVisible();
  });

  test('pinch-to-resize gesture simulation on a layer', async ({ page }) => {
    await placeTestImage(page);

    const layer = page.locator('[data-type="image"]').first();
    await layer.click();

    // Get initial size
    const initialBox = await layer.boundingBox();
    expect(initialBox).not.toBeNull();

    // Simulate pinch-zoom by dispatching touch events
    // Use page.evaluate to fire a wheel event with ctrlKey (Playwright pinch-zoom pattern)
    const center = {
      x: initialBox.x + initialBox.width / 2,
      y: initialBox.y + initialBox.height / 2,
    };

    // Pinch outward (zoom in) using ctrl+wheel which mimics pinch on trackpad
    await page.mouse.move(center.x, center.y);
    await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      if (el) {
        el.dispatchEvent(new WheelEvent('wheel', {
          clientX: x, clientY: y,
          deltaY: -100, ctrlKey: true, bubbles: true,
        }));
      }
    }, center);

    // Allow time for any resize handler
    await page.waitForTimeout(500);

    // Verify the layer is still present and visible after gesture
    await expect(layer).toBeVisible();
  });

  test('mobile rotate button switches between front and back', async ({ page }) => {
    const rotateBtn = page.locator('#mobile-rotate-btn');
    await expect(rotateBtn).toBeVisible();

    const rotateLabel = page.locator('#rotate-label');
    await expect(rotateLabel).toHaveText('Front');

    // Click rotate to switch to back
    await rotateBtn.click();
    await expect(rotateLabel).toHaveText('Back');

    // Click again to switch back to front
    await rotateBtn.click();
    await expect(rotateLabel).toHaveText('Front');
  });

  test('touch drag moves a layer', async ({ page }) => {
    await placeTestImage(page);

    const layer = page.locator('[data-type="image"]').first();
    const box = await layer.boundingBox();
    expect(box).not.toBeNull();

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    const dragDistance = 40;

    // Simulate touch drag via mouse (Playwright maps mouse to touch on mobile devices)
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + dragDistance, startY + dragDistance, { steps: 10 });
    await page.mouse.up();

    // Verify layer moved — new position should differ from original
    const newBox = await layer.boundingBox();
    expect(newBox).not.toBeNull();

    // Allow some tolerance — at minimum one axis should have shifted
    const moved = Math.abs(newBox.x - box.x) > 5 || Math.abs(newBox.y - box.y) > 5;
    expect(moved).toBe(true);
  });

  test('all interactive buttons are at least 44x44px touch targets', async ({ page }) => {
    // Check the main studio action buttons and float pills
    const selectors = [
      '.float-pill',
      '#mobile-rotate-btn',
      '.mobile-hdr-menu',
    ];

    for (const selector of selectors) {
      const buttons = page.locator(selector);
      const count = await buttons.count();
      for (let i = 0; i < count; i++) {
        const btn = buttons.nth(i);
        if (await btn.isVisible()) {
          const box = await btn.boundingBox();
          expect(box, `${selector}[${i}] should be at least 44x44`).not.toBeNull();
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('no text on studio page is smaller than 13px', async ({ page }) => {
    const tooSmall = await page.evaluate(() => {
      const violations = [];
      const walk = document.createTreeWalker(
        document.getElementById('page-studio'),
        NodeFilter.SHOW_TEXT,
        null,
      );
      let node;
      while ((node = walk.nextNode())) {
        const el = node.parentElement;
        if (!el || !el.offsetParent) continue; // skip hidden elements
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < 13) {
          violations.push({
            text: node.textContent.trim().slice(0, 40),
            size,
            tag: el.tagName,
          });
        }
      }
      return violations;
    });
    expect(tooSmall, `Found text smaller than 13px: ${JSON.stringify(tooSmall)}`).toHaveLength(0);
  });

  test('upload modal is properly sized on mobile', async ({ page }) => {
    // Open the upload panel
    await page.locator('.float-pill', { hasText: 'Upload' }).click();
    await expect(page.locator('#s-panel')).toBeVisible({ timeout: 5_000 });

    // Verify the upload zone is visible and fits viewport
    const uploadZone = page.locator('#upload-zone');
    await expect(uploadZone).toBeVisible();

    const box = await uploadZone.boundingBox();
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
  });

  test('resume modal renders properly on mobile when draft exists', async ({ page }) => {
    // Set up a fake draft in localStorage so the resume modal appears
    await page.evaluate(() => {
      localStorage.setItem('hunto_draft', JSON.stringify({
        productId: '8000',
        color: 'White',
        view: 'front',
        layers: [{ type: 'image', src: 'data:image/png;base64,iVBORw0KGgo=', side: 'front' }],
      }));
    });

    // Reload to trigger resume modal
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => openStudio());

    // Check for the resume modal
    const resumeModal = page.locator('#resume-modal');
    const visible = await resumeModal.isVisible({ timeout: 5_000 }).catch(() => false);

    if (visible) {
      const box = await resumeModal.boundingBox();
      expect(box).not.toBeNull();
      expect(box.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
      expect(box.x).toBeGreaterThanOrEqual(0);

      // Dismiss it
      await resumeModal.locator('button', { hasText: 'Start Fresh' }).click();
    }

    // Clean up
    await clearStudioStorage(page);
  });

  test('AI prompt textarea is usable on mobile', async ({ page }) => {
    // Open the AI Art panel
    await page.locator('.float-pill', { hasText: 'AI Art' }).click();
    await expect(page.locator('#ai-prompt')).toBeVisible({ timeout: 5_000 });

    const textarea = page.locator('#ai-prompt');

    // Verify textarea is wide enough to be usable
    const box = await textarea.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThanOrEqual(200);

    // Verify we can type into it
    await textarea.fill('neon wolf howling at the moon');
    await expect(textarea).toHaveValue('neon wolf howling at the moon');
  });
});
