import { expect, test } from "@playwright/test";

test("홈에서 GRAF 상세와 연결 상품을 탐색한다", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /공간에서 발견한 자재를/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "빛이 오래 머무는 스톤 리빙" }).click();
  await expect(
    page.getByRole("heading", { name: "빛이 오래 머무는 스톤 리빙" }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "아이보리 트래버틴 빅슬랩 보기" })
    .click();
  await expect(
    page.getByRole("heading", { name: "아이보리 트래버틴 빅슬랩" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /사용 상품 3/ }).click();
  await expect(page.getByRole("dialog", { name: "사용 상품 3" })).toBeVisible();
});

test("홈에서 SHOP 세부 메뉴와 상품 옵션을 탐색한다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "SHOP", exact: true }).hover();
  await expect(
    page.getByRole("group", { name: "SHOP 세부 카테고리" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "세면 수전" })).toBeVisible();

  await page.getByRole("button", { name: "실버 이미지 보기" }).click();
  await expect(page.getByAltText("실버 트래버틴 옵션")).toBeVisible();
});

test("홈은 반응형 경계 너비에서 가로로 깨지지 않는다", async ({ page }) => {
  test.setTimeout(60_000);
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 620, height: 900 },
    { width: 621, height: 900 },
    { width: 768, height: 900 },
    { width: 900, height: 900 },
    { width: 901, height: 900 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  }
});

test("SHOP 메뉴는 키보드 순서와 닫힘 동작을 지킨다", async ({ page }) => {
  await page.goto("/");
  const shop = page.getByRole("link", { name: "SHOP", exact: true });
  const panel = page.getByRole("group", { name: "SHOP 세부 카테고리" });

  await page.getByRole("link", { name: "GRAF", exact: true }).focus();
  await shop.focus();
  await expect(panel).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveClass(/shop-reveal__title/);
  await page.keyboard.press("Escape");
  await expect(panel).not.toBeVisible();
  await expect(shop).toBeFocused();

  await page.getByRole("link", { name: "GRAF", exact: true }).focus();
  await shop.focus();
  await expect(panel).toBeVisible();
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("Tab");
  }
  await expect(page.getByRole("button", { name: "검색" })).toBeFocused();
  await expect(panel).not.toBeVisible();
});

test("터치 태블릿에서 SHOP 첫 탭은 세부 메뉴를 연다", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 768, height: 900 },
  });
  const page = await context.newPage();
  await page.goto("/");

  await page.getByRole("link", { name: "SHOP", exact: true }).click();
  await expect(
    page.getByRole("group", { name: "SHOP 세부 카테고리" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  await context.close();
});

test("모바일 메뉴에서 SHOP으로 이동한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "전체 메뉴" }).click();

  const mobileMenu = page.getByRole("navigation", {
    name: "모바일 주요 메뉴",
  });
  await expect(
    mobileMenu.getByRole("link", { name: "GRAF", exact: true }),
  ).toBeVisible();
  const shopLink = mobileMenu.getByRole("link", {
    name: "SHOP",
    exact: true,
  });
  await expect(shopLink).toBeVisible();
  await expect(mobileMenu.getByRole("link", { name: "타일" })).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.overflow))
    .toBe("hidden");

  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 500);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(scrollBefore);

  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "전체 메뉴 닫기" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(shopLink).toBeFocused();

  await shopLink.click();
  await expect(page.locator("#products")).toBeInViewport();
  await expect
    .poll(() =>
      page
        .locator("#products")
        .evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeGreaterThanOrEqual(62);
  await expect(mobileMenu).not.toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.overflow))
    .toBe("");
});
