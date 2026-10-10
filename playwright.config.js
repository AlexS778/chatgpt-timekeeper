import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '*.spec.js', fullyParallel: true,
  reporter: 'list', use: { headless: true },
  projects: [
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
});
