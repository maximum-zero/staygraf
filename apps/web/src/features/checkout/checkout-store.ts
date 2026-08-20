"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_CHECKOUT_VALUES,
  type CheckoutFormValues,
} from "./checkout-schema";

export const CHECKOUT_DRAFT_STORAGE_KEY = "staygraf-checkout-draft";
export const CHECKOUT_DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000;

export type CheckoutDraft = {
  id: string;
  selectedBundleIds: string[];
  values: CheckoutFormValues;
  entryPrices: Record<string, number>;
  createdOrderId: string | null;
  createdAt: number;
  updatedAt: number;
};

type CheckoutState = {
  draft: CheckoutDraft | null;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  beginDraft: (
    bundleIds: string[],
    entryPrices: Record<string, number>,
  ) => CheckoutDraft;
  updateValues: (values: CheckoutFormValues) => void;
  markCreated: (orderId: string) => void;
  clearExpired: (now?: number) => void;
  clearDraft: () => void;
};

function createDraftId(now: number) {
  return `checkout-${now}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      draft: null,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      beginDraft: (bundleIds, entryPrices) => {
        const now = Date.now();
        const previous = get().draft;
        const sameSelection =
          previous &&
          previous.selectedBundleIds.length === bundleIds.length &&
          previous.selectedBundleIds.every((id) => bundleIds.includes(id));
        const draft: CheckoutDraft = sameSelection
          ? { ...previous, entryPrices, createdOrderId: null, updatedAt: now }
          : {
              id: createDraftId(now),
              selectedBundleIds: bundleIds,
              values: DEFAULT_CHECKOUT_VALUES,
              entryPrices,
              createdOrderId: null,
              createdAt: now,
              updatedAt: now,
            };
        set({ draft });
        return draft;
      },
      updateValues: (values) =>
        set((state) => ({
          draft: state.draft
            ? { ...state.draft, values, updatedAt: Date.now() }
            : null,
        })),
      markCreated: (orderId) =>
        set((state) => ({
          draft: state.draft
            ? { ...state.draft, createdOrderId: orderId, updatedAt: Date.now() }
            : null,
        })),
      clearExpired: (now = Date.now()) => {
        const draft = get().draft;
        if (draft && now - draft.updatedAt > CHECKOUT_DRAFT_EXPIRY_MS) {
          set({ draft: null });
        }
      },
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: CHECKOUT_DRAFT_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ draft: state.draft }),
      onRehydrateStorage: () => (state) => {
        state?.clearExpired();
        state?.setHydrated(true);
      },
    },
  ),
);
