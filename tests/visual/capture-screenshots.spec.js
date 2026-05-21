import { test } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iPhone-SE', width: 375, height: 667 },
  { name: 'iPhone-14', width: 390, height: 844 },
  { name: 'iPhone-14-Pro-Max', width: 430, height: 932 },
  { name: 'Pixel-7', width: 412, height: 915 },
  { name: 'Galaxy-S21', width: 360, height: 800 },
];

const PAGES = [
  { name: 'Discover', path: '/' },
  { name: 'RuumrPlus', path: '/RuumrPlus' },
  { name: 'Matches', path: '/Matches' },
  { name: 'Profile', path: '/Profile' },
  { name: 'Settings', path: '/Settings' },
];

function withSimulatorMode(path) {
  return `${path}${path.includes('?') ? '&' : '?'}simulator_mode=true`;
}

for (const viewport of VIEWPORTS) {
  for (const page of PAGES) {
    test(`screenshot: ${page.name} @ ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page: pw }) => {
      await pw.setViewportSize({ width: viewport.width, height: viewport.height });
      await pw.goto(withSimulatorMode(page.path), { waitUntil: 'domcontentloaded', timeout: 10_000 });
      await pw.locator('main').first().waitFor({ state: 'visible', timeout: 15_000 });
      await pw.waitForTimeout(1000);

      await pw.screenshot({
        path: `tests/visual/screenshots/${viewport.name}--${page.name}.png`,
        fullPage: false,
      });
    });
  }

  test(`screenshot: ${viewport.name} dark-mode Discover`, async ({ page: pw }) => {
    await pw.setViewportSize({ width: viewport.width, height: viewport.height });
    await pw.emulateMedia({ colorScheme: 'dark' });
    await pw.goto(withSimulatorMode('/'), { waitUntil: 'domcontentloaded', timeout: 10_000 });
    await pw.locator('main').first().waitFor({ state: 'visible', timeout: 15_000 });
    await pw.waitForTimeout(1000);

    await pw.screenshot({
      path: `tests/visual/screenshots/${viewport.name}--Discover--dark.png`,
      fullPage: false,
    });
  });
}
