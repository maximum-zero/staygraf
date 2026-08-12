"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ShippingMethodId } from "../catalog/purchase-data";

export const CART_STORAGE_KEY = "staygraf-cart";
export const CART_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

export type CartAdditionalItem = {
  productId: string;
  quantity: number;
  unitPriceAtAdd: number;
};

export type CartBundle = {
  id: string;
  productId: string;
  optionId: string;
  variantId: string;
  quantity: number;
  shippingMethod: ShippingMethodId;
  selected: boolean;
  unitPriceAtAdd: number;
  additionalItems: CartAdditionalItem[];
  addedAt: number;
  updatedAt: number;
};

export type AddCartBundleInput = Omit<
  CartBundle,
  "id" | "selected" | "addedAt" | "updatedAt"
>;

type CartState = {
  bundles: CartBundle[];
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  addBundle: (input: AddCartBundleInput) => { merged: boolean };
  setBundleSelected: (id: string, selected: boolean) => void;
  setGroupSelected: (shipping: ShippingMethodId, selected: boolean) => void;
  setAllSelected: (selected: boolean) => void;
  setBundleQuantity: (id: string, quantity: number) => void;
  setAdditionalQuantity: (
    bundleId: string,
    productId: string,
    quantity: number,
  ) => void;
  removeAdditional: (
    bundleId: string,
    productId: string,
  ) => CartAdditionalItem | undefined;
  restoreAdditional: (bundleId: string, item: CartAdditionalItem) => void;
  setShippingMethod: (id: string, shipping: ShippingMethodId) => void;
  removeBundle: (id: string) => CartBundle | undefined;
  removeBundles: (ids: string[]) => CartBundle[];
  restoreBundle: (bundle: CartBundle) => void;
  clearExpired: (now?: number) => void;
  clear: () => void;
};

function additionalKey(items: CartAdditionalItem[]) {
  return items
    .map((item) => item.productId)
    .sort()
    .join("|");
}

export function getCartBundleKey(
  bundle: Pick<
    CartBundle,
    | "productId"
    | "optionId"
    | "variantId"
    | "shippingMethod"
    | "additionalItems"
  >,
) {
  return [
    bundle.productId,
    bundle.optionId,
    bundle.variantId,
    bundle.shippingMethod,
    additionalKey(bundle.additionalItems),
  ].join("::");
}

