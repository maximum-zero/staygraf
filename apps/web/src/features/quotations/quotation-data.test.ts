import { describe, expect, it } from "vitest";
import { resolveCartBundle } from "../cart/cart-data";
import type { CartBundle } from "../cart/cart-store";
import {
  calculateQuotation,
  compareQuotationEntry,
  createQuotationEntrySnapshot,
  createQuotationSnapshot,
  generateQuotationNumber,
  getPrintableOptionLines,
  getQuotationValidUntil,
  numberToKoreanCurrency,
  toQuotationMoney,
} from "./quotation-data";

const bundle: CartBundle = {
  id: "bundle-1",
  productId: "terra-ivory-600",
  optionId: "ivory",
  variantId: "ivory-600×600",
  quantity: 2,
  shippingMethod: "freight-delivery",
  selected: true,
  unitPriceAtAdd: 29_000,
  additionalItems: [
    { productId: "tile-adhesive-20kg", quantity: 1, unitPriceAtAdd: 15_000 },
  ],
  addedAt: 1,
  updatedAt: 1,
};

describe("quotation data", () => {
  it("본품·추가 상품·선불 배송비를 일반 견적서 행으로 만든다", () => {
    const calculation = calculateQuotation([resolveCartBundle(bundle)]);
    expect(calculation.groups[0].lines.map((line) => line.lineNumber)).toEqual([
      "1",
      "1-1",
      "-",
    ]);
    expect(calculation.groups[0].note).toBe("선불");
    expect(calculation.groups[0].lines[0].optionLines).toEqual([
      "아이보리 · 600×600mm",
      "4장/BOX · 1.44㎡/BOX · 주문 2.88㎡",
    ]);
    expect(calculation.groups[0].lines[1].optionLines).toEqual([]);
    expect(calculation.productTotalIncludingVat).toBe(73_000);
    expect(calculation.prepaidShippingTotalIncludingVat).toBeGreaterThan(0);
    expect(calculation.total.includingVat).toBe(
      calculation.productTotalIncludingVat +
        calculation.prepaidShippingTotalIncludingVat,
    );
  });

  it("기존 발행 견적의 추가 상품 관계 문구는 출력하지 않는다", () => {
    expect(
      getPrintableOptionLines({
        kind: "additional",
        optionLines: ["본품 1번 추가 상품", "색상: 백색"],
      }),
    ).toEqual(["색상: 백색"]);
  });

  it("공급가액과 세액 합계가 부가세 포함 금액과 일치한다", () => {
    expect(toQuotationMoney(29_000)).toEqual({
      includingVat: 29_000,
      supply: 26_364,
      vat: 2_636,
    });
  });

  it("견적 금액을 한글 금액으로 읽는다", () => {
    expect(numberToKoreanCurrency(193_000)).toBe("금 일십구만삼천원정");
    expect(numberToKoreanCurrency(0)).toBe("금 영원정");
  });

  it("장바구니 진입 가격과 현재 가격 차이를 찾는다", () => {
    const resolved = resolveCartBundle(bundle);
    const entry = createQuotationEntrySnapshot([resolved]);
    const changed = resolveCartBundle({ ...bundle, quantity: 3 });
    expect(compareQuotationEntry(entry, [changed])).toMatchObject([
      { bundleId: "bundle-1", kind: "price", difference: 29_000 },
    ]);
  });

  it("14일 유효한 발행 스냅샷과 견적번호를 만든다", () => {
    const now = new Date("2026-08-21T10:00:00+09:00").getTime();
    const calculation = calculateQuotation([resolveCartBundle(bundle)]);
    const quotation = createQuotationSnapshot({
      draftId: "draft-1",
      memberId: "demo-member",
      values: {
        title: "",
        recipientOrganization: "그래프 인테리어",
        contactName: "김스테이",
        contactPhone: "01012345678",
        contactEmail: "demo@staygraf.kr",
      },
      calculation,
      now,
      randomValue: 0,
    });
    expect(quotation.quoteNumber).toBe("SGQ-20260821-0000");
    expect(quotation.title).toBe("자재 구매 견적");
    expect(quotation.validUntil).toBe(getQuotationValidUntil(now));
    expect(new Date(quotation.validUntil).getHours()).toBe(23);
    expect(generateQuotationNumber(now, 0.5)).toMatch(
      /^SGQ-20260821-[A-Z0-9]{4}$/,
    );
  });
});
