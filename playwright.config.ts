import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // tests share one real Supabase account's data
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // A production build, not `next dev`: dev mode JIT-compiles each route
    // on first hit (6-12s+ per route on this machine), which made
    // navigation assertions flaky/hang-looking for reasons that had
    // nothing to do with app correctness. A prod server serves everything
    // pre-built, which is also the more realistic thing to test against.
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
