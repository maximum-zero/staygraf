import { Suspense } from "react";
import { CheckoutHeader } from "@/components/CheckoutHeader";
import { MockLoginPage } from "@/features/auth/MockLoginPage";

export default function LoginRoute() {
  return (
    <>
      <CheckoutHeader title="로그인" />
      <Suspense
        fallback={
          <main className="login-page">
            <p>로그인 화면을 준비하고 있습니다.</p>
          </main>
        }
      >
        <MockLoginPage />
      </Suspense>
    </>
  );
}
