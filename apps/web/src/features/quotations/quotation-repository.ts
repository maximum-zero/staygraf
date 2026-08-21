"use client";

import type { QuotationSnapshot } from "./quotation-data";
import { useQuotationStore } from "./quotation-store";

export const quotationRepository = {
  findById(memberId: string, quotationId: string) {
    return useQuotationStore
      .getState()
      .quotations.find(
        (quotation) =>
          quotation.id === quotationId && quotation.memberId === memberId,
      );
  },
  findByDraftId(memberId: string, draftId: string) {
    return useQuotationStore
      .getState()
      .quotations.find(
        (quotation) =>
          quotation.draftId === draftId && quotation.memberId === memberId,
      );
  },
  listByMember(memberId: string) {
    return useQuotationStore
      .getState()
      .quotations.filter((quotation) => quotation.memberId === memberId)
      .sort((a, b) => b.issuedAt - a.issuedAt);
  },
  save(quotation: QuotationSnapshot) {
    return useQuotationStore.getState().addQuotation(quotation);
  },
};
