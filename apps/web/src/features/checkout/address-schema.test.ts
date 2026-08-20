import { describe, expect, it } from "vitest";
import {
  formatPhoneNumber,
  shippingAddressInputSchema,
} from "./address-schema";

describe("shipping address schema", () => {
  it("전화번호와 우편번호를 숫자로 정규화한다", () => {
    const result = shippingAddressInputSchema.parse({
      label: "우리 집",
      recipientName: "김스테이",
      recipientPhone: "010-1234-5678",
      postalCode: " 06236 ",
      roadAddress: "서울특별시 강남구 테헤란로 1",
      addressDetail: "101호",
      isDefault: true,
    });

    expect(result.recipientPhone).toBe("01012345678");
    expect(result.postalCode).toBe("06236");
  });

  it("필수 주소와 올바른 연락처를 요구한다", () => {
    const result = shippingAddressInputSchema.safeParse({
      label: "",
      recipientName: "김",
      recipientPhone: "123",
      postalCode: "12",
      roadAddress: "",
      addressDetail: "",
      isDefault: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining([
          "label",
          "recipientName",
          "recipientPhone",
          "postalCode",
          "roadAddress",
          "addressDetail",
        ]),
      );
    }
  });

  it("국내 휴대전화 표시 형식을 만든다", () => {
    expect(formatPhoneNumber("01012345678")).toBe("010-1234-5678");
  });
});
