import type { CatalogProduct } from "./catalog-data";

export type AdditionalProduct = {
  id: string;
  name: string;
  price: number;
};

export type ShippingMethodId =
  "freight-delivery" | "individual-freight" | "pickup";

export type ShippingMethod = {
  id: ShippingMethodId;
  label: string;
  summary: string;
  payment: "prepaid" | "collect" | "free";
};

export const ADDITIONAL_PRODUCTS: AdditionalProduct[] = [
  { id: "tile-adhesive-20kg", name: "타일 전용 접착제 20kg", price: 15_000 },
  { id: "tile-grout-2kg", name: "타일 줄눈제 2kg", price: 8_000 },
  {
    id: "leveling-spacer-100",
    name: "타일 레벨링 스페이서 100개입",
    price: 6_000,
  },
];

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "freight-delivery",
    label: "화물 택배 배송",
    summary: "상품별 고정 배송비 · 선불",
    payment: "prepaid",
  },
  {
    id: "individual-freight",
    label: "개별 화물 운송",
    summary: "착불 · 운송비 현장 결제",
    payment: "collect",
  },
  {
    id: "pickup",
    label: "직접 수령",
    summary: "0원",
    payment: "free",
  },
];

export function isShippingMethodId(value: string): value is ShippingMethodId {
  return SHIPPING_METHODS.some((method) => method.id === value);
}

export function getShippingMethod(id: ShippingMethodId) {
  return SHIPPING_METHODS.find((method) => method.id === id)!;
}

export function getProductFreightFee(product: CatalogProduct) {
  return product.freightFee;
}

export function getShippingFee(
  product: CatalogProduct,
  shippingMethod: ShippingMethodId,
) {
  return shippingMethod === "freight-delivery"
    ? getProductFreightFee(product)
    : 0;
}

export function isProductShippingMethodAvailable(
  product: CatalogProduct,
  shippingMethod: ShippingMethodId,
) {
  return product.shippingMethodIds.includes(shippingMethod);
}

export function getProductShippingOptions(product: CatalogProduct) {
  return SHIPPING_METHODS.filter((method) =>
    isProductShippingMethodAvailable(product, method.id),
  ).map((method) => ({
    value: method.id,
    label: method.label,
    meta:
      method.id === "freight-delivery"
        ? `선불 ${getProductFreightFee(product).toLocaleString("ko-KR")}원`
        : method.summary,
  }));
}

export function getProductShippingSummary(
  product: CatalogProduct,
  shippingMethod: ShippingMethodId,
) {
  if (shippingMethod === "freight-delivery") {
    return `선불 ${getProductFreightFee(product).toLocaleString("ko-KR")}원`;
  }
  return getShippingMethod(shippingMethod).summary;
}
