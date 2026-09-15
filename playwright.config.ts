import { defineConfig, devices } from '@playwright/test';

const PORT = 4600;
const baseURL = `http://localhost:${PORT}`;

/** Browser accessibility suite. Run with `npm run test:a11y`; `ng test` runs only unit tests. */
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Port 4600 stays clear of 4200 to 4500, which other dev servers of this app have held.
    command: `npx ng serve --port ${PORT}`,
    url: `${baseURL}/users`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
