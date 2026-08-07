import { expect, test } from "@playwright/test";

test("기본 페이지를 표시한다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "STAYGRAF" })).toBeVisible();
});
