import { expect, test } from "@playwright/test";

test("GRAF 목록에서 상세와 연결 상품을 탐색한다", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /공간에서 발견한 자재를/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "GRAF", exact: true }).click();
  await expect(page).toHaveURL(/\/graf$/);
  await expect(page.getByText("3개의 공간")).toBeVisible();
  await expect(page.getByText("스튜디오 모노")).toHaveCount(0);

  await page.getByRole("button", { name: /공간 유형/ }).click();
  await page
    .getByRole("dialog", { name: "공간 유형 선택" })
    .getByRole("button", { name: "욕실", exact: true })
    .click();
  await expect(page.getByText("1개의 공간")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "모래빛 질감으로 정돈한 배스" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /욕실/ }).click();
  await page
    .getByRole("dialog", { name: "공간 유형 선택" })
    .getByRole("button", { name: "전체", exact: true })
    .click();

  await page.getByRole("link", { name: "빛이 오래 머무는 스톤 리빙" }).click();
  await expect(
    page.getByRole("heading", { name: "빛이 오래 머무는 스톤 리빙" }),
  ).toBeVisible();
  await expect(page.locator(".graf-scene")).toHaveCount(3);
  await expect(page.locator(".graf-scene--portrait")).toHaveCount(1);
  await expect(
    page.locator(".graf-detail__facts dt").filter({ hasText: "주거 유형" }),
  ).toBeVisible();
  await expect(
    page.locator(".graf-detail__facts dd").filter({ hasText: "아파트" }),
  ).toBeVisible();
  await expect(page.getByText("공간 이야기")).toHaveCount(0);

  await page
    .getByRole("button", { name: "아이보리 트래버틴 빅슬랩 보기" })
    .first()
    .click();
  await expect(page.locator(".marker-preview")).toContainText(
    "아이보리 트래버틴 빅슬랩",
  );
  await expect(page.locator(".marker-preview")).toHaveCSS(
    "position",
    "absolute",
  );

  await expect(page.getByText("이 사진에 연결된 상품").first()).toBeVisible();
  await page.locator(".graf-scene").last().scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /사용 상품 3/ }).click();
  await expect(page.getByRole("dialog", { name: "사용 상품 3" })).toBeVisible();
  await page.getByRole("button", { name: "전체 사용 상품 닫기" }).click();
  await expect(
    page.getByRole("heading", { name: "다른 공간 둘러보기" }),
  ).toBeVisible();
});

test("GRAF 목록과 상세는 주요 화면 너비에서 가로로 깨지지 않는다", async ({
  page,
}) => {
  for (const path of ["/graf", "/graf/warm-stone-living"]) {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 768, height: 900 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const overflow = await page.evaluate(() => ({
        hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
        offenders: Array.from(document.querySelectorAll<HTMLElement>("body *"))
          .filter(
            (element) =>
              element.getBoundingClientRect().right > window.innerWidth + 1,
          )
          .slice(0, 5)
          .map((element) => `${element.tagName}.${element.className}`),
      }));
      expect(
        overflow.hasOverflow,
        `${path} ${viewport.width}px 가로 스크롤: ${overflow.offenders.join(", ")}`,
      ).toBe(false);
    }
  }
});

test("홈에서 SHOP 세부 메뉴와 상품 옵션을 탐색한다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "SHOP", exact: true }).hover();
  await expect(
    page.getByRole("group", { name: "SHOP 세부 카테고리" }),
  ).toBeVisible();
  await expect(page.getByText("세면 수전", { exact: true })).toBeVisible();

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
  for (let index = 0; index < 4; index += 1) {
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
  const shopButton = mobileMenu.getByRole("button", {
    name: "SHOP",
    exact: true,
  });
  await expect(shopButton).toBeVisible();
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
  await expect(shopButton).toBeFocused();

  await shopButton.click();
  const tileLink = mobileMenu.getByRole("link", {
    name: "타일",
    exact: true,
  });
  await expect(tileLink).toBeVisible();
  await tileLink.click();
  await expect(page).toHaveURL(/\/shop\/tile\?type=tile$/);
  await expect(page.locator("#catalog-title")).toContainText("타일 타일 상품");
  await expect(mobileMenu).not.toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.overflow))
    .toBe("");
});

test("상품 목록에서 카테고리와 필터 조건을 탐색한다", async ({ page }) => {
  await page.goto("/shop/tile?type=tile");

  await expect(page.locator("#catalog-title")).toContainText("타일 타일 상품");
  await expect(page.getByText("8개의 상품")).toBeVisible();
  const firstOptions = page
    .locator(".catalog-card")
    .filter({ hasText: "트래버틴 아이보리 포세린 타일" })
    .locator(".catalog-card__options");
  await expect(firstOptions.getByRole("button")).toHaveCount(4);
  await expect(firstOptions.getByText("+2", { exact: true })).toBeVisible();
  expect(
    await firstOptions.evaluate(
      (options) => options.scrollWidth > options.clientWidth,
    ),
  ).toBe(false);

  await page.getByRole("button", { name: /^필터/ }).click();
  const filter = page.getByRole("dialog", { name: "필터" });
  await expect(filter).toBeVisible();
  await filter.getByRole("button", { name: "스타일" }).click();
  await expect(filter.getByRole("group", { name: "스타일" })).toBeVisible();
  await filter.getByText("포세린", { exact: true }).click();
  await filter.getByRole("button", { name: /개 상품 보기/ }).click();

  await expect(page).toHaveURL(/styles=%ED%8F%AC%EC%84%B8%EB%A6%B0/);
  await expect(page.getByRole("button", { name: /포세린/ })).toBeVisible();

  await page
    .getByRole("complementary", { name: "상품 카테고리" })
    .getByRole("link", { name: "빅슬랩", exact: true })
    .click();
  await expect(page).toHaveURL(/type=big-slab/);
  await expect(page.getByText("4개의 상품")).toBeVisible();
});

test("상품 목록은 주요 화면 너비에서 가로로 깨지지 않는다", async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 844, columns: 1 },
    { width: 375, height: 844, columns: 1 },
    { width: 414, height: 844, columns: 1 },
    { width: 479, height: 844, columns: 1 },
    { width: 480, height: 844, columns: 1 },
    { width: 539, height: 844, columns: 1 },
    { width: 540, height: 844, columns: 2 },
    { width: 620, height: 844, columns: 2 },
    { width: 621, height: 844, columns: 2 },
    { width: 767, height: 900, columns: 2 },
    { width: 768, height: 900, columns: 3 },
    { width: 1023, height: 900, columns: 3 },
    { width: 1024, height: 900, columns: 4 },
    { width: 1239, height: 1000, columns: 4 },
    { width: 1240, height: 1000, columns: 4 },
    { width: 1440, height: 1000, columns: 4 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/shop/tile?type=tile");
    await expect(page.locator("#catalog-title")).toContainText(
      "타일 타일 상품",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
    await expect
      .poll(() =>
        page
          .locator(".catalog-grid")
          .evaluate(
            (grid) =>
              getComputedStyle(grid).gridTemplateColumns.split(" ").length,
          ),
      )
      .toBe(viewport.columns);
  }
});
