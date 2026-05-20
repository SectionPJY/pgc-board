import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "보드게임 대여 시스템",
  description: "보드게임 대여 및 반납 관리 시스템",
};

// 내비게이션 메뉴 정의
const navItems = [
  { href: "/", label: "홈" },
  { href: "/games", label: "보드게임 관리" },
  { href: "/members", label: "회원 관리" },
  { href: "/rentals", label: "대여/반납" },
  { href: "/stats", label: "통계" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">
        {/* 상단 내비게이션 바 */}
        <nav className="bg-indigo-600 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-bold text-lg whitespace-nowrap">
              🎲 보드게임 대여
            </Link>
            <div className="flex gap-4 flex-wrap">
              {navItems.slice(1).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-indigo-100 hover:text-white hover:bg-indigo-700 px-3 py-1 rounded transition"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* 메인 콘텐츠 영역 */}
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
