import { SiteHeader } from "@/components/SiteHeader";
import { QuotationDetailPage } from "@/features/quotations/QuotationDetailPage";

export default async function QuotationDetailRoute({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  return (
    <>
      <SiteHeader />
      <QuotationDetailPage quoteId={quoteId} />
    </>
  );
}
