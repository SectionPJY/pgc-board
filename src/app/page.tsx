import Link from "next/link";
import { prisma } from "@/lib/prisma";

// 대시보드 카드 컴포넌트: 통계 수치를 시각적으로 표시
function StatCard({
  title,
  value,
  description,
  href,
  color,
}: {
  title: string;
  value: number | string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <div
        className={`${color} rounded-xl p-6 text-white shadow hover:shadow-lg transition cursor-pointer`}
      >
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-4xl font-bold mt-1">{value}</p>
        <p className="text-sm mt-2 opacity-70">{description}</p>
      </div>
    </Link>
  );
}

// 홈 페이지: 주요 통계를 한눈에 보여주는 대시보드
export default async function HomePage() {
  // 각 통계를 병렬로 조회하여 성능 최적화
  const [totalGames, totalMembers, activeRentals, overdueRentals] =
    await Promise.all([
      prisma.game.count(),
      prisma.member.count(),
      // 반납되지 않은 대여 건수 (현재 대여 중)
      prisma.rental.count({ where: { returnedAt: null } }),
      // 반납 기한이 지났지만 아직 반납되지 않은 건수
      prisma.rental.count({
        where: { returnedAt: null, dueDate: { lt: new Date() } },
      }),
    ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">대시보드</h1>
      <p className="text-gray-500 mb-8">보드게임 대여 시스템 현황입니다.</p>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          title="전체 게임 종류"
          value={totalGames}
          description="등록된 보드게임 수"
          href="/games"
          color="bg-indigo-500"
        />
        <StatCard
          title="전체 회원"
          value={totalMembers}
          description="등록된 회원 수"
          href="/members"
          color="bg-emerald-500"
        />
        <StatCard
          title="대여 중"
          value={activeRentals}
          description="현재 대여 진행 중"
          href="/rentals"
          color="bg-amber-500"
        />
        <StatCard
          title="연체"
          value={overdueRentals}
          description="반납 기한 초과"
          href="/rentals?filter=overdue"
          color="bg-red-500"
        />
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
      </div>
    </div>
  );
}
