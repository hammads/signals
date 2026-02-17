import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("loads the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AI Signals Radar/);
  });

  test("has correct headline", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /Know Who's Ready to Buy/i })
    ).toBeVisible();
    await expect(
      page.getByText(/Before You Reach Out/i)
    ).toBeVisible();
  });

  test("has feature section", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Intelligence That Moves the Needle/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Funding Signals/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /RFP & Board Activity/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Competitor Intel/i })
    ).toBeVisible();
  });

  test("has CTA button linking to /signup", async ({ page }) => {
    await page.goto("/");
    const ctaButton = page.getByRole("link", { name: /Get Started Free/i }).first();
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveAttribute("href", "/signup");
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/");

    const signUpLink = page.getByRole("link", { name: /Sign Up/i }).first();
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();
    await expect(page).toHaveURL(/\/signup/);

    await page.goto("/");
    const loginLink = page.getByRole("link", { name: /Login/i }).first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/");
    const logoLink = page.getByRole("link", { name: /AI Signals Radar/i });
    await expect(logoLink).toBeVisible();
    await logoLink.click();
    await expect(page).toHaveURL("/");
  });

  test("has How It Works section", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /How It Works/i })
    ).toBeVisible();
  });
});
