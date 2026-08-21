"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { QuotationEntrySnapshot } from "./quotation-data";
import {
  DEFAULT_QUOTATION_VALUES,
  type QuotationFormValues,
} from "./quotation-schema";

export const QUOTATION_DRAFT_STORAGE_KEY = "staygraf-quotation-draft";

export type QuotationDraft = {
  id: string;
  memberId: string | null;
  selectedBundleIds: string[];
  values: QuotationFormValues;
  entry: QuotationEntrySnapshot;
  previewFingerprint: string | null;
  issuedQuotationId: string | null;
  createdAt: number;
  updatedAt: number;
};

type QuotationDraftState = {
  draft: QuotationDraft | null;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  beginDraft: (
    bundleIds: string[],
    entry: QuotationEntrySnapshot,
    memberId?: string | null,
  ) => QuotationDraft;
  claimForMember: (memberId: string) => boolean;
  updateValues: (values: QuotationFormValues) => void;
  setPreviewFingerprint: (fingerprint: string) => void;
  markIssued: (quotationId: string) => void;
  clearDraft: () => void;
};

function createDraftId(now: number) {
  return `quotation-${now}-${Math.random().toString(36).slice(2, 8)}`;
}

function sameSelection(previous: QuotationDraft | null, bundleIds: string[]) {
  return Boolean(
    previous &&
    previous.selectedBundleIds.length === bundleIds.length &&
    previous.selectedBundleIds.every((id) => bundleIds.includes(id)),
  );
}

export const useQuotationDraftStore = create<QuotationDraftState>()(
  persist(
    (set, get) => ({
      draft: null,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      beginDraft: (bundleIds, entry, memberId = null) => {
        const now = Date.now();
        const previous = get().draft;
        const draft = sameSelection(previous, bundleIds)
          ? {
              ...previous!,
              memberId: previous!.memberId ?? memberId,
              entry,
              previewFingerprint: null,
              issuedQuotationId: null,
              updatedAt: now,
            }
          : {
              id: createDraftId(now),
              memberId,
              selectedBundleIds: bundleIds,
              values: DEFAULT_QUOTATION_VALUES,
              entry,
              previewFingerprint: null,
              issuedQuotationId: null,
              createdAt: now,
              updatedAt: now,
            };
        set({ draft });
        return draft;
      },
      claimForMember: (memberId) => {
        const draft = get().draft;
        if (!draft || (draft.memberId && draft.memberId !== memberId)) {
          return false;
        }
        if (!draft.memberId) {
          set({ draft: { ...draft, memberId, updatedAt: Date.now() } });
        }
        return true;
      },
      updateValues: (values) =>
        set((state) => ({
          draft: state.draft
            ? { ...state.draft, values, updatedAt: Date.now() }
            : null,
        })),
      setPreviewFingerprint: (previewFingerprint) =>
        set((state) => ({
          draft: state.draft
            ? { ...state.draft, previewFingerprint, updatedAt: Date.now() }
            : null,
        })),
      markIssued: (issuedQuotationId) =>
        set((state) => ({
          draft: state.draft
            ? { ...state.draft, issuedQuotationId, updatedAt: Date.now() }
            : null,
        })),
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: QUOTATION_DRAFT_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ draft: state.draft }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
