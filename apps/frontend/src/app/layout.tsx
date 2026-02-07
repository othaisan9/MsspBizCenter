import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MsspBizCenter - MSSP Business Center',
  description: 'MSSP 비즈니스 센터 - 팀 업무 포털 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
