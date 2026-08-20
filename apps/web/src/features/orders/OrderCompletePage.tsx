"use client";

import { Check, ChevronRight, Copy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { formatPrice } from "../checkout/checkout-data";
import { useCheckoutStore } from "../checkout/checkout-store";
import { useOrderStore } from "./order-store";

const subscribeToMount = () => () => undefined;

export function OrderCompletePage({ orderId }: { orderId: string }) {
  const mounted = useSyncExternalStore(
    subscribeToMount,
    () => true,
    () => false,
  );
  const hydrated = useOrderStore((state) => state.hydrated);
  const orders = useOrderStore((state) => state.orders);
  const clearDraft = useCheckoutStore((state) => state.clearDraft);
  const [copied, setCopied] = useState(false);
  const order = orders.find((item) => item.id === orderId);

  useEffect(() => {
    if (hydrated && order) clearDraft();
  }, [clearDraft, hydrated, order]);

  if (!mounted || !hydrated) {
    return (
      <main className="order-complete-page" id="main-content" aria-busy="true">
        <p>주문 결과를 확인하고 있습니다.</p>
      </main>
    );
  }
  if (!order) {
    return (
      <main className="order-complete-page" id="main-content">
        <section className="order-complete-empty">
          <h1>주문 정보를 찾을 수 없습니다.</h1>
          <p>보관 기간이 지났거나 저장된 주문이 없습니다.</p>
          <div>
            <Link href="/cart">장바구니 보기</Link>
            <Link href="/shop/tile?type=tile">상품 둘러보기</Link>
          </div>
        </section>
      </main>
    );
  }

  const deadline = order.depositDeadline
    ? new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(order.depositDeadline)
    : null;

  return (
    <main className="order-complete-page" id="main-content">
      <div className="order-complete-shell">
        <header className="order-complete-heading">
          <span>
            <Check size={29} strokeWidth={2} />
          </span>
          <h1>
            {order.status === "paid"
              ? "주문이 완료되었습니다."
              : "주문이 접수되었습니다."}
          </h1>
          <p>
            {order.status === "paid"
              ? "결제가 완료되어 상품 준비가 시작됩니다."
              : "입금 확인 후 상품 준비가 시작됩니다."}
          </p>
          <strong>주문번호 {order.orderNumber}</strong>
        </header>
        <section className="order-result-card" aria-labelledby="result-title">
          <div className="order-result-card__heading">
            <div>
              <span>결제 상태</span>
              <h2 id="result-title">
                {order.status === "paid" ? "결제 완료" : "입금 대기"}
              </h2>
            </div>
            <strong>{formatPrice(order.totalPayment)}</strong>
          </div>
          {order.bankAccount && (
            <div className="order-bank-info">
              <dl>
                <div>
                  <dt>입금 계좌</dt>
                  <dd>
                    {order.bankAccount.bankName}{" "}
                    {order.bankAccount.accountNumber}
                  </dd>
                </div>
                <div>
                  <dt>예금주</dt>
                  <dd>{order.bankAccount.accountHolder}</dd>
                </div>
                <div>
                  <dt>입금자명</dt>
                  <dd>{order.depositorName}</dd>
                </div>
                <div>
                  <dt>입금 기한</dt>
                  <dd>{deadline}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      order.bankAccount!.accountNumber,
                    );
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1800);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                <Copy size={17} /> {copied ? "복사 완료" : "계좌번호 복사"}
              </button>
              <p>화면 검증용 계좌입니다. 실제로 입금하지 마세요.</p>
            </div>
          )}
        </section>
        <section
          className="order-complete-items"
          aria-labelledby="complete-items-title"
        >
          <h2 id="complete-items-title">주문 상품</h2>
          {order.shippingGroups.map((group) => (
            <div className="order-complete-group" key={group.method}>
              <header>
                <strong>{group.label}</strong>
                <span>
                  {group.payment === "prepaid"
                    ? `선불 ${formatPrice(group.prepaidFee)}`
                    : group.payment === "collect"
                      ? "착불 운송비 별도"
                      : "배송비 0원"}
                </span>
              </header>
              {order.items
                .filter((item) => group.itemIds.includes(item.cartBundleId))
                .map((item) => (
                  <article key={item.cartBundleId}>
                    <div className="order-complete-item__image">
                      <Image src={item.image} alt="" fill sizes="72px" />
                    </div>
                    <div>
                      <p>
                        {item.brand} · {item.collection}
                      </p>
                      <h3>{item.productName}</h3>
                      <span>
                        {item.optionLabel} · {item.variantLabel} ·{" "}
                        {item.quantity}
                        {item.orderUnitLabel}
                      </span>
                      {item.additionalItems.length > 0 && (
                        <small>추가 상품 {item.additionalItems.length}종</small>
                      )}
                    </div>
                    <strong>
                      {formatPrice(item.productTotalIncludingVat)}
                    </strong>
                  </article>
                ))}
            </div>
          ))}
        </section>
        <div className="order-complete-actions">
          <Link href="/shop/tile?type=tile">
            상품 계속 보기 <ChevronRight size={17} />
          </Link>
          <Link href="/cart">장바구니 보기</Link>
        </div>
      </div>
    </main>
  );
}
