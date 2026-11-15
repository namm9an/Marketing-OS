import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

export default defineConfig({
  testDir: './tests/integration',
  workers: 1,
  fullyParallel: false,
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:5179',
    browserName: 'chromium',
    viewport: { width: 1366, height: 768 },
    launchOptions: { executablePath },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    { command: 'node tests/integration/start-api.mjs', url: 'http://127.0.0.1:5120/api/health', timeout: 60_000 },
    { command: 'npm run dev -- --host 127.0.0.1 --port 5179 --strictPort',
      url: 'http://127.0.0.1:5179', timeout: 60_000, env: { MARKETING_OS_API_TARGET: 'http://127.0.0.1:5120' } },
  ],
});
