import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function CheckoutHeader({ backHref = "/cart" }: { backHref?: string }) {
  return (
    <header className="checkout-header">
      <div className="checkout-header__inner">
        <Link
          className="checkout-header__brand"
          href="/"
          aria-label="STAYGRAF 홈"
        >
          STAYGRAF
        </Link>
        <strong>주문·결제</strong>
        <Link className="checkout-header__back" href={backHref}>
          <ChevronLeft size={18} aria-hidden="true" />
          <span>장바구니로 돌아가기</span>
        </Link>
      </div>
    </header>
  );
}
