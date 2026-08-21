import type { ResolvedCartBundle } from "../cart/cart-data";
import { groupResolvedBundles, resolveCartBundle } from "../cart/cart-data";
import type { CartBundle } from "../cart/cart-store";
import type { ShippingMethodId } from "../catalog/purchase-data";
import { getShippingMethod } from "../catalog/purchase-data";
import type { QuotationFormValues } from "./quotation-schema";

export const QUOTATION_VALID_DAYS = 14;

export const MOCK_QUOTATION_ISSUER = {
  name: "STAYGRAF",
  businessNumber: "000-00-00000",
  representative: "미등록",
  address: "서울특별시 성동구 성수이로 00",
  businessType: "도소매업",
  businessItem: "인테리어 자재",
  phone: "02-0000-0000",
  email: "contact@staygraf.example",
} as const;

export type QuotationMoney = {
  includingVat: number;
  supply: number;
  vat: number;
};

export type QuotationLine = {
  id: string;
  lineNumber: string;
  kind: "main" | "additional" | "shipping";
  bundleId: string | null;
  parentLineNumber: string | null;
  productId: string | null;
  productName: string;
  optionLines: string[];
  unit: string;
  quantity: number;
  regularUnitPriceIncludingVat: number;
  appliedUnitPriceIncludingVat: number;
  discountIncludingVat: number;
  total: QuotationMoney;
};

const LEGACY_ADDITIONAL_RELATION = /^본품 \d+번 추가 상품$/;

export function getPrintableOptionLines(
  line: Pick<QuotationLine, "kind" | "optionLines">,
) {
  if (line.kind !== "additional") return line.optionLines;
  return line.optionLines.filter(
    (option) => !LEGACY_ADDITIONAL_RELATION.test(option),
  );
}

export type QuotationShippingGroup = {
  method: ShippingMethodId;
  label: string;
  payment: "prepaid" | "collect" | "free";
  lines: QuotationLine[];
  note: string;
};

export type QuotationCalculation = {
  groups: QuotationShippingGroup[];
  bundleCount: number;
  productLineCount: number;
  regularProductTotalIncludingVat: number;
  productDiscountIncludingVat: number;
  productTotalIncludingVat: number;
  prepaidShippingTotalIncludingVat: number;
  total: QuotationMoney;
  hasCollectShipping: boolean;
  fingerprint: string;
};

export type QuotationEntryBundle = {
  bundleId: string;
  productName: string;
  available: boolean;
  mainUnitPrice: number | null;
  productTotal: number;
  shippingFee: number;
  additionalPrices: Record<string, number>;
};

export type QuotationEntrySnapshot = {
  fingerprint: string;
  bundleCount: number;
  totalIncludingVat: number;
  bundles: QuotationEntryBundle[];
};

export type QuotationChange = {
  bundleId: string;
  productName: string;
  kind: "price" | "unavailable" | "removed";
  previousTotal: number;
  currentTotal: number | null;
  difference: number | null;
};

export type QuotationIssuerSnapshot = {
  name: string;
  businessNumber: string;
  representative: string;
  address: string;
  businessType: string;
  businessItem: string;
  phone: string;
  email: string;
};

export type QuotationSnapshot = {
  id: string;
  draftId: string;
  memberId: string;
  quoteNumber: string;
  title: string;
  recipient: {
    organization: string;
    contactName: string;
    phone: string;
    email: string;
  };
  issuer: QuotationIssuerSnapshot;
  calculation: QuotationCalculation;
  issuedAt: number;
  validUntil: number;
};

