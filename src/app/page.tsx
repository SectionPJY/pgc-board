import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// 대시보드 통계 카드 컴포넌트
function StatCard({
  title, value, description, href, color,
}: {
  title: string; value: number | string; description: string; href: string; color: string;
}) {
  return (
    <Link href={href}>
      <div className={`${color} rounded-xl p-6 text-white shadow hover:shadow-lg transition cursor-pointer`}>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-4xl font-bold mt-1">{value}</p>
        <p className="text-sm mt-2 opacity-70">{description}</p>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const session = await getSession();

  // 비로그인 시 게임 목록 유도 화면
  if (!session) {
    const totalGames = await prisma.game.count();
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">🎲</p>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">보드게임 대여 시스템</h1>
        <p className="text-gray-500 mb-2">현재 <span className="font-semibold text-indigo-600">{totalGames}종</span>의 보드게임을 보유하고 있습니다.</p>
        <p className="text-gray-400 text-sm mb-8">대여 신청 및 관리 기능은 로그인이 필요합니다.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/games" className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
            게임 목록 보기
          </Link>
          <Link href="/login" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
            로그인
          </Link>
        </div>
      </div>
    );
  }

  // 로그인 시 통계 대시보드
  const [totalGames, totalMembers, activeRentals, overdueRentals] =
    await Promise.all([
      prisma.game.count(),
      prisma.member.count(),
      prisma.rental.count({ where: { returnedAt: null } }),
      prisma.rental.count({ where: { returnedAt: null, dueDate: { lt: new Date() } } }),
    ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">대시보드</h1>
      <p className="text-gray-500 mb-8">
        안녕하세요, <span className="font-medium text-indigo-600">{session.username}</span>님!
      </p>

      {/* 통계 카드 (관리자만 전체 표시) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard title="전체 게임 종류" value={totalGames} description="등록된 보드게임 수" href="/games" color="bg-indigo-500" />
        {session.role === "ADMIN" && (
          <StatCard title="전체 회원" value={totalMembers} description="등록된 회원 수" href="/members" color="bg-emerald-500" />
        )}
        <StatCard title="대여 중" value={activeRentals} description="현재 대여 진행 중" href="/rentals" color="bg-amber-500" />
        {session.role === "ADMIN" && (
          <StatCard title="연체" value={overdueRentals} description="반납 기한 초과" href="/rentals?filter=overdue" color="bg-red-500" />
        )}
      </div>

      {/* 빠른 이동 메뉴 */}
      <h2 className="text-xl font-semibold text-gray-700 mb-4">바로가기</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/rentals/new">
          <div className="border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center hover:bg-indigo-50 transition">
            <p className="text-3xl mb-2">📋</p>
            <p className="font-semibold text-indigo-600">새 대여 등록</p>
            <p className="text-sm text-gray-400 mt-1">게임 대여를 시작합니다</p>
          </div>
        </Link>
        {session.role === "ADMIN" && (
          <>
            <Link href="/games/new">
              <div className="border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center hover:bg-emerald-50 transition">
                <p className="text-3xl mb-2">🎲</p>
                <p className="font-semibold text-emerald-600">게임 추가</p>
                <p className="text-sm text-gray-400 mt-1">새 보드게임을 등록합니다</p>
              </div>
            </Link>
            <Link href="/members/new">
              <div className="border-2 border-dashed border-amber-300 rounded-xl p-6 text-center hover:bg-amber-50 transition">
                <p className="text-3xl mb-2">👤</p>
                <p className="font-semibold text-amber-600">회원 추가</p>
                <p className="text-sm text-gray-400 mt-1">새 회원을 등록합니다</p>
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
