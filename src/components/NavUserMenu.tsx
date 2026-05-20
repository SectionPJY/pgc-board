"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SessionPayload } from "@/lib/auth";

// 내비게이션 바 우측의 사용자 메뉴 (로그인/로그아웃)
// 서버 컴포넌트인 layout에서 session을 props로 받아 클라이언트 동작 처리
export default function NavUserMenu({
  session,
}: {
  session: SessionPayload | null;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // 비로그인 상태
  if (!session) {
    return (
      <Link
        href="/login"
        className="text-indigo-100 hover:text-white bg-indigo-700 hover:bg-indigo-800 px-3 py-1.5 rounded text-sm"
      >
        로그인
      </Link>
    );
  }

  // 로그인 상태: 사용자 정보 + 로그아웃 버튼
  return (
    <div className="flex items-center gap-3">
      <span className="text-indigo-200 text-sm">
        {/* 관리자 배지 표시 */}
        {session.role === "ADMIN" && (
          <span className="bg-amber-400 text-amber-900 text-xs px-1.5 py-0.5 rounded mr-1.5 font-medium">
            관리자
          </span>
        )}
        {session.username}
      </span>
      <button
        onClick={handleLogout}
        className="text-indigo-200 hover:text-white text-sm hover:bg-indigo-700 px-2 py-1 rounded"
      >
        로그아웃
      </button>
    </div>
  );
}
