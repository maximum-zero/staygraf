import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "STAYGRAF",
  description: "공간과 전문 인테리어 자재를 연결하는 STAYGRAF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
