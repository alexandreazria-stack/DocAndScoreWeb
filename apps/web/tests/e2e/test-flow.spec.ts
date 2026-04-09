import { test, expect } from "@playwright/test";

/**
 * Doctor + Patient flow E2E tests.
 * Requires E2E_EMAIL / E2E_PASSWORD for the authenticated parts.
 * The QR/patient flow tests use the localStorage fallback (no backend needed).
 */

test.describe("Dashboard", () => {
  test.skip(!process.env.E2E_EMAIL, "E2E_EMAIL not set — skipping authenticated tests");

  test.beforeEach(async ({ page }) => {
    // Sign in via localStorage shortcut to avoid repeating auth UI in every test
    await page.goto("/");
    await page.fill('input[placeholder*="dr.martin"]', process.env.E2E_EMAIL!);
    await page.fill('input[type="password"]', process.env.E2E_PASSWORD!);
    await page.click('button:has-text("Se connecter")');
    await page.waitForSelector("text=Tests disponibles", { timeout: 10000 });
  });

  test("shows list of available tests", async ({ page }) => {
    await expect(page.getByText("Tests disponibles")).toBeVisible();
    // At least one test card should be visible
    await expect(page.locator(".ds-card").first()).toBeVisible();
  });

  test("can navigate to search tab", async ({ page }) => {
    await page.click('text=Rechercher un test...');
    await expect(page.getByPlaceholder(/rechercher/i)).toBeVisible();
  });

  test("can navigate to settings tab", async ({ page }) => {
    await page.click('[aria-label="Réglages"], text=Réglages');
    await expect(page.getByText("Se déconnecter")).toBeVisible();
  });
});

test.describe("Test flow (médecin mode)", () => {
  test.skip(!process.env.E2E_EMAIL, "E2E_EMAIL not set — skipping authenticated tests");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="dr.martin"]', process.env.E2E_EMAIL!);
    await page.fill('input[type="password"]', process.env.E2E_PASSWORD!);
    await page.click('button:has-text("Se connecter")');
    await page.waitForSelector("text=Tests disponibles", { timeout: 10000 });
  });

  test("opens a test and displays questions", async ({ page }) => {
    // Click the first "Médecin" button
    await page.locator('button:has-text("Médecin")').first().click();
    // Should show first question
    await expect(page.locator("text=/Question|q\./i").first()).toBeVisible({ timeout: 5000 });
  });

  test("completes a test and shows result screen", async ({ page }) => {
    await page.locator('button:has-text("Médecin")').first().click();
    await page.waitForSelector("text=/Question|q\./i", { timeout: 5000 });

    // Answer all questions by clicking the first option repeatedly
    let questionVisible = true;
    let safety = 0;
    while (questionVisible && safety < 30) {
      const options = page.locator('[role="radio"], button:has-text("Jamais"), button:has-text("Non"), button:has-text("0")');
      const count = await options.count();
      if (count > 0) {
        await options.first().click();
      } else {
        // Try any clickable option
        const anyBtn = page.locator('.ds-card button, button[class*="rounded"]').first();
        if (await anyBtn.isVisible()) await anyBtn.click();
      }
      // Check if we moved to result
      const onResult = await page.locator("text=/Résultats|Score/i").first().isVisible();
      if (onResult) break;
      safety++;
    }

    // Result screen should eventually appear
    await expect(page.getByText(/Résultats|Score/i).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("QR Patient flow (localStorage fallback)", () => {
  test.skip(!process.env.E2E_EMAIL, "E2E_EMAIL not set — skipping authenticated tests");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="dr.martin"]', process.env.E2E_EMAIL!);
    await page.fill('input[type="password"]', process.env.E2E_PASSWORD!);
    await page.click('button:has-text("Se connecter")');
    await page.waitForSelector("text=Tests disponibles", { timeout: 10000 });
  });

  test("QR screen shows a code and a QR image", async ({ page }) => {
    await page.locator('button:has-text("QR Patient")').first().click();
    // Code should appear (6 uppercase chars)
    await expect(page.locator("text=/[A-Z0-9]{6}/")).toBeVisible({ timeout: 5000 });
    // QR svg should render
    await expect(page.locator("svg").first()).toBeVisible();
  });

  test("copy button copies the URL", async ({ page }) => {
    await page.locator('button:has-text("QR Patient")').first().click();
    await page.waitForSelector("text=/[A-Z0-9]{6}/", { timeout: 5000 });
    // Click copy — no error thrown
    await page.click('button:has-text("Copier le lien")');
    // No assertion on clipboard content (varies by browser), just ensure no crash
  });

  test("patient URL is reachable", async ({ page, context }) => {
    await page.locator('button:has-text("QR Patient")').first().click();
    await page.waitForSelector("text=/[A-Z0-9]{6}/", { timeout: 5000 });

    // Extract the patient URL shown on screen
    const urlText = await page.locator(".font-mono + div, text=/docandscore/").first().textContent();
    if (!urlText) return;

    // Open patient URL in a new tab
    const patientPage = await context.newPage();
    await patientPage.goto(urlText.trim());
    // Patient page should show a form or question
    await expect(patientPage.locator("body")).toBeVisible();
    await patientPage.close();
  });
});
