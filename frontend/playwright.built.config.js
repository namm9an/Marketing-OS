import { defineConfig } from '@playwright/test';
import baseline from './playwright.config.js';

// Run the same journeys against Flask's built SPA routes, without the Vite proxy.
export default defineConfig({
  ...baseline,
  use: { ...baseline.use, baseURL: 'http://127.0.0.1:5120' },
  webServer: [{ ...baseline.webServer[0], command: 'node tests/integration/start-api.mjs --built' }],
});
