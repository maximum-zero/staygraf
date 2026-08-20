import { describe, expect, it } from "vitest";
import {
  createCheckoutSchema,
  DEFAULT_CHECKOUT_VALUES,
} from "./checkout-schema";

const valid = {
  ...DEFAULT_CHECKOUT_VALUES,
  ordererName: "김스테이",
  ordererPhone: "010-1234-5678",
  ordererEmail: "USER@EXAMPLE.COM",
  recipientName: "김스테이",
  recipientPhone: "01012345678",
  postalCode: "12345",
  address: "서울시 성동구",
  addressDetail: "101호",
  agreedToOrder: true,
};

describe("checkout schema", () => {
  it("배송 상품이 있으면 주소를 요구한다", () => {
    const result = createCheckoutSchema(true).safeParse({
      ...valid,
      postalCode: "",
      address: "",
      addressDetail: "",
    });
    expect(result.success).toBe(false);
  });

  it("직접 수령만 있으면 주소 없이 통과한다", () => {
    const result = createCheckoutSchema(false).safeParse({
      ...valid,
      postalCode: "",
      address: "",
      addressDetail: "",
    });
    expect(result.success).toBe(true);
  });

  it("무통장입금은 입금자명을 요구한다", () => {
    const result = createCheckoutSchema(true).safeParse({
      ...valid,
      paymentMethod: "bank-transfer",
      depositorName: "",
    });
    expect(result.success).toBe(false);
  });
});
