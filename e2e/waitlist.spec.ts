import { test, expect } from "@playwright/test";

test.describe("Waitlist flow", () => {
  test("fill email → submit → see success state", async ({ page }) => {
    await page.goto("/");

    // Scroll the form into view
    const form = page.locator("form#waitlist");
    await form.scrollIntoViewIfNeeded();

    const emailInput = page.getByPlaceholder("ikaw@email.com");
    await emailInput.fill("e2e-test@example.com");

    const submitBtn = page.getByRole("button", { name: /sumali na/i });
    await submitBtn.click();

    // Success state
    await expect(
      page.getByText(/Salamat! Naka-list ka na\./i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/Abangan mo ang welcome email namin sa inbox mo\./i),
    ).toBeVisible();
  });

  test("empty email cannot submit (HTML5 required)", async ({ page }) => {
    await page.goto("/");

    const form = page.locator("form#waitlist");
    await form.scrollIntoViewIfNeeded();

    const submitBtn = page.getByRole("button", { name: /sumali na/i });
    await submitBtn.click();

    // HTML5 validation prevents submission — form should still be visible
    await expect(page.locator("form#waitlist")).toBeVisible();
    await expect(page.getByText(/Salamat!/i)).toHaveCount(0);
  });
});
