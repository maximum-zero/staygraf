import {
  getCartSummary,
  groupResolvedBundles,
  resolveCartBundle,
  type ResolvedCartBundle,
} from "../cart/cart-data";
import type { CartBundle } from "../cart/cart-store";
import { getShippingMethod } from "../catalog/purchase-data";
import type { CheckoutFormValues } from "./checkout-schema";
import {
  ORDER_EXPIRY_MS,
  type MoneySnapshot,
  type OrderSnapshot,
} from "../orders/order-store";

export const MOCK_BANK_ACCOUNT = {
  bankName: "STAY은행",
  accountNumber: "123-456-789012",
  accountHolder: "스테이그라프",
} as const;

export function formatPrice(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function resolveCheckoutBundles(
  bundles: CartBundle[],
  selectedBundleIds: string[],
) {
  const idSet = new Set(selectedBundleIds);
  return bundles
    .filter((bundle) => idSet.has(bundle.id))
    .map(resolveCartBundle);
}

export function getCheckoutSummary(bundles: ResolvedCartBundle[]) {
  const selected = bundles.map((item) => ({
    ...item,
    bundle: { ...item.bundle, selected: true },
  }));
  return getCartSummary(selected);
}

export function requiresShippingAddress(bundles: ResolvedCartBundle[]) {
  return bundles.some((item) => item.bundle.shippingMethod !== "pickup");
}

export function getCheckoutEntryPrices(bundles: ResolvedCartBundle[]) {
  return Object.fromEntries(
    bundles.map((item) => [
      item.bundle.id,
      item.productTotal + item.shippingFee,
    ]),
  );
}

export function hasCheckoutChanged(
  bundles: ResolvedCartBundle[],
  entryPrices: Record<string, number>,
) {
  return bundles.some(
    (item) =>
      !item.available ||
      entryPrices[item.bundle.id] !== item.productTotal + item.shippingFee,
  );
}

export function toMoneySnapshot(includingVat: number): MoneySnapshot {
  const supply = Math.round(includingVat / 1.1);
  return { includingVat, supply, vat: includingVat - supply };
}

export function generateOrderNumber(now: number, randomValue = Math.random()) {
  const date = new Date(now);
  const ymd = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = Math.floor(randomValue * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0")
    .slice(-4);
  return `SG-${ymd}-${suffix}`;
}

export function getDepositDeadline(now: number) {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(23, 59, 0, 0);
  return next.getTime();
}

function getDeliveryRequest(values: CheckoutFormValues) {
  if (values.deliveryRequest === "custom") return values.customDeliveryRequest;
  if (values.deliveryRequest === "call-site-manager") {
    return "현장 담당자에게 연락 바랍니다.";
  }
  return "배송 전 연락 바랍니다.";
}

export function createOrderSnapshot({
  draftId,
  values,
  bundles,
  now = Date.now(),
  randomValue,
}: {
  draftId: string;
  values: CheckoutFormValues;
  bundles: ResolvedCartBundle[];
  now?: number;
  randomValue?: number;
}): OrderSnapshot {
  const summary = getCheckoutSummary(bundles);
  const items = bundles.map((item) => {
    if (!item.product || item.currentUnitPrice === null) {
      throw new Error("구매할 수 없는 상품이 포함되어 있습니다.");
    }
    const mainTotal = item.currentUnitPrice * item.bundle.quantity;
    return {
      cartBundleId: item.bundle.id,
      productId: item.product.id,
      productName: item.product.name,
      brand: item.product.brand,
      collection: item.product.collection,
      optionId: item.bundle.optionId,
      optionLabel: item.optionLabel,
      variantId: item.bundle.variantId,
      variantLabel: item.variantLabel,
      orderUnitLabel: item.orderUnitLabel,
      quantity: item.bundle.quantity,
      image: item.image,
      unitPrice: toMoneySnapshot(item.currentUnitPrice),
      mainProductTotal: toMoneySnapshot(mainTotal),
      additionalItems: item.additionalItems.map((additional) => ({
        productId: additional.productId,
        name: additional.name,
        quantity: additional.quantity,
        unitPrice: toMoneySnapshot(additional.currentPrice),
        totalPrice: toMoneySnapshot(
          additional.currentPrice * additional.quantity,
        ),
      })),
      productTotalIncludingVat: item.productTotal,
    };
  });
  const shippingGroups = groupResolvedBundles(bundles).map((group) => ({
    method: group.shippingMethod,
    label: group.method.label,
    payment: getShippingMethod(group.shippingMethod).payment,
    itemIds: group.bundles.map((item) => item.bundle.id),
    prepaidFee: group.bundles.reduce((sum, item) => sum + item.shippingFee, 0),
  }));
  const orderNumber = generateOrderNumber(now, randomValue);
  const isBankTransfer = values.paymentMethod === "bank-transfer";

  return {
    id: `${orderNumber}-${Math.random().toString(36).slice(2, 7)}`,
    draftId,
    orderNumber,
    status: isBankTransfer ? "awaiting-deposit" : "paid",
    paymentMethod: values.paymentMethod,
    orderer: {
      name: values.ordererName,
      phone: values.ordererPhone,
      email: values.ordererEmail,
    },
    recipient: {
      name: values.recipientName,
      phone: values.recipientPhone,
      postalCode: values.postalCode,
      address: values.address,
      addressDetail: values.addressDetail,
      deliveryRequest: getDeliveryRequest(values),
    },
    items,
    shippingGroups,
    productTotalIncludingVat: summary.productTotal,
    prepaidShippingTotal: summary.shippingTotal,
    totalPayment: summary.total,
    hasCollectShipping: summary.hasCollect,
    depositorName: isBankTransfer ? values.depositorName : null,
    bankAccount: isBankTransfer ? { ...MOCK_BANK_ACCOUNT } : null,
    depositDeadline: isBankTransfer ? getDepositDeadline(now) : null,
    createdAt: now,
    expiresAt: now + ORDER_EXPIRY_MS,
  };
}
