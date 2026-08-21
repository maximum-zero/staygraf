import { describe, expect, it } from "vitest";
import {
  formatPhoneNumber,
  normalizeQuotationValues,
  quotationSchema,
} from "./quotation-schema";

const valid = {
  title: "성수동 현장",
  recipientOrganization: "그래프 인테리어",
  contactName: "김스테이",
  contactPhone: "010-1234-5678",
  contactEmail: "BUYER@EXAMPLE.COM",
};

describe("quotation schema", () => {
  it("수신처·담당자·연락처를 필수로 검증한다", () => {
    expect(
      quotationSchema.safeParse({
        ...valid,
        recipientOrganization: "",
        contactPhone: "123",
      }).success,
    ).toBe(false);
  });

  it("선택 이메일은 비워 둘 수 있다", () => {
    expect(
      quotationSchema.safeParse({ ...valid, contactEmail: "" }).success,
    ).toBe(true);
  });

  it("연락처와 이메일을 저장 형식으로 정규화한다", () => {
    expect(normalizeQuotationValues(valid)).toMatchObject({
      contactPhone: "01012345678",
      contactEmail: "buyer@example.com",
    });
    expect(formatPhoneNumber("01012345678")).toBe("010-1234-5678");
  });
});
