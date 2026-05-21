import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config.js';

export default defineConfig({
  ...baseConfig,
  testDir: './tests/visual',
  retries: 0,
  workers: 1,
  projects: [
    {
      name: 'Chromium',
      use: {},
    },
  ],
});
