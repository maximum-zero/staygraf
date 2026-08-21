import { expect, test, type Page } from "@playwright/test";

async function createQuotation(page: Page) {
  await page.goto("/products/terra-ivory-600");
  await page.getByRole("combobox", { name: "추가 상품 선택" }).click();
  await page.getByRole("option", { name: /타일 전용 접착제 20kg/ }).click();
  await page.getByRole("combobox", { name: "배송 방법" }).first().click();
  await page.getByRole("option", { name: /화물 택배 배송/ }).click();
  await page.getByRole("button", { name: "장바구니 담기" }).first().click();
  await page.getByRole("link", { name: /장바구니, 상품 1개/ }).click();
  await page.getByRole("button", { name: "견적서 만들기" }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=.*quotes.*new/);
  await page.getByRole("button", { name: "데모 계정 입력" }).click();
  await page.getByRole("button", { name: "로그인하고 계속하기" }).click();
  await expect(page).toHaveURL(/\/quotes\/new$/);
  await page
    .locator('input[name="recipientOrganization"]')
    .fill("그래프 인테리어");
  await page.locator('input[name="title"]').fill("성수동 카페 자재 견적");
  await page.getByRole("button", { name: "미리보기" }).click();
  await expect(page).toHaveURL(/\/quotes\/preview$/);
}

test("장바구니 선택 상품으로 견적서를 발행하고 이력에서 다시 연다", async ({
  page,
}) => {
  await createQuotation(page);

  const document = page.getByRole("article", { name: "견적서 문서" });
  await expect(
    document.getByRole("heading", { name: "견 적 서" }),
  ).toBeVisible();
  await expect(document).toContainText("[LOMEN] 트래버틴 아이보리 포세린 타일");
  await expect(document).toContainText("타일 전용 접착제 20kg");
  await expect(document).toContainText("화물 택배 배송비");
  await expect(document).toContainText("4장/BOX");
  await expect(document).toContainText("1.44㎡/BOX");
  await expect(document).not.toContainText("주문 1.44㎡");
  await expect(document).toContainText("(단위: 원)");
  await expect(document.locator(".quotation-table thead th")).toHaveText([
    "No.",
    "품명",
    "규격·옵션",
    "수량",
    "단위",
    "단가(VAT 포함)",
    "공급가액",
    "세액",
  ]);
  const shippingConditions = document.getByRole("region", {
    name: "배송 조건",
  });
  await expect(shippingConditions).toContainText("화물 택배 배송");
  await expect(shippingConditions).toContainText("선불");
  await expect(shippingConditions).not.toContainText("No.");
  await expect(document).not.toContainText("본품 1번 추가 상품");
  await expect(document).toContainText("금 ");

  await page.getByRole("button", { name: "견적서 발행" }).click();
  const confirm = page.getByRole("dialog", { name: "이 견적서를 발행할까요?" });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "발행하기" }).click();
  await expect(page).toHaveURL(/\/mypage\/quotes\/.+$/);
  await expect(page.getByText(/SGQ-\d{8}-[A-Z0-9]{4}/).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "인쇄·PDF 저장" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "견적서 관리", exact: true }).click();
  await expect(page).toHaveURL(/\/mypage\/quotes$/);
  await expect(
    page.getByText("성수동 카페 자재 견적", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("성수동 카페 자재 견적", { exact: true }),
  ).toBeVisible();
});

test("견적 입력과 미리보기는 주요 화면에서 페이지 가로 넘침이 없다", async ({
  page,
}) => {
  await createQuotation(page);

  for (const path of ["/quotes/new", "/quotes/preview"]) {
    for (const viewport of [
      { width: 320, height: 844 },
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 767, height: 900 },
      { width: 768, height: 900 },
      { width: 799, height: 900 },
      { width: 844, height: 390 },
      { width: 899, height: 900 },
      { width: 900, height: 900 },
      { width: 901, height: 900 },
      { width: 1024, height: 900 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${path} ${viewport.width}px 페이지 가로 넘침`,
      ).toBe(true);
    }
  }
});
