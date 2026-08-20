import { beforeEach, describe, expect, it } from "vitest";
import { CHECKOUT_DRAFT_EXPIRY_MS, useCheckoutStore } from "./checkout-store";

describe("checkout store", () => {
  beforeEach(() => useCheckoutStore.getState().clearDraft());

  it("같은 선택 묶음은 작성 값을 유지한다", () => {
    const first = useCheckoutStore.getState().beginDraft(["a"], { a: 10 });
    useCheckoutStore.getState().updateValues({
      ...first.values,
      ordererName: "김스테이",
    });
    const second = useCheckoutStore.getState().beginDraft(["a"], { a: 20 });
    expect(second.id).toBe(first.id);
    expect(second.values.ordererName).toBe("김스테이");
    expect(second.entryPrices.a).toBe(20);
  });

  it("24시간 지난 초안을 제거한다", () => {
    const draft = useCheckoutStore.getState().beginDraft(["a"], { a: 10 });
    useCheckoutStore.setState({ draft: { ...draft, updatedAt: 1_000 } });
    useCheckoutStore
      .getState()
      .clearExpired(1_000 + CHECKOUT_DRAFT_EXPIRY_MS + 1);
    expect(useCheckoutStore.getState().draft).toBeNull();
  });
});
