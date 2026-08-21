import { CheckoutHeader } from "@/components/CheckoutHeader";
import { QuotationFormPage } from "@/features/quotations/QuotationFormPage";

export default function NewQuotationRoute() {
  return (
    <>
      <CheckoutHeader title="견적서 만들기" />
      <QuotationFormPage />
    </>
  );
}
