"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ShippingMethodId } from "../catalog/purchase-data";
import type { PaymentMethod } from "../checkout/checkout-schema";

export const ORDER_STORAGE_KEY = "staygraf-orders";
export const ORDER_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export type OrderStatus = "paid" | "awaiting-deposit";
export type MoneySnapshot = {
  includingVat: number;
  supply: number;
  vat: number;
};
export type AdditionalItemSnapshot = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: MoneySnapshot;
  totalPrice: MoneySnapshot;
};
export type OrderItemSnapshot = {
  cartBundleId: string;
  productId: string;
  productName: string;
  brand: string;
  collection: string;
  optionId: string;
  optionLabel: string;
  variantId: string;
  variantLabel: string;
  orderUnitLabel: string;
  quantity: number;
  image: string;
  unitPrice: MoneySnapshot;
  mainProductTotal: MoneySnapshot;
  additionalItems: AdditionalItemSnapshot[];
  productTotalIncludingVat: number;
};
export type ShippingGroupSnapshot = {
  method: ShippingMethodId;
  label: string;
  payment: "prepaid" | "collect" | "free";
  itemIds: string[];
  prepaidFee: number;
};
export type BankAccountSnapshot = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};
export type OrderSnapshot = {
  id: string;
  draftId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  orderer: { name: string; phone: string; email: string };
  recipient: {
    name: string;
    phone: string;
    postalCode: string;
    address: string;
    addressDetail: string;
    deliveryRequest: string;
  };
  items: OrderItemSnapshot[];
  shippingGroups: ShippingGroupSnapshot[];
  productTotalIncludingVat: number;
  prepaidShippingTotal: number;
  totalPayment: number;
  hasCollectShipping: boolean;
  depositorName: string | null;
  bankAccount: BankAccountSnapshot | null;
  depositDeadline: number | null;
  createdAt: number;
  expiresAt: number;
};

type OrderState = {
  orders: OrderSnapshot[];
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  addOrder: (order: OrderSnapshot) => void;
  clearExpired: (now?: number) => void;
};

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      addOrder: (order) =>
        set((state) => ({
          orders: state.orders.some((item) => item.id === order.id)
            ? state.orders
            : [...state.orders, order],
        })),
      clearExpired: (now = Date.now()) =>
        set((state) => ({
          orders: state.orders.filter((order) => order.expiresAt > now),
        })),
    }),
    {
      name: ORDER_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ orders: state.orders }),
      onRehydrateStorage: () => (state) => {
        state?.clearExpired();
        state?.setHydrated(true);
      },
    },
  ),
);