function createBundleId(input: AddCartBundleInput, now: number) {
  return `${input.productId}-${input.variantId}-${now}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function mergeBundles(target: CartBundle, source: CartBundle, now: number) {
  return {
    ...target,
    quantity: target.quantity + source.quantity,
    additionalItems: target.additionalItems.map((item) => ({
      ...item,
      quantity:
        item.quantity +
        (source.additionalItems.find(
          (sourceItem) => sourceItem.productId === item.productId,
        )?.quantity ?? 0),
    })),
    selected: target.selected || source.selected,
    addedAt: Math.min(target.addedAt, source.addedAt),
    updatedAt: now,
  };
}

function normalizeBundles(bundles: CartBundle[], now = Date.now()) {
  return bundles.reduce<CartBundle[]>((normalized, bundle) => {
    const existingIndex = normalized.findIndex(
      (item) => getCartBundleKey(item) === getCartBundleKey(bundle),
    );
    if (existingIndex === -1) return [...normalized, bundle];
    return normalized.map((item, index) =>
      index === existingIndex ? mergeBundles(item, bundle, now) : item,
    );
  }, []);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      bundles: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      addBundle: (input) => {
        const now = Date.now();
        const key = getCartBundleKey(input);
        const existing = get().bundles.find(
          (bundle) => getCartBundleKey(bundle) === key,
        );
        if (existing) {
          set((state) => ({
            bundles: state.bundles.map((bundle) =>
              bundle.id === existing.id
                ? {
                    ...bundle,
                    quantity: bundle.quantity + Math.max(1, input.quantity),
                    additionalItems: bundle.additionalItems.map((item) => ({
                      ...item,
                      quantity:
                        item.quantity +
                        (input.additionalItems.find(
                          (next) => next.productId === item.productId,
                        )?.quantity ?? 0),
                    })),
                    selected: true,
                    updatedAt: now,
                  }
                : bundle,
            ),
          }));
          return { merged: true };
        }

        set((state) => ({
          bundles: [
            ...state.bundles,
            {
              ...input,
              quantity: Math.max(1, input.quantity),
              additionalItems: input.additionalItems.map((item) => ({
                ...item,
                quantity: Math.max(1, item.quantity),
              })),
              id: createBundleId(input, now),
              selected: true,
              addedAt: now,
              updatedAt: now,
            },
          ],
        }));
        return { merged: false };
      },
      setBundleSelected: (id, selected) =>
        set((state) => ({
          bundles: state.bundles.map((bundle) =>
            bundle.id === id ? { ...bundle, selected } : bundle,
          ),
        })),
      setGroupSelected: (shipping, selected) =>
        set((state) => ({
          bundles: state.bundles.map((bundle) =>
            bundle.shippingMethod === shipping
              ? { ...bundle, selected }
              : bundle,
          ),
        })),
      setAllSelected: (selected) =>
        set((state) => ({
          bundles: state.bundles.map((bundle) => ({ ...bundle, selected })),
        })),
      setBundleQuantity: (id, quantity) =>
        set((state) => ({
          bundles: state.bundles.map((bundle) =>
            bundle.id === id
              ? {
                  ...bundle,
                  quantity: Math.max(1, quantity),
                  updatedAt: Date.now(),
                }
              : bundle,
          ),
        })),
      setAdditionalQuantity: (bundleId, productId, quantity) =>
        set((state) => ({
          bundles: state.bundles.map((bundle) =>
            bundle.id === bundleId
              ? {
                  ...bundle,
                  additionalItems: bundle.additionalItems.map((item) =>
                    item.productId === productId
                      ? { ...item, quantity: Math.max(1, quantity) }
                      : item,
                  ),
                  updatedAt: Date.now(),
                }
              : bundle,
          ),
        })),
      removeAdditional: (bundleId, productId) => {
        const removed = get()
          .bundles.find((bundle) => bundle.id === bundleId)
          ?.additionalItems.find((item) => item.productId === productId);
        if (!removed) return undefined;
        set((state) => ({
          bundles: normalizeBundles(
            state.bundles.map((bundle) =>
              bundle.id === bundleId
                ? {
                    ...bundle,
                    additionalItems: bundle.additionalItems.filter(
                      (item) => item.productId !== productId,
                    ),
                    updatedAt: Date.now(),
                  }
                : bundle,
            ),
          ),
        }));
        return removed;
      },
      restoreAdditional: (bundleId, item) =>
        set((state) => ({
          bundles: normalizeBundles(
            state.bundles.map((bundle) =>
              bundle.id === bundleId &&
              !bundle.additionalItems.some(
                (additional) => additional.productId === item.productId,
              )
                ? {
                    ...bundle,
                    additionalItems: [...bundle.additionalItems, item],
                    updatedAt: Date.now(),
                  }
                : bundle,
            ),
          ),
        })),
      setShippingMethod: (id, shippingMethod) =>
        set((state) => {
          const source = state.bundles.find((bundle) => bundle.id === id);
          if (!source || source.shippingMethod === shippingMethod) return state;
          const now = Date.now();
          const changed = { ...source, shippingMethod, updatedAt: now };
          const target = state.bundles.find(
            (bundle) =>
              bundle.id !== id &&
              getCartBundleKey(bundle) === getCartBundleKey(changed),
          );
          if (!target) {
            return {
              bundles: state.bundles.map((bundle) =>
                bundle.id === id ? changed : bundle,
              ),
            };
          }
          return {
            bundles: state.bundles
              .filter((bundle) => bundle.id !== id)
              .map((bundle) =>
                bundle.id === target.id
                  ? mergeBundles(bundle, changed, now)
                  : bundle,
              ),
          };
        }),
      removeBundle: (id) => {
        const removed = get().bundles.find((bundle) => bundle.id === id);
        if (removed) {
          set((state) => ({
            bundles: state.bundles.filter((bundle) => bundle.id !== id),
          }));
        }
        return removed;
      },
      removeBundles: (ids) => {
        const idSet = new Set(ids);
        const removed = get().bundles.filter((bundle) => idSet.has(bundle.id));
        set((state) => ({
          bundles: state.bundles.filter((bundle) => !idSet.has(bundle.id)),
        }));
        return removed;
      },
      restoreBundle: (bundle) =>
        set((state) => {
          if (state.bundles.some((item) => item.id === bundle.id)) return state;
          const now = Date.now();
          const target = state.bundles.find(
            (item) => getCartBundleKey(item) === getCartBundleKey(bundle),
          );
          return {
            bundles: target
              ? state.bundles.map((item) =>
                  item.id === target.id
                    ? mergeBundles(item, bundle, now)
                    : item,
                )
              : [...state.bundles, { ...bundle, updatedAt: now }],
          };
        }),
      clearExpired: (now = Date.now()) =>
        set((state) => ({
          bundles: state.bundles.filter(
            (bundle) => now - bundle.updatedAt <= CART_EXPIRY_MS,
          ),
        })),
      clear: () => set({ bundles: [] }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ bundles: state.bundles }),
      onRehydrateStorage: () => (state) => {
        state?.clearExpired();
        state?.setHydrated(true);
      },
    },
  ),
);
