import Link from "next/link";
import type { ReactNode } from "react";

export function MyPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="mypage-page" id="main-content">
      <div className="mypage-shell shell">
        <header className="mypage-heading">
          <h1>마이페이지</h1>
          <p>내 쇼핑 활동과 발행 문서를 확인하세요.</p>
        </header>
        <div className="mypage-layout">
          <nav className="mypage-nav" aria-label="마이페이지 메뉴">
            <Link href="/mypage/quotes" aria-current="page">
              견적서 관리
            </Link>
          </nav>
          <div className="mypage-content">{children}</div>
        </div>
      </div>
    </main>
  );
}
