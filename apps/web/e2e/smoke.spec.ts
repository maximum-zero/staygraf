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
  expect(
    await page
      .locator(".catalog-card__image")
      .first()
      .evaluate((image) => image.getBoundingClientRect().height),
  ).toBeGreaterThan(100);

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

test("상품 상세 구성을 장바구니에 담고 배송 그룹을 변경한다", async ({
  page,
}) => {
  await page.goto("/products/terra-ivory-600");

  await page.getByRole("combobox", { name: "추가 상품 선택" }).click();
  await page.getByRole("option", { name: /타일 전용 접착제 20kg/ }).click();
  await page.getByRole("combobox", { name: "배송 방법" }).first().click();
  await page.getByRole("option", { name: /화물 택배 배송/ }).click();
  await page.getByRole("button", { name: "장바구니 담기" }).first().click();

  await expect(page.getByText("장바구니에 상품을 담았습니다.")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /장바구니, 상품 1개/ }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: /장바구니, 상품 1개/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: /장바구니, 상품 1개/ }).click();

  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("heading", { name: "장바구니" })).toBeVisible();
  await expect(
    page.getByText("화물 택배 배송", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("타일 전용 접착제 20kg")).toBeVisible();
  await expect(page.getByText("선불 배송비")).toBeVisible();

  await page.getByRole("combobox", { name: /배송 방법 변경/ }).click();
  await page.getByRole("option", { name: /직접 수령/ }).click();
  await expect(
    page.getByText("직접 수령", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("0원", { exact: true }).first()).toBeVisible();

  await page
    .getByRole("button", { name: "타일 전용 접착제 20kg 삭제" })
    .click();
  await expect(
    page.getByText("타일 전용 접착제 20kg을 삭제했습니다."),
  ).toBeVisible();
  await page.getByRole("button", { name: /실행 취소/ }).click();
  await expect(page.getByText("타일 전용 접착제 20kg")).toBeVisible();
});

test("장바구니는 주요 화면 너비에서 가로로 깨지지 않는다", async ({ page }) => {
  await page.goto("/products/terra-ivory-600");
  await page.getByRole("combobox", { name: "배송 방법" }).first().click();
  await page.getByRole("option", { name: /화물 택배 배송/ }).click();
  await page.getByRole("button", { name: "장바구니 담기" }).first().click();

  for (const viewport of [
    { width: 320, height: 844 },
    { width: 390, height: 844 },
    { width: 768, height: 900 },
    { width: 1024, height: 900 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "장바구니" })).toBeVisible();
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
      `${viewport.width}px 가로 스크롤: ${overflow.offenders.join(", ")}`,
    ).toBe(false);
  }
});

