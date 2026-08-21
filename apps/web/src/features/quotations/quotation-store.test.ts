import { beforeEach, describe, expect, it } from "vitest";
import { resolveCartBundle } from "../cart/cart-data";
import type { CartBundle } from "../cart/cart-store";
import { calculateQuotation, createQuotationSnapshot } from "./quotation-data";
import { quotationRepository } from "./quotation-repository";
import { useQuotationStore } from "./quotation-store";

const bundle: CartBundle = {
  id: "bundle-1",
  productId: "terra-ivory-600",
  optionId: "ivory",
  variantId: "ivory-600×600",
  quantity: 1,
  shippingMethod: "pickup",
  selected: true,
  unitPriceAtAdd: 29_000,
  additionalItems: [],
  addedAt: 1,
  updatedAt: 1,
};

function createSnapshot(draftId = "draft-1", now = 1_000) {
  return createQuotationSnapshot({
    draftId,
    memberId: "demo-member",
    values: {
      title: "현장 견적",
      recipientOrganization: "그래프 인테리어",
      contactName: "김스테이",
      contactPhone: "01012345678",
      contactEmail: "",
    },
    calculation: calculateQuotation([resolveCartBundle(bundle)]),
    now,
    randomValue: 0,
  });
}

describe("quotation store", () => {
  beforeEach(() => {
    useQuotationStore.setState({ quotations: [], hydrated: true });
  });

  it("같은 초안은 중복 발행하지 않는다", () => {
    const quotation = createSnapshot();
    const first = useQuotationStore.getState().addQuotation(quotation);
    const second = useQuotationStore.getState().addQuotation({
      ...quotation,
      id: "another-id",
    });
    expect(first.id).toBe(quotation.id);
    expect(second.id).toBe(quotation.id);
    expect(useQuotationStore.getState().quotations).toHaveLength(1);
  });

  it("현재 회원 견적만 최신순으로 조회한다", () => {
    const older = createSnapshot("draft-old", 1_000);
    const newer = createSnapshot("draft-new", 2_000);
    useQuotationStore.setState({
      quotations: [older, { ...newer, memberId: "other-member" }, newer],
    });
    expect(quotationRepository.listByMember("demo-member")).toEqual([
      newer,
      older,
    ]);
  });
});
