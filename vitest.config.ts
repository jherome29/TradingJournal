import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
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
