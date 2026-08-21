import {
  catalogProducts,
  getCatalogVariants,
  getRepresentativeMedia,
} from "../catalog/catalog-data";
import {
  ADDITIONAL_PRODUCTS,
  getShippingFee,
  getShippingMethod,
  isProductShippingMethodAvailable,
  type ShippingMethodId,
} from "../catalog/purchase-data";
import type { CartBundle } from "./cart-store";

export type ResolvedAdditionalItem = CartBundle["additionalItems"][number] & {
  name: string;
  currentPrice: number;
  priceChanged: boolean;
  available: boolean;
};

export type ResolvedCartBundle = {
  bundle: CartBundle;
  product: (typeof catalogProducts)[number] | null;
  optionLabel: string;
  variantLabel: string;
  orderUnitLabel: string;
  piecesPerOrder: number | null;
  coveragePerOrder: number | null;
  weightPerOrder: number | null;
  image: string;
  imageAlt: string;
  currentUnitPrice: number | null;
  priceChanged: boolean;
  additionalItems: ResolvedAdditionalItem[];
  productTotal: number;
  shippingFee: number;
  shippingAvailable: boolean;
  available: boolean;
};

export function resolveCartBundle(bundle: CartBundle): ResolvedCartBundle {
  const product =
    catalogProducts.find((item) => item.id === bundle.productId) ?? null;
  const option = product?.options.find((item) => item.id === bundle.optionId);
  const variant = product
    ? getCatalogVariants(product).find((item) => item.id === bundle.variantId)
    : undefined;
  const media = option ? getRepresentativeMedia(option) : undefined;
  const additionalItems = bundle.additionalItems.map((item) => {
    const current = ADDITIONAL_PRODUCTS.find(
      (productItem) => productItem.id === item.productId,
    );
    return {
      ...item,
      name: current?.name ?? "판매 종료된 추가 상품",
      currentPrice: current?.price ?? item.unitPriceAtAdd,
      priceChanged: current ? current.price !== item.unitPriceAtAdd : false,
      available: Boolean(current),
    };
  });
  const currentUnitPrice = variant?.priceIncludingVat ?? null;
  const shippingAvailable = Boolean(
    product && isProductShippingMethodAvailable(product, bundle.shippingMethod),
  );
  const productTotal =
    (currentUnitPrice ?? 0) * bundle.quantity +
    additionalItems.reduce(
      (sum, item) => sum + item.currentPrice * item.quantity,
      0,
    );
  const available = Boolean(
    product &&
    option &&
    variant &&
    currentUnitPrice !== null &&
    shippingAvailable &&
    additionalItems.every((item) => item.available),
  );

  return {
    bundle,
    product,
    optionLabel: option?.label ?? "선택 옵션 종료",
    variantLabel: variant
      ? `${variant.size}mm${variant.thickness ? ` · ${variant.thickness}` : ""}`
      : "선택 규격 종료",
    orderUnitLabel: variant?.orderUnit === "BOX" ? "BOX" : "장",
    piecesPerOrder: variant?.piecesPerOrder ?? null,
    coveragePerOrder: variant?.coveragePerOrder ?? null,
    weightPerOrder: variant?.weightPerOrder ?? null,
    image:
      media?.src ??
      product?.coverMedia?.src ??
      "/images/products/travertine-slab-ivory.png",
    imageAlt: media?.alt ?? product?.name ?? "상품 이미지",
    currentUnitPrice,
    priceChanged:
      currentUnitPrice !== null && currentUnitPrice !== bundle.unitPriceAtAdd,
    additionalItems,
    productTotal,
    shippingFee: product ? getShippingFee(product, bundle.shippingMethod) : 0,
    shippingAvailable,
    available,
  };
}

export function groupResolvedBundles(bundles: ResolvedCartBundle[]) {
  return (
    ["freight-delivery", "individual-freight", "pickup"] as ShippingMethodId[]
  )
    .map((shippingMethod) => ({
      shippingMethod,
      method: getShippingMethod(shippingMethod),
      bundles: bundles.filter(
        (item) => item.bundle.shippingMethod === shippingMethod,
      ),
    }))
    .filter((group) => group.bundles.length > 0);
}

export function getCartSummary(bundles: ResolvedCartBundle[]) {
  const selected = bundles.filter(
    (item) => item.bundle.selected && item.available,
  );
  const productTotal = selected.reduce(
    (sum, item) => sum + item.productTotal,
    0,
  );
  const shippingTotal = selected.reduce(
    (sum, item) => sum + item.shippingFee,
    0,
  );
  return {
    selectedCount: selected.length,
    productTotal,
    shippingTotal,
    total: productTotal + shippingTotal,
    hasCollect: selected.some(
      (item) => item.bundle.shippingMethod === "individual-freight",
    ),
  };
}
