import { SiteHeader } from "@/components/SiteHeader";
import { MyPageShell } from "@/features/mypage/MyPageShell";
import { QuotationHistoryPage } from "@/features/quotations/QuotationHistoryPage";

export default function QuotationHistoryRoute() {
  return (
    <>
      <SiteHeader />
      <MyPageShell>
        <QuotationHistoryPage />
      </MyPageShell>
    </>
  );
}
