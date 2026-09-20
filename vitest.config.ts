import { configDefaults, defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    // Integration tests hit the real Supabase project over the network and
    // have their own runner (test:integration) so a flaky network call
    // never fails the fast, required "npm test" used by CI.
    exclude: [...configDefaults.exclude, "**/*.integration.test.ts", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Coverage is currently only meaningful for lib/ (pure, unit-tested
      // logic) -- app/ is pages and components, exercised manually/e2e,
      // not by these unit tests. No threshold enforced yet; this is
      // reporting-only until there's enough tested surface to gate on.
      include: ["lib/**/*.ts"],
      exclude: ["lib/**/*.test.ts", "lib/types.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
