"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { QuotationSnapshot } from "./quotation-data";

export const QUOTATION_STORAGE_KEY = "staygraf-quotations";

type QuotationState = {
  quotations: QuotationSnapshot[];
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  addQuotation: (quotation: QuotationSnapshot) => QuotationSnapshot;
};

export const useQuotationStore = create<QuotationState>()(
  persist(
    (set, get) => ({
      quotations: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      addQuotation: (quotation) => {
        const existing = get().quotations.find(
          (item) =>
            item.id === quotation.id || item.draftId === quotation.draftId,
        );
        if (existing) return existing;
        set((state) => ({
          quotations: [...state.quotations, quotation],
        }));
        return quotation;
      },
    }),
    {
      name: QUOTATION_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ quotations: state.quotations }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
