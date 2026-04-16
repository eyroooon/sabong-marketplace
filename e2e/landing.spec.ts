import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and renders the hero + compliance banner", async ({ page }) => {
    await page.goto("/");

    // Compliance banner — DOM text uses Title Case, CSS uppercase in banner
    await expect(
      page.getByText("100% Legal", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Walang Betting", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Pure Marketplace Lang", { exact: true }),
    ).toBeVisible();

    // Hero
    await expect(
      page.getByRole("heading", { name: /bumili\. magbenta\./i }),
    ).toBeVisible();
    await expect(
      page.getByText(/Ang Unang Trusted Gamefowl Marketplace sa Pinas/i),
    ).toBeVisible();

    // Primary CTA
    await expect(
      page.getByRole("link", { name: /sumali sa early access/i }).first(),
    ).toBeVisible();
  });

  test("renders the Sabungero Social Feed (no TikTok)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Sabungero Social Feed/i)).toBeVisible();
    // Ensure no TikTok mentions survive
    await expect(page.getByText(/tiktok/i)).toHaveCount(0);
  });
});
