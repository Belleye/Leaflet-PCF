import { defineConfig } from "@playwright/test";
export default defineConfig({
    testDir: "./tests/browser", fullyParallel: false,
    use: { baseURL: "http://127.0.0.1:5173", headless: true, viewport: { width: 1440, height: 1050 } },
    webServer: { command: "npm run dev -- --port 5173 --strictPort", url: "http://127.0.0.1:5173", reuseExistingServer: !process.env.CI },
    projects: [{ name: "desktop", use: { browserName: "chromium" } },
        { name: "tablet", use: { browserName: "chromium", viewport: { width: 1024, height: 1366 }, hasTouch: true } }],
});
