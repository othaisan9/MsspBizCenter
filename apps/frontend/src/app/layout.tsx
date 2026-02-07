import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MsspBizCenter - 팀 업무포털',
  description: 'MSSP 비즈니스 센터 - 주차별 업무 일지, 회의록, 계약관리',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
