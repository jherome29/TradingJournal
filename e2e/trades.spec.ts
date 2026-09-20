import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_TEST_USER_A_EMAIL;
const PASSWORD = process.env.E2E_TEST_USER_A_PASSWORD;

test.skip(!EMAIL || !PASSWORD, "E2E_TEST_USER_A_EMAIL/PASSWORD not set");

test.describe("trade CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Password").fill(PASSWORD!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("log, edit, and delete a trade", async ({ page }) => {
    const marker = `e2e-${Date.now()}`;

    // --- Create ---
    await page.goto("/trades/new");

    await page.getByRole("group", { name: "Date" }).click();
    await page.keyboard.type("01152026"); // Jan 15 2026

    await page.getByLabel("Entry price").fill("2650.50");
    await page.getByLabel("Size").fill("1");
    await page.getByLabel("Notes").fill(marker);

    await page.getByRole("button", { name: "Log trade" }).click();
    await expect(page).toHaveURL(/\/trades$/);

    const row = page.locator("div", { hasText: marker }).last();
    await expect(row).toContainText(marker);

    // --- Edit ---
    await row.getByRole("link", { name: "Edit" }).click();
    await expect(page).toHaveURL(/\/trades\/.+\/edit/);

    await page.getByLabel("PnL").fill("150");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/trades$/);

    const updatedRow = page.locator("div", { hasText: marker }).last();
    await expect(updatedRow).toContainText("+$150.00");

    // --- Delete ---
    await updatedRow.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).last().click();
    await expect(page).toHaveURL(/\/trades$/);
    await expect(page.locator("div", { hasText: marker })).toHaveCount(0);
  });
});
