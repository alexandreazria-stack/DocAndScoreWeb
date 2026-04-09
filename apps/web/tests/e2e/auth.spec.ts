import { test, expect } from "@playwright/test";

/**
 * Auth flow E2E tests.
 * Requires the app to be running at http://localhost:3000
 * and a test Supabase project with email/password auth enabled.
 *
 * Set E2E_EMAIL and E2E_PASSWORD env vars for real auth tests.
 * Without them, only UI rendering tests run.
 */

const TEST_EMAIL = process.env.E2E_EMAIL ?? "test@docandscore.fr";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "testpassword123";

test.describe("Login screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders login form", async ({ page }) => {
    await expect(page.getByPlaceholder(/dr\.martin/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /se connecter/i })).toBeVisible();
  });

  test("submit is disabled with empty fields", async ({ page }) => {
    const btn = page.getByRole("button", { name: /se connecter/i });
    await expect(btn).toBeDisabled();
  });

  test("submit is disabled with invalid email", async ({ page }) => {
    await page.fill('input[placeholder*="dr.martin"]', "notanemail");
    await page.fill('input[type="password"]', "password123");
    await expect(page.getByRole("button", { name: /se connecter/i })).toBeDisabled();
  });

  test("shows error with wrong credentials", async ({ page }) => {
    await page.fill('input[placeholder*="dr.martin"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button:has-text("Se connecter")');
    await expect(page.locator("text=/Invalid|Email|Mot de passe/i")).toBeVisible({ timeout: 5000 });
  });

  test("can switch to sign-up tab", async ({ page }) => {
    await page.click("text=Créer un compte");
    await expect(page.getByText("Créer votre compte")).toBeVisible();
    await expect(page.getByPlaceholder(/retapez/i)).toBeVisible();
  });

  test("sign-up shows password mismatch error", async ({ page }) => {
    await page.click("text=Créer un compte");
    await page.fill('input[placeholder*="dr.martin"]', "new@example.com");
    await page.fill('input[placeholder*="Minimum"]', "password123");
    await page.fill('input[placeholder*="Retapez"]', "different456");
    await expect(page.getByText(/ne correspondent pas/i)).toBeVisible();
  });
});

test.describe("Auth flow (requires real Supabase)", () => {
  test.skip(!process.env.E2E_EMAIL, "E2E_EMAIL not set — skipping real auth tests");

  test("can sign in and reach dashboard", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="dr.martin"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Se connecter")');

    // Either reaches dashboard or onboarding
    await expect(page).toHaveURL("/", { timeout: 10000 });
    const hasDashboard = await page.locator("text=Tests disponibles").isVisible();
    const hasOnboarding = await page.locator("text=Votre identité").isVisible();
    expect(hasDashboard || hasOnboarding).toBe(true);
  });
});