test("선택 장바구니를 모의 로그인 후 주문 완료한다", async ({ page }) => {
  await page.goto("/products/terra-ivory-600");
  await page.getByRole("combobox", { name: "배송 방법" }).first().click();
  await page.getByRole("option", { name: /직접 수령/ }).click();
  await page.getByRole("button", { name: "장바구니 담기" }).first().click();
  await page.getByRole("link", { name: /장바구니, 상품 1개/ }).click();
  await page.getByRole("button", { name: "선택 상품 주문" }).click();

  await expect(page).toHaveURL(
    /\/login\?returnTo=%2Fcheckout|\/login\?returnTo=\/checkout/,
  );
  await page.getByRole("button", { name: "데모 계정 입력" }).click();
  await page.getByRole("button", { name: "로그인하고 계속하기" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(
    page.getByRole("heading", { name: "주문·결제", exact: true }).last(),
  ).toBeVisible();
  await expect(
    page.getByText("직접 수령", { exact: true }).first(),
  ).toBeVisible();
  const agreement = page.getByLabel(/주문 상품, 가격과 결제 조건/);
  await page
    .getByRole("button", { name: /결제하기$/ })
    .last()
    .click();
  await expect(agreement).toBeFocused();
  await expect(
    page.getByText("주문 내용과 결제 조건에 동의해 주세요."),
  ).toBeVisible();
  await agreement.check();
  await page
    .getByRole("button", { name: /결제하기$/ })
    .last()
    .click();

  await expect(page).toHaveURL(/\/orders\/.+\/complete$/);
  await expect(
    page.getByRole("heading", { name: "주문이 완료되었습니다." }),
  ).toBeVisible();
  await expect(page.getByText(/주문번호 SG-/)).toBeVisible();
});

test("배송지를 검색해 저장하고 주문서에 적용한다", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "kakao", {
      configurable: true,
      value: {
        Postcode: class {
          private readonly options: {
            oncomplete: (data: {
              zonecode: string;
              roadAddress: string;
            }) => void;
          };

          constructor(options: {
            oncomplete: (data: {
              zonecode: string;
              roadAddress: string;
            }) => void;
          }) {
            this.options = options;
          }

          open() {
            this.options.oncomplete({
              zonecode: "06236",
              roadAddress: "서울특별시 강남구 테헤란로 1",
            });
          }
        },
      },
    });
  });

  await page.goto("/products/terra-ivory-600");
  await page.getByRole("combobox", { name: "배송 방법" }).first().click();
  await page.getByRole("option", { name: /화물 택배 배송/ }).click();
  await page.getByRole("button", { name: "장바구니 담기" }).first().click();
  await page.getByRole("link", { name: /장바구니, 상품 1개/ }).click();
  await page.getByRole("button", { name: "선택 상품 주문" }).click();
  await page.getByRole("button", { name: "데모 계정 입력" }).click();
  await page.getByRole("button", { name: "로그인하고 계속하기" }).click();

  await page.getByLabel(/주문 상품, 가격과 결제 조건/).check();
  await page
    .getByRole("button", { name: /결제하기$/ })
    .last()
    .click();
  await expect(page.getByRole("button", { name: "배송지 입력" })).toBeFocused();
  await expect(page.getByText("배송지를 입력해 주세요.")).toBeVisible();
  await page.getByRole("button", { name: "배송지 입력" }).click();
  let dialog = page.getByRole("dialog", { name: "배송지 추가" });
  await expect(dialog).toBeVisible();
  const addressLabel = dialog.getByLabel("배송지명");
  await addressLabel.focus();
  await addressLabel.blur();
  await expect(addressLabel).toHaveAttribute("aria-invalid", "true");
  await expect(addressLabel.locator("..")).toHaveClass(
    /address-editor__field has-error/,
  );
  await expect(dialog.getByRole("alert")).toHaveText(
    "배송지명을 입력해 주세요.",
  );
  await addressLabel.fill("우리 집");
  await dialog.getByRole("button", { name: "배송지 관리 닫기" }).click();
  const discardDialog = page.getByRole("alertdialog", {
    name: "작성 중인 내용이 있습니다.",
  });
  await expect(discardDialog).toBeVisible();
  await expect(
    discardDialog.getByRole("button", { name: "계속 작성" }),
  ).toBeFocused();
  await discardDialog.getByRole("button", { name: "계속 작성" }).click();
  await expect(addressLabel).toHaveValue("우리 집");
  await dialog.getByLabel("수령인").fill("김스테이");
  await dialog.getByLabel("연락처").fill("01012345678");
  await dialog.getByRole("button", { name: "주소 검색" }).click();
  await expect(dialog.getByLabel("우편번호")).toHaveValue("06236");
  await expect(dialog.getByLabel("도로명 주소")).toHaveValue(
    "서울특별시 강남구 테헤란로 1",
  );
  await dialog.getByLabel("상세주소").fill("101호");
  await dialog.getByRole("button", { name: "배송지 저장" }).click();

  dialog = page.getByRole("dialog", { name: "배송지 관리" });
  await expect(dialog.getByText(/주문서에 적용했습니다/)).toBeVisible();
  await dialog.getByRole("button", { name: "배송지 관리 닫기" }).click();
  const shippingRegion = page.getByRole("region", { name: "배송지 정보" });
  await expect(shippingRegion).toContainText("우리 집");
  await expect(shippingRegion).toContainText(
    "서울특별시 강남구 테헤란로 1 101호",
  );

  await page.reload();
  await expect(page.getByRole("region", { name: "배송지 정보" })).toContainText(
    "우리 집",
  );
  await page.getByRole("button", { name: "변경", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "배송지 관리" });
  await expect(
    dialog.locator(".address-card__select").filter({ hasText: "우리 집" }),
  ).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "우리 집 삭제" }).click();
  await expect(
    dialog.getByText("우리 집 배송지를 삭제했습니다."),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "실행 취소" }).click();
  await expect(dialog.getByText("삭제한 배송지를 복구했습니다.")).toBeVisible();
});

