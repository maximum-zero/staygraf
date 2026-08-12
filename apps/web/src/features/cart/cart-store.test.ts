import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore, type AddCartBundleInput } from "./cart-store";

const baseInput: AddCartBundleInput = {
  productId: "terra-ivory-600",
  optionId: "ivory",
  variantId: "ivory-600×600",
  quantity: 1,
  shippingMethod: "freight-delivery",
  unitPriceAtAdd: 29_000,
  additionalItems: [
    { productId: "tile-adhesive-20kg", quantity: 1, unitPriceAtAdd: 15_000 },
  ],
};

describe("cart store", () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    vi.restoreAllMocks();
  });

  it("같은 본품과 추가 상품 종류 조합은 수량을 합친다", () => {
    useCartStore.getState().addBundle(baseInput);
    const result = useCartStore.getState().addBundle({
      ...baseInput,
      quantity: 2,
      additionalItems: [
        {
          productId: "tile-adhesive-20kg",
          quantity: 3,
          unitPriceAtAdd: 15_000,
        },
      ],
    });

    expect(result.merged).toBe(true);
    expect(useCartStore.getState().bundles).toHaveLength(1);
    expect(useCartStore.getState().bundles[0].quantity).toBe(3);
    expect(useCartStore.getState().bundles[0].additionalItems[0].quantity).toBe(
      4,
    );
  });

  it("추가 상품 종류가 다르면 별도 묶음으로 저장한다", () => {
    useCartStore.getState().addBundle(baseInput);
    useCartStore.getState().addBundle({
      ...baseInput,
      additionalItems: [
        { productId: "tile-grout-2kg", quantity: 1, unitPriceAtAdd: 8_000 },
      ],
    });

    expect(useCartStore.getState().bundles).toHaveLength(2);
  });

  it("배송 방법 변경 후에도 선택 상태를 유지한다", () => {
    useCartStore.getState().addBundle(baseInput);
    const bundle = useCartStore.getState().bundles[0];
    useCartStore.getState().setShippingMethod(bundle.id, "pickup");

    expect(useCartStore.getState().bundles[0]).toMatchObject({
      shippingMethod: "pickup",
      selected: true,
    });
  });

  it("배송 방법 변경으로 구성이 같아지면 하나의 묶음으로 합친다", () => {
    useCartStore.getState().addBundle(baseInput);
    useCartStore.getState().addBundle({
      ...baseInput,
      quantity: 2,
      shippingMethod: "pickup",
      additionalItems: [
        {
          productId: "tile-adhesive-20kg",
          quantity: 3,
          unitPriceAtAdd: 15_000,
        },
      ],
    });
    const pickupBundle = useCartStore
      .getState()
      .bundles.find((bundle) => bundle.shippingMethod === "pickup")!;

    useCartStore
      .getState()
      .setShippingMethod(pickupBundle.id, "freight-delivery");

    expect(useCartStore.getState().bundles).toHaveLength(1);
    expect(useCartStore.getState().bundles[0].quantity).toBe(3);
    expect(useCartStore.getState().bundles[0].additionalItems[0].quantity).toBe(
      4,
    );
  });

  it("추가 상품 실행 취소는 그 사이 바꾼 본품 수량을 유지한다", () => {
    useCartStore.getState().addBundle(baseInput);
    const bundle = useCartStore.getState().bundles[0];
    const removed = useCartStore
      .getState()
      .removeAdditional(bundle.id, "tile-adhesive-20kg")!;
    useCartStore.getState().setBundleQuantity(bundle.id, 4);

    useCartStore.getState().restoreAdditional(bundle.id, removed);

    expect(useCartStore.getState().bundles[0].quantity).toBe(4);
    expect(useCartStore.getState().bundles[0].additionalItems).toEqual([
      removed,
    ]);
  });

  it("추가 상품 삭제로 구성이 같아지면 기존 묶음과 합친다", () => {
    useCartStore.getState().addBundle(baseInput);
    useCartStore.getState().addBundle({ ...baseInput, additionalItems: [] });
    const bundleWithAdditional = useCartStore
      .getState()
      .bundles.find((bundle) => bundle.additionalItems.length > 0)!;

    useCartStore
      .getState()
      .removeAdditional(bundleWithAdditional.id, "tile-adhesive-20kg");

    expect(useCartStore.getState().bundles).toHaveLength(1);
    expect(useCartStore.getState().bundles[0].quantity).toBe(2);
  });

  it("삭제한 묶음과 같은 구성을 다시 담은 뒤 복원하면 수량을 합친다", () => {
    useCartStore.getState().addBundle(baseInput);
    const removed = useCartStore
      .getState()
      .removeBundle(useCartStore.getState().bundles[0].id)!;
    useCartStore.getState().addBundle({ ...baseInput, quantity: 2 });

    useCartStore.getState().restoreBundle(removed);

    expect(useCartStore.getState().bundles).toHaveLength(1);
    expect(useCartStore.getState().bundles[0].quantity).toBe(3);
  });

  it("30일이 지난 묶음은 제거한다", () => {
    useCartStore.getState().addBundle(baseInput);
    const bundle = useCartStore.getState().bundles[0];
    useCartStore.setState({
      bundles: [{ ...bundle, updatedAt: 1_000 }],
    });
    useCartStore.getState().clearExpired(1_000 + 31 * 24 * 60 * 60 * 1000);

    expect(useCartStore.getState().bundles).toHaveLength(0);
  });
});