export function formatPrice(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function toQuotationMoney(includingVat: number): QuotationMoney {
  const supply = Math.round(includingVat / 1.1);
  return { includingVat, supply, vat: includingVat - supply };
}

function createLine({
  id,
  lineNumber,
  kind,
  bundleId,
  parentLineNumber = null,
  productId,
  productName,
  optionLines,
  unit,
  quantity,
  regularUnitPriceIncludingVat,
  appliedUnitPriceIncludingVat,
}: Omit<
  QuotationLine,
  "discountIncludingVat" | "total" | "parentLineNumber"
> & {
  parentLineNumber?: string | null;
}) {
  const totalIncludingVat = appliedUnitPriceIncludingVat * quantity;
  return {
    id,
    lineNumber,
    kind,
    bundleId,
    parentLineNumber,
    productId,
    productName,
    optionLines,
    unit,
    quantity,
    regularUnitPriceIncludingVat,
    appliedUnitPriceIncludingVat,
    discountIncludingVat:
      (regularUnitPriceIncludingVat - appliedUnitPriceIncludingVat) * quantity,
    total: toQuotationMoney(totalIncludingVat),
  } satisfies QuotationLine;
}

export function resolveQuotationBundles(
  bundles: CartBundle[],
  selectedBundleIds: string[],
) {
  const byId = new Map(bundles.map((bundle) => [bundle.id, bundle]));
  return selectedBundleIds
    .map((id) => byId.get(id))
    .filter((bundle): bundle is CartBundle => Boolean(bundle))
    .map(resolveCartBundle);
}

function getFingerprintPayload(bundles: ResolvedCartBundle[]) {
  return bundles.map((item) => ({
    id: item.bundle.id,
    productId: item.bundle.productId,
    optionId: item.bundle.optionId,
    variantId: item.bundle.variantId,
    quantity: item.bundle.quantity,
    shippingMethod: item.bundle.shippingMethod,
    mainUnitPrice: item.currentUnitPrice,
    shippingFee: item.shippingFee,
    available: item.available,
    additional: item.additionalItems.map((additional) => ({
      id: additional.productId,
      quantity: additional.quantity,
      price: additional.currentPrice,
      available: additional.available,
    })),
  }));
}

export function getQuotationFingerprint(bundles: ResolvedCartBundle[]) {
  return JSON.stringify(getFingerprintPayload(bundles));
}

export function createQuotationEntrySnapshot(
  bundles: ResolvedCartBundle[],
): QuotationEntrySnapshot {
  return {
    fingerprint: getQuotationFingerprint(bundles),
    bundleCount: bundles.length,
    totalIncludingVat: bundles.reduce(
      (sum, item) => sum + item.productTotal + item.shippingFee,
      0,
    ),
    bundles: bundles.map((item) => ({
      bundleId: item.bundle.id,
      productName: item.product?.name ?? "판매 종료된 상품",
      available: item.available,
      mainUnitPrice: item.currentUnitPrice,
      productTotal: item.productTotal,
      shippingFee: item.shippingFee,
      additionalPrices: Object.fromEntries(
        item.additionalItems.map((additional) => [
          additional.productId,
          additional.currentPrice,
        ]),
      ),
    })),
  };
}

export function compareQuotationEntry(
  entry: QuotationEntrySnapshot,
  current: ResolvedCartBundle[],
) {
  const byId = new Map(current.map((item) => [item.bundle.id, item]));
  const changes: QuotationChange[] = [];
  entry.bundles.forEach((previous) => {
    const item = byId.get(previous.bundleId);
    if (!item) {
      changes.push({
        bundleId: previous.bundleId,
        productName: previous.productName,
        kind: "removed",
        previousTotal: previous.productTotal + previous.shippingFee,
        currentTotal: null,
        difference: null,
      });
      return;
    }
    const currentTotal = item.productTotal + item.shippingFee;
    if (!item.available) {
      changes.push({
        bundleId: previous.bundleId,
        productName: item.product?.name ?? previous.productName,
        kind: "unavailable",
        previousTotal: previous.productTotal + previous.shippingFee,
        currentTotal,
        difference: currentTotal - previous.productTotal - previous.shippingFee,
      });
      return;
    }
    if (currentTotal !== previous.productTotal + previous.shippingFee) {
      changes.push({
        bundleId: previous.bundleId,
        productName: item.product?.name ?? previous.productName,
        kind: "price",
        previousTotal: previous.productTotal + previous.shippingFee,
        currentTotal,
        difference: currentTotal - previous.productTotal - previous.shippingFee,
      });
    }
  });
  return changes;
}

export function calculateQuotation(
  bundles: ResolvedCartBundle[],
): QuotationCalculation {
  if (bundles.length === 0 || bundles.some((item) => !item.available)) {
    throw new Error("견적을 만들 수 없는 상품이 포함되어 있습니다.");
  }

  let mainLineIndex = 0;
  const groups = groupResolvedBundles(bundles).map((group) => {
    const lines: QuotationLine[] = [];
    group.bundles.forEach((item) => {
      if (!item.product || item.currentUnitPrice === null) {
        throw new Error("견적을 만들 수 없는 상품이 포함되어 있습니다.");
      }
      mainLineIndex += 1;
      const mainLineNumber = String(mainLineIndex);
      const orderedArea =
        item.coveragePerOrder === null
          ? null
          : item.coveragePerOrder * item.bundle.quantity;
      const packageAndArea =
        item.coveragePerOrder === null
          ? null
          : item.orderUnitLabel === "BOX" && item.piecesPerOrder !== null
            ? `${item.piecesPerOrder}장/BOX · ${item.coveragePerOrder.toFixed(2)}㎡/BOX${item.bundle.quantity > 1 ? ` · 주문 ${orderedArea?.toFixed(2)}㎡` : ""}`
            : `1장당 ${item.coveragePerOrder.toFixed(2)}㎡${item.bundle.quantity > 1 ? ` · 주문 ${orderedArea?.toFixed(2)}㎡` : ""}`;
      lines.push(
        createLine({
          id: `${item.bundle.id}-main`,
          lineNumber: mainLineNumber,
          kind: "main",
          bundleId: item.bundle.id,
          productId: item.product.id,
          productName: `[${item.product.brand}] ${item.product.name}`,
          optionLines: [
            `${item.optionLabel} · ${item.variantLabel}`,
            ...(packageAndArea === null ? [] : [packageAndArea]),
          ],
          unit: item.orderUnitLabel,
          quantity: item.bundle.quantity,
          regularUnitPriceIncludingVat: item.currentUnitPrice,
          appliedUnitPriceIncludingVat: item.currentUnitPrice,
        }),
      );
      item.additionalItems.forEach((additional, additionalIndex) => {
        lines.push(
          createLine({
            id: `${item.bundle.id}-additional-${additional.productId}`,
            lineNumber: `${mainLineNumber}-${additionalIndex + 1}`,
            kind: "additional",
            bundleId: item.bundle.id,
            parentLineNumber: mainLineNumber,
            productId: additional.productId,
            productName: additional.name,
            optionLines: [],
            unit: "개",
            quantity: additional.quantity,
            regularUnitPriceIncludingVat: additional.currentPrice,
            appliedUnitPriceIncludingVat: additional.currentPrice,
          }),
        );
      });
    });

    const prepaidFee = group.bundles.reduce(
      (sum, item) => sum + item.shippingFee,
      0,
    );
    if (group.method.payment === "prepaid" && prepaidFee > 0) {
      lines.push(
        createLine({
          id: `${group.shippingMethod}-shipping`,
          lineNumber: "-",
          kind: "shipping",
          bundleId: null,
          productId: null,
          productName: `${group.method.label.replace(/ 배송$/, "")} 배송비`,
          optionLines: [`상품 묶음 ${group.bundles.length}건`],
          unit: "건",
          quantity: 1,
          regularUnitPriceIncludingVat: prepaidFee,
          appliedUnitPriceIncludingVat: prepaidFee,
        }),
      );
    }

    return {
      method: group.shippingMethod,
      label: group.method.label,
      payment: getShippingMethod(group.shippingMethod).payment,
      lines,
      note:
        group.method.payment === "collect"
          ? "착불 별도"
          : group.method.payment === "free"
            ? "배송비 0원"
            : "선불",
    } satisfies QuotationShippingGroup;
  });

  const allLines = groups.flatMap((group) => group.lines);
  const productLines = allLines.filter((line) => line.kind !== "shipping");
  const shippingLines = allLines.filter((line) => line.kind === "shipping");
  const regularProductTotalIncludingVat = productLines.reduce(
    (sum, line) => sum + line.regularUnitPriceIncludingVat * line.quantity,
    0,
  );
  const productTotalIncludingVat = productLines.reduce(
    (sum, line) => sum + line.total.includingVat,
    0,
  );
  const prepaidShippingTotalIncludingVat = shippingLines.reduce(
    (sum, line) => sum + line.total.includingVat,
    0,
  );
  const totalIncludingVat =
    productTotalIncludingVat + prepaidShippingTotalIncludingVat;

  return {
    groups,
    bundleCount: bundles.length,
    productLineCount: productLines.length,
    regularProductTotalIncludingVat,
    productDiscountIncludingVat:
      regularProductTotalIncludingVat - productTotalIncludingVat,
    productTotalIncludingVat,
    prepaidShippingTotalIncludingVat,
    total: toQuotationMoney(totalIncludingVat),
    hasCollectShipping: groups.some((group) => group.payment === "collect"),
    fingerprint: getQuotationFingerprint(bundles),
  };
}

export function getQuotationValidUntil(issuedAt: number) {
  const validUntil = new Date(issuedAt);
  validUntil.setDate(validUntil.getDate() + QUOTATION_VALID_DAYS);
  validUntil.setHours(23, 59, 59, 999);
  return validUntil.getTime();
}

export function generateQuotationNumber(
  now: number,
  randomValue = Math.random(),
) {
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
  return `SGQ-${ymd}-${suffix}`;
}

export function createQuotationSnapshot({
  draftId,
  memberId,
  values,
  calculation,
  existingNumbers = [],
  now = Date.now(),
  randomValue,
}: {
  draftId: string;
  memberId: string;
  values: QuotationFormValues;
  calculation: QuotationCalculation;
  existingNumbers?: string[];
  now?: number;
  randomValue?: number;
}): QuotationSnapshot {
  let quoteNumber = generateQuotationNumber(now, randomValue);
  let retry = 0;
  while (existingNumbers.includes(quoteNumber) && retry < 8) {
    retry += 1;
    quoteNumber = generateQuotationNumber(now, Math.random());
  }
  if (existingNumbers.includes(quoteNumber)) {
    throw new Error("견적번호를 생성하지 못했습니다.");
  }
  return {
    id: `${quoteNumber}-${Math.random().toString(36).slice(2, 7)}`,
    draftId,
    memberId,
    quoteNumber,
    title: values.title.trim() || "자재 구매 견적",
    recipient: {
      organization: values.recipientOrganization.trim(),
      contactName: values.contactName.trim(),
      phone: values.contactPhone.replace(/\D/g, ""),
      email: values.contactEmail.trim().toLowerCase(),
    },
    issuer: { ...MOCK_QUOTATION_ISSUER },
    calculation,
    issuedAt: now,
    validUntil: getQuotationValidUntil(now),
  };
}

const KOREAN_DIGITS = [
  "",
  "일",
  "이",
  "삼",
  "사",
  "오",
  "육",
  "칠",
  "팔",
  "구",
];
const SMALL_UNITS = ["", "십", "백", "천"];
const LARGE_UNITS = ["", "만", "억", "조", "경"];

function readFourDigits(value: number) {
  let result = "";
  for (let index = 3; index >= 0; index -= 1) {
    const divisor = 10 ** index;
    const digit = Math.floor(value / divisor) % 10;
    if (digit > 0) result += `${KOREAN_DIGITS[digit]}${SMALL_UNITS[index]}`;
  }
  return result;
}

export function numberToKoreanCurrency(value: number) {
  const safeValue = Math.max(0, Math.floor(value));
  if (safeValue === 0) return "금 영원정";
  let remaining = safeValue;
  let groupIndex = 0;
  let result = "";
  while (remaining > 0 && groupIndex < LARGE_UNITS.length) {
    const group = remaining % 10_000;
    if (group > 0) {
      result = `${readFourDigits(group)}${LARGE_UNITS[groupIndex]}${result}`;
    }
    remaining = Math.floor(remaining / 10_000);
    groupIndex += 1;
  }
  return `금 ${result}원정`;
}

export function getQuotationStatus(
  quotation: Pick<QuotationSnapshot, "validUntil">,
  now = Date.now(),
) {
  return quotation.validUntil >= now ? "유효" : "만료";
}
