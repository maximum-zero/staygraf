import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function CheckoutHeader({
  backHref = "/cart",
  title = "주문·결제",
  backLabel = "장바구니로 돌아가기",
}: {
  backHref?: string;
  title?: string;
  backLabel?: string;
}) {
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
        <strong>{title}</strong>
        <Link className="checkout-header__back" href={backHref}>
          <ChevronLeft size={18} aria-hidden="true" />
          <span>{backLabel}</span>
        </Link>
      </div>
    </header>
  );
}
