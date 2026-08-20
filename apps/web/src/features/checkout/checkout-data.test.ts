import { describe, expect, it } from "vitest";
import { resolveCartBundle } from "../cart/cart-data";
import type { CartBundle } from "../cart/cart-store";
import { DEFAULT_CHECKOUT_VALUES } from "./checkout-schema";
import {
  createOrderSnapshot,
  generateOrderNumber,
  getCheckoutSummary,
  getDepositDeadline,
  toMoneySnapshot,
} from "./checkout-data";

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

describe("checkout data", () => {
  it("부가세 포함 금액을 공급가액과 부가세로 보존한다", () => {
    expect(toMoneySnapshot(29_000)).toEqual({
      includingVat: 29_000,
      supply: 26_364,
      vat: 2_636,
    });
  });

  it("선불 배송비만 최종 결제 금액에 포함한다", () => {
    const resolved = resolveCartBundle(bundle);
    const summary = getCheckoutSummary([resolved]);
    expect(summary.productTotal).toBe(73_000);
    expect(summary.shippingTotal).toBeGreaterThan(0);
    expect(summary.total).toBe(summary.productTotal + summary.shippingTotal);
  });

  it("무통장 주문 스냅샷과 입금 기한을 만든다", () => {
    const now = new Date("2026-08-19T10:00:00+09:00").getTime();
    const order = createOrderSnapshot({
      draftId: "draft-1",
      values: {
        ...DEFAULT_CHECKOUT_VALUES,
        ordererName: "김스테이",
        ordererPhone: "01012345678",
        ordererEmail: "demo@staygraf.kr",
        recipientName: "김스테이",
        recipientPhone: "01012345678",
        postalCode: "12345",
        address: "서울시 성동구",
        addressDetail: "101호",
        paymentMethod: "bank-transfer",
        depositorName: "김스테이",
        agreedToOrder: true,
      },
      bundles: [resolveCartBundle(bundle)],
      now,
      randomValue: 0,
    });
    expect(order.status).toBe("awaiting-deposit");
    expect(order.orderNumber).toBe("SG-20260819-0000");
    expect(order.depositDeadline).toBe(getDepositDeadline(now));
    expect(order.items[0].additionalItems).toHaveLength(1);
  });

  it("주문번호 형식을 유지한다", () => {
    expect(generateOrderNumber(new Date("2026-08-19").getTime(), 0.5)).toMatch(
      /^SG-20260819-[A-Z0-9]{4}$/,
    );
  });
});
