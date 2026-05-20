import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import NavUserMenu from "@/components/NavUserMenu";
import "./globals.css";

export const metadata: Metadata = {
  title: "보드게임 대여 시스템",
  description: "보드게임 대여 및 반납 관리 시스템",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버 컴포넌트에서 세션 조회
  const session = await getSession();

  // 관리자에게만 보이는 메뉴 항목
  const navItems = [
    { href: "/games", label: "보드게임 관리", adminOnly: false },
    { href: "/members", label: "회원 관리", adminOnly: true },
    { href: "/rentals", label: "대여/반납", adminOnly: false },
    { href: "/stats", label: "통계", adminOnly: true },
  ];

  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">
        {/* 상단 내비게이션 바 */}
        <nav className="bg-indigo-600 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-bold text-lg whitespace-nowrap">
              🎲 보드게임 대여
            </Link>

            {/* 로그인된 경우에만 메뉴 표시 */}
            {session && (
              <div className="flex gap-1 flex-wrap flex-1">
                {navItems
                  // 일반 사용자는 adminOnly 메뉴 숨김
                  .filter((item) => !item.adminOnly || session.role === "ADMIN")
                  .map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-indigo-100 hover:text-white hover:bg-indigo-700 px-3 py-1 rounded transition text-sm"
                    >
                      {item.label}
                    </Link>
                  ))}
              </div>
            )}

            {/* 우측: 로그인 상태 표시 및 로그아웃 버튼 (클라이언트 컴포넌트) */}
            <div className="ml-auto">
              <NavUserMenu session={session} />
            </div>
          </div>
        </nav>

        {/* 메인 콘텐츠 영역 */}
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
