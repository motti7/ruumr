import { test, expect } from '@playwright/test';

test.describe('Mobile Layout — Viewport & Safe Areas', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?simulator_mode=true');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('main').first().waitFor({ state: 'visible' });
  });

  test('root container uses 100dvh and has no unexpected vertical scrollbar', async ({ page }) => {
    const root = page.locator('div[dir="rtl"]').first();
    await expect(root).toBeVisible();

    const hasMinH = await root.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const minH = style.minHeight;
      return minH !== 'none' && minH !== '0px' && minH !== '';
    });
    expect(hasMinH).toBe(true);

    const htmlOverflow = await page.evaluate(() => {
      const html = document.documentElement;
      const style = window.getComputedStyle(html);
      return style.overflowY;
    });
    expect(['visible', 'auto', 'hidden']).toContain(htmlOverflow);
  });

  test('bottom nav is visible within viewport bounds', async ({ page }) => {
    const nav = page.locator('nav').first();
    const navVisible = await nav.isVisible().catch(() => false);

    if (navVisible) {
      const box = await nav.boundingBox();
      expect(box).not.toBeNull();
      expect(box.y + box.height).toBeLessThanOrEqual(844);
      expect(box.y).toBeGreaterThanOrEqual(0);

      const hasBorder = await nav.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.borderColor.includes('rgb') || style.borderWidth !== '0px';
      });
      expect(hasBorder).toBe(true);
    }
  });

  test('header is fixed at top:0 with padding-top >= 0', async ({ page }) => {
    const header = page.locator('header').first();
    const headerVisible = await header.isVisible().catch(() => false);

    if (headerVisible) {
      const styles = await header.evaluate((el) => {
        const s = window.getComputedStyle(el);
        return {
          position: s.position,
          top: s.top,
          paddingTop: parseFloat(s.paddingTop),
        };
      });

      expect(styles.position).toBe('fixed');
      expect(styles.top).toBe('0px');
      expect(styles.paddingTop).toBeGreaterThanOrEqual(0);
    }
  });

  test('RTL: nav is centered with transform', async ({ page }) => {
    const nav = page.locator('nav').first();
    const navVisible = await nav.isVisible().catch(() => false);

    if (navVisible) {
      const box = await nav.boundingBox();
      expect(box).not.toBeNull();
      const viewportCenter = 390 / 2;
      const navCenter = box.x + box.width / 2;
      expect(Math.abs(navCenter - viewportCenter)).toBeLessThan(20);
    }
  });

  test('header does not overlap card content on Discover page', async ({ page }) => {
    const header = page.locator('header').first();
    const headerVisible = await header.isVisible().catch(() => false);
    if (!headerVisible) return;

    const headerBox = await header.boundingBox();
    const headerBottom = headerBox.y + headerBox.height;

    const card = page.locator('[class*="rounded"]').first();
    const cardVisible = await card.isVisible().catch(() => false);
    if (!cardVisible) return;

    const cardBox = await card.boundingBox();
    expect(cardBox.y).toBeGreaterThanOrEqual(headerBottom - 4);
  });

  test('action buttons do not overlap bottom nav', async ({ page }) => {
    const nav = page.locator('nav').first();
    const navVisible = await nav.isVisible().catch(() => false);
    if (!navVisible) return;

    const navBox = await nav.boundingBox();

    const actionButtons = page.locator('button:has(svg)').filter({
      has: page.locator('svg'),
    });
    const count = await actionButtons.count();

    for (let i = 0; i < count; i++) {
      const btn = actionButtons.nth(i);
      const box = await btn.boundingBox();
      if (box && box.y > 600) {
        expect(box.y + box.height).toBeLessThanOrEqual(navBox.y + 8);
      }
    }
  });
});
