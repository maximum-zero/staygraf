import { beforeEach, describe, expect, it } from "vitest";
import { useQuotationDraftStore } from "./quotation-draft-store";

const entry = {
  fingerprint: "entry-1",
  bundleCount: 1,
  totalIncludingVat: 29_000,
  bundles: [
    {
      bundleId: "bundle-1",
      productName: "타일",
      available: true,
      mainUnitPrice: 29_000,
      productTotal: 29_000,
      shippingFee: 0,
      additionalPrices: {},
    },
  ],
};

describe("quotation draft store", () => {
  beforeEach(() => useQuotationDraftStore.getState().clearDraft());

  it("같은 장바구니 선택은 입력값을 유지하며 가격 기준만 갱신한다", () => {
    useQuotationDraftStore.getState().beginDraft(["bundle-1"], entry);
    useQuotationDraftStore.getState().updateValues({
      title: "현장 A",
      recipientOrganization: "스테이 인테리어",
      contactName: "김스테이",
      contactPhone: "01012345678",
      contactEmail: "",
    });
    const previousId = useQuotationDraftStore.getState().draft!.id;
    useQuotationDraftStore
      .getState()
      .beginDraft(["bundle-1"], { ...entry, fingerprint: "entry-2" });
    expect(useQuotationDraftStore.getState().draft).toMatchObject({
      id: previousId,
      values: { title: "현장 A" },
      entry: { fingerprint: "entry-2" },
    });
  });

  it("비로그인 초안은 최초 로그인 회원에게 귀속된다", () => {
    useQuotationDraftStore.getState().beginDraft(["bundle-1"], entry);
    expect(
      useQuotationDraftStore.getState().claimForMember("demo-member"),
    ).toBe(true);
    expect(useQuotationDraftStore.getState().draft?.memberId).toBe(
      "demo-member",
    );
    expect(useQuotationDraftStore.getState().claimForMember("other")).toBe(
      false,
    );
  });
});
