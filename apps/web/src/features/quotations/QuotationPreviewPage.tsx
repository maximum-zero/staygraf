"use client";

import { AlertCircle, ChevronLeft, FileCheck2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useAuthStore } from "../auth/auth-store";
import { useCartStore } from "../cart/cart-store";
import {
  calculateQuotation,
  compareQuotationEntry,
  createQuotationSnapshot,
  getQuotationValidUntil,
  MOCK_QUOTATION_ISSUER,
  resolveQuotationBundles,
} from "./quotation-data";
import { quotationRepository } from "./quotation-repository";
import { useQuotationDraftStore } from "./quotation-draft-store";
import { useQuotationStore } from "./quotation-store";
import {
  QuotationDocument,
  type QuotationDocumentData,
} from "./QuotationDocument";
import {
  QuotationEmpty,
  QuotationLoading,
  QuotationSteps,
} from "./QuotationFormPage";

const subscribeToMount = () => () => undefined;

export function QuotationPreviewPage() {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    subscribeToMount,
    () => true,
    () => false,
  );
  const member = useAuthStore((state) => state.member);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const bundles = useCartStore((state) => state.bundles);
  const cartHydrated = useCartStore((state) => state.hydrated);
  const draft = useQuotationDraftStore((state) => state.draft);
  const draftHydrated = useQuotationDraftStore((state) => state.hydrated);
  const setPreviewFingerprint = useQuotationDraftStore(
    (state) => state.setPreviewFingerprint,
  );
  const markIssued = useQuotationDraftStore((state) => state.markIssued);
  const quotationHydrated = useQuotationStore((state) => state.hydrated);
  const quotations = useQuotationStore((state) => state.quotations);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const issueTriggerRef = useRef<HTMLButtonElement>(null);
  const issueAlertRef = useRef<HTMLDivElement>(null);
  const ready =
    mounted &&
    authHydrated &&
    cartHydrated &&
    draftHydrated &&
    quotationHydrated;
  const resolved = useMemo(
    () =>
      draft ? resolveQuotationBundles(bundles, draft.selectedBundleIds) : [],
    [bundles, draft],
  );
  const calculation = useMemo(() => {
    try {
      return calculateQuotation(resolved);
    } catch {
      return null;
    }
  }, [resolved]);
  const changes = useMemo(
    () => (draft ? compareQuotationEntry(draft.entry, resolved) : []),
    [draft, resolved],
  );

  useEffect(() => {
    if (!ready) return;
    if (!member) router.replace("/login?returnTo=/quotes/preview");
    else if (draft?.memberId && draft.memberId !== member.id)
      router.replace("/cart");
    else if (draft?.issuedQuotationId)
      router.replace(`/mypage/quotes/${draft.issuedQuotationId}`);
  }, [draft, member, ready, router]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (issueOpen && !dialog.open) dialog.showModal();
    if (!issueOpen && dialog.open) dialog.close();
  }, [issueOpen]);

  useEffect(() => {
    if (issueError) issueAlertRef.current?.focus();
  }, [issueError]);

  const issueQuotation = () => {
    if (!draft || !member || issuing) return;
    setIssueError("");
    const latest = resolveQuotationBundles(
      useCartStore.getState().bundles,
      draft.selectedBundleIds,
    );
    if (
      latest.length !== draft.selectedBundleIds.length ||
      latest.some((item) => !item.available)
    ) {
      setIssueOpen(false);
      setIssueError(
        "발행할 수 없는 상품이 있습니다. 장바구니에서 판매·배송 조건을 확인해 주세요.",
      );
      return;
    }
    const latestCalculation = calculateQuotation(latest);
    if (draft.previewFingerprint !== latestCalculation.fingerprint) {
      setPreviewFingerprint(latestCalculation.fingerprint);
      setIssueOpen(false);
      setIssueError(
        "상품 금액 또는 배송 조건이 변경되었습니다. 갱신된 견적을 확인한 뒤 다시 발행해 주세요.",
      );
      return;
    }
    const existing = quotationRepository.findByDraftId(member.id, draft.id);
    if (existing) {
      markIssued(existing.id);
      router.replace(`/mypage/quotes/${existing.id}`);
      return;
    }
    setIssuing(true);
    try {
      const quotation = createQuotationSnapshot({
        draftId: draft.id,
        memberId: member.id,
        values: draft.values,
        calculation: latestCalculation,
        existingNumbers: quotations.map((item) => item.quoteNumber),
      });
      quotationRepository.save(quotation);
      markIssued(quotation.id);
      router.replace(`/mypage/quotes/${quotation.id}`);
    } catch {
      setIssuing(false);
      setIssueOpen(false);
      setIssueError(
        "견적서를 저장하지 못했습니다. 입력 내용은 유지되며 다시 시도할 수 있습니다.",
      );
    }
  };

  if (!ready || (ready && !member)) return <QuotationLoading />;
  if (!draft) {
    return (
      <QuotationEmpty
        title="미리볼 견적이 없습니다."
        description="장바구니에서 견적서를 다시 만들어 주세요."
      />
    );
  }
  if (!calculation) {
    return (
      <QuotationEmpty
        title="견적을 미리볼 수 없습니다."
        description="상품의 판매·배송 조건을 장바구니에서 확인해 주세요."
      />
    );
  }

  const referenceDate = draft.updatedAt;
  const document: QuotationDocumentData = {
    quoteNumber: null,
    title: draft.values.title.trim() || "자재 구매 견적",
    recipient: {
      organization: draft.values.recipientOrganization,
      contactName: draft.values.contactName,
      phone: draft.values.contactPhone,
      email: draft.values.contactEmail,
    },
    issuer: { ...MOCK_QUOTATION_ISSUER },
    calculation,
    issuedAt: referenceDate,
    validUntil: getQuotationValidUntil(referenceDate),
  };

  return (
    <main className="quotation-preview-page" id="main-content">
      <div className="quotation-preview-shell">
        <header className="quotation-preview-heading">
          <div>
            <Link href="/quotes/new">
              <ChevronLeft size={17} aria-hidden="true" /> 정보 수정
            </Link>
            <h1>견적서 미리보기</h1>
            <p>품목·금액·수신 정보를 확인한 뒤 발행해 주세요.</p>
          </div>
          <QuotationSteps current={2} />
        </header>

        {(changes.length > 0 || issueError) && (
          <div
            className="quotation-alert"
            ref={issueAlertRef}
            role="alert"
            tabIndex={-1}
          >
            <AlertCircle size={19} aria-hidden="true" />
            <div>
              <strong>
                {issueError || "장바구니 진입 후 금액이 변경되었습니다."}
              </strong>
              {changes
                .filter((change) => change.kind === "price")
                .map((change) => (
                  <p key={change.bundleId}>
                    {change.productName}:{" "}
                    {change.previousTotal.toLocaleString("ko-KR")}원 →{" "}
                    {change.currentTotal?.toLocaleString("ko-KR")}원
                  </p>
                ))}
            </div>
          </div>
        )}

        <QuotationDocument document={document} preview />
        <div className="quotation-preview-actions">
          <Link href="/quotes/new">정보 수정</Link>
          <button
            ref={issueTriggerRef}
            type="button"
            onClick={() => setIssueOpen(true)}
          >
            <FileCheck2 size={18} aria-hidden="true" /> 견적서 발행
          </button>
        </div>
      </div>

      <dialog
        className="quotation-issue-dialog"
        ref={dialogRef}
        aria-labelledby="quotation-issue-title"
        onCancel={(event) => {
          event.preventDefault();
          setIssueOpen(false);
        }}
        onClose={() => {
          setIssueOpen(false);
          issueTriggerRef.current?.focus();
        }}
      >
        <h2 id="quotation-issue-title">이 견적서를 발행할까요?</h2>
        <p>
          발행 후 품목과 금액은 수정되지 않으며 현재 내용이 이력에 저장됩니다.
        </p>
        <div>
          <button autoFocus type="button" onClick={() => setIssueOpen(false)}>
            취소
          </button>
          <button type="button" disabled={issuing} onClick={issueQuotation}>
            {issuing ? "발행 중" : "발행하기"}
          </button>
        </div>
      </dialog>
    </main>
  );
}
