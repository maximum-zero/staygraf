"use client";

import { ChevronLeft, FileDown, Printer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useAuthStore } from "../auth/auth-store";
import { getQuotationStatus } from "./quotation-data";
import { useQuotationDraftStore } from "./quotation-draft-store";
import {
  QuotationDocument,
  type QuotationDocumentData,
} from "./QuotationDocument";
import { useQuotationStore } from "./quotation-store";

const subscribeToMount = () => () => undefined;

export function QuotationDetailPage({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    subscribeToMount,
    () => true,
    () => false,
  );
  const member = useAuthStore((state) => state.member);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const hydrated = useQuotationStore((state) => state.hydrated);
  const quotations = useQuotationStore((state) => state.quotations);
  const draft = useQuotationDraftStore((state) => state.draft);
  const clearDraft = useQuotationDraftStore((state) => state.clearDraft);
  const quotation = useMemo(
    () =>
      quotations.find(
        (item) => item.id === quoteId && item.memberId === member?.id,
      ),
    [member?.id, quotations, quoteId],
  );
  const ready = mounted && authHydrated && hydrated;

  useEffect(() => {
    if (ready && !member)
      router.replace(`/login?returnTo=/mypage/quotes/${quoteId}`);
  }, [member, quoteId, ready, router]);

  useEffect(() => {
    if (quotation && draft?.issuedQuotationId === quotation.id) clearDraft();
  }, [clearDraft, draft?.issuedQuotationId, quotation]);

  if (!ready || !member) {
    return (
      <main className="quotation-state-page" id="main-content" aria-busy="true">
        <p>견적서를 확인하고 있습니다.</p>
      </main>
    );
  }
  if (!quotation) {
    return (
      <main className="quotation-state-page" id="main-content">
        <h1>견적서를 찾을 수 없습니다.</h1>
        <p>저장되지 않았거나 현재 계정에서 볼 수 없는 견적서입니다.</p>
        <Link href="/mypage/quotes">견적서 관리로 이동</Link>
      </main>
    );
  }

  const document: QuotationDocumentData = {
    quoteNumber: quotation.quoteNumber,
    title: quotation.title,
    recipient: quotation.recipient,
    issuer: quotation.issuer,
    calculation: quotation.calculation,
    issuedAt: quotation.issuedAt,
    validUntil: quotation.validUntil,
  };
  const status = getQuotationStatus(quotation);

  return (
    <main className="quotation-detail-page" id="main-content">
      <div className="quotation-detail-shell">
        <header className="quotation-detail-toolbar">
          <div>
            <Link href="/mypage/quotes">
              <ChevronLeft size={18} aria-hidden="true" /> 견적서 관리
            </Link>
            <div>
              <h1>{quotation.title}</h1>
              <span className={status === "유효" ? "is-valid" : "is-expired"}>
                {status}
              </span>
            </div>
            <p>{quotation.quoteNumber}</p>
          </div>
          <div className="quotation-detail-actions">
            <button type="button" onClick={() => window.print()}>
              <Printer size={18} aria-hidden="true" /> 인쇄·PDF 저장
            </button>
          </div>
        </header>

        <div className="quotation-mobile-guide">
          <FileDown size={18} aria-hidden="true" />
          <p>
            모바일에서는 버튼을 누른 뒤 Android는 <strong>PDF로 저장</strong>,
            iPhone은 공유 메뉴의 <strong>파일에 저장</strong>을 선택하세요.
          </p>
        </div>
        <QuotationDocument document={document} />
      </div>
    </main>
  );
}
