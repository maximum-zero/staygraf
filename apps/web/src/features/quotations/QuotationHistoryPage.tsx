"use client";

import { ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useAuthStore } from "../auth/auth-store";
import { formatPrice, getQuotationStatus } from "./quotation-data";
import { useQuotationStore } from "./quotation-store";

const subscribeToMount = () => () => undefined;
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function QuotationHistoryPage() {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    subscribeToMount,
    () => true,
    () => false,
  );
  const member = useAuthStore((state) => state.member);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const hydrated = useQuotationStore((state) => state.hydrated);
  const allQuotations = useQuotationStore((state) => state.quotations);
  const quotations = useMemo(
    () =>
      member
        ? allQuotations
            .filter((quotation) => quotation.memberId === member.id)
            .sort((a, b) => b.issuedAt - a.issuedAt)
        : [],
    [allQuotations, member],
  );
  const ready = mounted && authHydrated && hydrated;

  useEffect(() => {
    if (ready && !member) router.replace("/login?returnTo=/mypage/quotes");
  }, [member, ready, router]);

  if (!ready || !member) {
    return (
      <div className="mypage-loading" aria-busy="true">
        견적 이력을 확인하고 있습니다.
      </div>
    );
  }

  return (
    <section
      className="quotation-history"
      aria-labelledby="quotation-history-title"
    >
      <header className="mypage-section-heading">
        <div>
          <h2 id="quotation-history-title">견적서 관리</h2>
          <p>발행한 견적서를 다시 열고 인쇄하거나 PDF로 저장할 수 있습니다.</p>
        </div>
        <span>총 {quotations.length}건</span>
      </header>

      {quotations.length === 0 ? (
        <div className="quotation-history-empty">
          <FileText size={30} aria-hidden="true" />
          <h3>아직 발행한 견적서가 없습니다.</h3>
          <p>장바구니에서 필요한 상품을 선택해 견적서를 만들어 보세요.</p>
          <Link href="/cart">장바구니 보기</Link>
        </div>
      ) : (
        <div className="quotation-history-list">
          <div className="quotation-history-list__head" aria-hidden="true">
            <span>견적 정보</span>
            <span>수신처</span>
            <span>발행일</span>
            <span>견적 금액</span>
            <span>상태</span>
          </div>
          {quotations.map((quotation) => {
            const status = getQuotationStatus(quotation);
            return (
              <Link href={`/mypage/quotes/${quotation.id}`} key={quotation.id}>
                <div className="quotation-history-list__title">
                  <strong>{quotation.title}</strong>
                  <span>{quotation.quoteNumber}</span>
                </div>
                <span>{quotation.recipient.organization}</span>
                <time dateTime={new Date(quotation.issuedAt).toISOString()}>
                  {dateFormatter.format(quotation.issuedAt)}
                </time>
                <b>{formatPrice(quotation.calculation.total.includingVat)}</b>
                <span className={status === "유효" ? "is-valid" : "is-expired"}>
                  {status}
                </span>
                <ChevronRight size={18} aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