test("체크아웃 화면은 주요 너비에서 가로로 깨지지 않는다", async ({ page }) => {
  await page.goto("/products/terra-ivory-600");
  await page.getByRole("combobox", { name: "배송 방법" }).first().click();
  await page.getByRole("option", { name: /화물 택배 배송/ }).click();
  await page.getByRole("button", { name: "장바구니 담기" }).first().click();
  await page.getByRole("link", { name: /장바구니, 상품 1개/ }).click();
  await page.getByRole("button", { name: "선택 상품 주문" }).click();
  await page.getByRole("button", { name: "데모 계정 입력" }).click();
  await page.getByRole("button", { name: "로그인하고 계속하기" }).click();

  for (const viewport of [
    { width: 320, height: 844 },
    { width: 390, height: 844 },
    { width: 768, height: 900 },
    { width: 1024, height: 900 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#checkout-form")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
      `${viewport.width}px 체크아웃 가로 스크롤`,
    ).toBe(false);
    await page.getByRole("button", { name: "배송지 입력" }).click();
    const dialog = page.getByRole("dialog", { name: "배송지 추가" });
    await expect(dialog).toBeVisible();
    await dialog.evaluate((element) =>
      Promise.all(
        element
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      ),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
      `${viewport.width}px 배송지 관리 가로 스크롤`,
    ).toBe(false);
    const targets = await dialog.locator("button").evaluateAll((buttons) =>
      buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
    );
    expect(
      targets.every(({ width, height }) => width >= 44 && height >= 44),
      `${viewport.width}px 배송지 관리 44px 조작 영역: ${JSON.stringify(targets)}`,
    ).toBe(true);
    await dialog.getByRole("button", { name: "배송지 관리 닫기" }).click();
  }
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
    const overflow = await page.evaluate(() => ({
      width: window.innerWidth,
      page: document.documentElement.scrollWidth,
      offenders: Array.from(document.querySelectorAll<HTMLElement>("body *"))
        .filter(
          (element) =>
            element.getBoundingClientRect().right > window.innerWidth + 1,
        )
        .slice(0, 5)
        .map((element) => `${element.tagName}.${element.className}`),
    }));
    expect(
      overflow.page,
      `${overflow.width}px: ${overflow.offenders.join(", ")}`,
    ).toBeLessThanOrEqual(overflow.width);
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

test("상품 상세에서 색상·규격·계산 수량과 가격 위계를 확인한다", async ({
  page,
}) => {
  await page.goto("/products/terra-ivory-600?option=silver");

  await expect(
    page.getByRole("heading", { name: "트래버틴 아이보리 포세린 타일" }),
  ).toBeVisible();
  await expect(page.getByAltText("실버 트래버틴 타일")).toBeVisible();
  await expect(page.locator(".product-order-price")).toContainText(
    "1BOX29,000원공급가 26,364원",
  );
  await expect(page.locator(".product-unit-prices")).not.toContainText("1㎡");
  await expect(page.locator(".product-gallery__thumbs button")).toHaveCount(3);
  await expect(page.locator(".product-total")).toContainText("29,000원");
  await expect(page.locator(".product-total")).not.toContainText("공급가");

  await page.getByRole("button", { name: /600×1200mm/ }).click();
  await expect(page.locator(".product-total")).toContainText("34,000원");

  const likeButton = page.getByRole("button", { name: "좋아요", exact: true });
  await likeButton.click();
  await expect(
    page.getByRole("button", { name: "좋아요 취소" }),
  ).toHaveAttribute("aria-pressed", "true");

  const selectedSize = page.getByRole("button", { name: /600×1200mm/ });
  await expect(selectedSize).toHaveCSS("color", "rgb(47, 125, 72)");

  await page.getByRole("button", { name: "주문 수량 계산기" }).click();
  await expect(
    page.getByRole("dialog", { name: "주문 수량 계산기" }),
  ).toBeVisible();
  await page.getByRole("spinbutton", { name: "필요 면적" }).fill("3");
  await page.getByRole("button", { name: "주문 수량에 적용" }).click();
  await expect(
    page.getByRole("spinbutton", { name: "수량 직접 입력" }),
  ).toHaveValue("3");
  await expect(page.locator(".product-total")).toContainText("102,000원");
  await page.getByRole("spinbutton", { name: "수량 직접 입력" }).fill("2");
  await expect(page.locator(".product-total")).toContainText("68,000원");

  await page.getByRole("button", { name: "포토 리뷰", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "포토 리뷰", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "답변대기 1" }).click();
  await expect(page.locator(".product-qna")).toHaveCount(1);
  await expect(page.locator(".product-qna")).toContainText(
    "영업소 수령 가능한 지역",
  );
  await page.getByRole("button", { name: "전체 4" }).click();
  await expect(page.locator(".product-qna--private")).toHaveCount(2);
  await expect(page.locator(".product-qna--private").first()).toContainText(
    "비밀글입니다.",
  );

  const shipping = page
    .locator(".product-buybox")
    .getByRole("combobox", { name: "배송 방법" });
  await expect(shipping).toContainText("배송 방법을 선택해 주세요");
  await expect(
    page
      .locator(".product-buybox")
      .getByRole("button", { name: "장바구니 담기" }),
  ).toBeDisabled();
  await shipping.focus();
  await page.keyboard.press("ArrowDown");
  await expect(shipping).toHaveAttribute("aria-expanded", "true");
  await expect(
    page
      .locator(".product-buybox")
      .getByRole("option", { name: "화물 택배 배송" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(shipping).toBeFocused();
  await expect(shipping).toHaveAttribute("aria-expanded", "false");
  await shipping.click();
  await page
    .locator(".product-buybox")
    .getByRole("option", { name: "개별 화물 운송" })
    .click();
  await expect(shipping).toContainText("개별 화물 운송");
  await page.getByRole("combobox", { name: "추가 상품 선택" }).click();
  await page
    .locator(".product-buybox")
    .getByRole("option", { name: /타일 전용 접착제 20kg/ })
    .click();
  await expect(page.locator(".product-buybox .product-total")).toContainText(
    "83,000원",
  );
  await expect(
    page.locator(".product-buybox").getByRole("spinbutton", {
      name: "타일 전용 접착제 20kg 수량 직접 입력",
    }),
  ).toHaveValue("1");
  await page
    .locator(".product-buybox")
    .getByRole("combobox", { name: "추가 상품 선택" })
    .click();
  await page
    .locator(".product-buybox")
    .getByRole("option", { name: /타일 전용 접착제 20kg/ })
    .click();
  await expect(
    page.locator(".product-buybox").getByRole("spinbutton", {
      name: "타일 전용 접착제 20kg 수량 직접 입력",
    }),
  ).toHaveValue("2");
  await expect(page.locator(".product-buybox .product-total")).toContainText(
    "98,000원",
  );
  await page
    .locator(".product-buybox")
    .getByRole("button", { name: "타일 전용 접착제 20kg 삭제" })
    .click();
  await expect(page.locator(".product-buybox .product-total")).toContainText(
    "68,000원",
  );

  const tabs = page.getByRole("navigation", { name: "상품 상세 항목" });
  await expect(tabs.getByRole("link")).toHaveText([
    "상품정보",
    "배송·교환",
    "리뷰 12",
    "Q&A 4",
  ]);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/products/terra-ivory-600?option=ivory");
  await page
    .locator(".product-buybox")
    .getByRole("combobox", { name: "배송 방법" })
    .click();
  await page
    .locator(".product-buybox")
    .getByRole("option", { name: "직접 수령" })
    .click();
  await page
    .locator(".product-buybox")
    .getByRole("combobox", { name: "추가 상품 선택" })
    .click();
  await page
    .locator(".product-buybox")
    .getByRole("option", { name: /타일 전용 접착제 20kg/ })
    .click();
  const buybox = page.locator(".product-buybox");
  await expect(buybox).toHaveCSS("position", "static");
  await expect(page.locator(".product-compact-purchase")).toHaveCount(0);
  await page
    .locator("#product-info")
    .evaluate((element) =>
      window.scrollTo(
        0,
        element.getBoundingClientRect().top + window.scrollY + 220,
      ),
    );
  const compactPurchase = page.locator(".product-compact-purchase");
  await expect(compactPurchase).toBeVisible();
  await expect(compactPurchase).not.toContainText(
    "트래버틴 아이보리 포세린 타일",
  );
  await expect(compactPurchase).not.toContainText("공급가");
  await expect(compactPurchase).toContainText("색상");
  await expect(compactPurchase).toContainText("규격");
  await expect(compactPurchase).toContainText("44,000원");
  await expect(compactPurchase).toContainText("타일 전용 접착제 20kg");
  await expect(compactPurchase).toContainText("본품 1BOX · 추가 상품 1종");
  await expect(
    page
      .locator(".product-buybox__utilities")
      .getByRole("button", { name: "좋아요", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".product-buybox__utilities")
      .getByRole("button", { name: "상품 공유" }),
  ).toBeVisible();
  await expect(
    compactPurchase.getByRole("button", { name: "장바구니 담기" }),
  ).toBeVisible();
  await expect(
    compactPurchase.getByRole("button", { name: "바로 구매" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole("navigation", { name: "상품 상세 항목" })
        .evaluate((element) => Math.round(element.getBoundingClientRect().top)),
    )
    .toBe(72);

  const headerLeft = await page
    .locator(".site-header__inner")
    .evaluate((element) => Math.round(element.getBoundingClientRect().left));
  const detailLeft = await page
    .locator(".product-detail__shell")
    .evaluate((element) => Math.round(element.getBoundingClientRect().left));
  expect(detailLeft).toBe(headerLeft);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/products/terra-ivory-600?option=ivory");
  const mobilePurchase = page.locator(".product-mobile-purchase");
  await expect(mobilePurchase).toHaveCSS("position", "fixed");
  await mobilePurchase.getByRole("button", { name: "구매하기" }).click();
  await expect(page.getByRole("dialog", { name: "옵션 선택" })).toBeVisible();
  const optionSheet = page.getByRole("dialog", { name: "옵션 선택" });
  await expect(
    optionSheet.getByRole("button", { name: "장바구니 담기" }),
  ).toBeDisabled();
  await expect(
    optionSheet.getByRole("button", { name: "바로 구매" }),
  ).toBeVisible();
  await optionSheet.getByRole("combobox", { name: "배송 방법" }).click();
  await optionSheet.getByRole("option", { name: "화물 택배 배송" }).click();
  await optionSheet.getByRole("button", { name: "장바구니 담기" }).click();
  await expect(page.getByRole("status")).toContainText(
    "장바구니에 상품을 담았습니다",
  );
  await expect(page.getByRole("link", { name: "장바구니 보기" })).toBeVisible();
});

test("상품 상세는 주요 화면 너비에서 가로로 깨지지 않는다", async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 844 },
    { width: 390, height: 844 },
    { width: 768, height: 900 },
    { width: 1024, height: 900 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/products/terra-ivory-600?option=ivory");
    const overflow = await page.evaluate(() => ({
      width: window.innerWidth,
      page: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      bodyRect: {
        left: Math.round(document.body.getBoundingClientRect().left),
        right: Math.round(document.body.getBoundingClientRect().right),
      },
      offenders: Array.from(document.querySelectorAll<HTMLElement>("body *"))
        .filter(
          (element) =>
            element.getBoundingClientRect().right > window.innerWidth + 1 ||
            element.scrollWidth > element.clientWidth + 1,
        )
        .reverse()
        .slice(0, 12)
        .map((element) => {
          const bounds = element.getBoundingClientRect();
          return `${element.tagName}.${element.className}[${Math.round(bounds.left)}..${Math.round(bounds.right)};${element.clientWidth}/${element.scrollWidth}]`;
        }),
    }));
    expect(
      overflow.page,
      `${overflow.width}px body=${overflow.body} rect=${JSON.stringify(overflow.bodyRect)}: ${overflow.offenders.join(", ")}`,
    ).toBeLessThanOrEqual(overflow.width);

    if (viewport.width === 1024) {
      const actionsBottom = await page
        .locator(".product-buybox .product-actions")
        .evaluate((element) => element.getBoundingClientRect().bottom);
      expect(actionsBottom).toBeLessThanOrEqual(viewport.height);
    }

    if (viewport.width === 768) {
      await expect(page.locator(".product-mobile-purchase")).toBeHidden();
    }
  }
});
