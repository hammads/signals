import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("unauthenticated user is redirected from /dashboard to /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page loads correctly when redirected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: /Welcome back/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continue with Google/i })
    ).toBeVisible();
  });

  test("navigation elements exist on login page", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("link", { name: /AI Signals Radar/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Sign up/i })
    ).toBeVisible();
  });
});
