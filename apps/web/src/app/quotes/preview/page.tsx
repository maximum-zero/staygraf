import { CheckoutHeader } from "@/components/CheckoutHeader";
import { QuotationPreviewPage } from "@/features/quotations/QuotationPreviewPage";

export default function QuotationPreviewRoute() {
  return (
    <>
      <CheckoutHeader
        title="견적서 미리보기"
        backHref="/quotes/new"
        backLabel="정보 입력으로 돌아가기"
      />
      <QuotationPreviewPage />
    </>
  );
}
