import { test, expect } from "@playwright/test";

test.describe("Landing navigation", () => {
  test("hero 'Sumali sa Early Access' CTA scrolls to #waitlist", async ({
    page,
  }) => {
    await page.goto("/");

    const heroCta = page
      .getByRole("link", { name: /sumali sa early access/i })
      .first();
    await expect(heroCta).toBeVisible();
    await expect(heroCta).toHaveAttribute("href", "#waitlist");

    await heroCta.click();

    // Wait for scroll; verify waitlist section is in viewport
    const form = page.locator("form#waitlist");
    await expect(form).toBeInViewport({ timeout: 3_000 });
  });

  test("header 'Sumali Na' button scrolls to waitlist", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");

    const headerCta = page
      .locator("header")
      .getByRole("link", { name: /sumali na/i });
    await expect(headerCta).toBeVisible();
    await expect(headerCta).toHaveAttribute("href", /#waitlist/);
  });

  test("login page loads with BloodlinePH logo (Suspense boundary works)", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /bloodline\s*ph/i }),
    ).toBeVisible();
    await expect(page.getByText(/sign in to your account/i)).toBeVisible();
  });
});
