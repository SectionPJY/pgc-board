import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 통계 데이터 조회 (GET /api/stats)
// 대시보드와 통계 페이지에서 사용되는 종합 통계를 반환
export async function GET() {
  const now = new Date();

  // 여러 통계를 병렬로 조회하여 응답 속도 향상
  const [
    totalGames,
    totalMembers,
    totalRentals,
    activeRentals,
    overdueRentals,
    popularGames,
    recentRentals,
    categoryStats,
  ] = await Promise.all([
    // 전체 게임 종류 수
    prisma.game.count(),

    // 전체 회원 수
    prisma.member.count(),

    // 누적 대여 건수
    prisma.rental.count(),

    // 현재 대여 중인 건수
    prisma.rental.count({ where: { returnedAt: null } }),

    // 연체 건수 (기한 초과이면서 미반납)
    prisma.rental.count({
      where: { returnedAt: null, dueDate: { lt: now } },
    }),

    // 가장 많이 대여된 인기 게임 TOP 5
    prisma.game.findMany({
      include: { _count: { select: { rentals: true } } },
      orderBy: { rentals: { _count: "desc" } },
      take: 5,
    }),

    // 최근 대여 이력 10건
    prisma.rental.findMany({
      include: { game: true, member: true },
      orderBy: { rentedAt: "desc" },
      take: 10,
    }),

    // 카테고리별 게임 수 집계
    prisma.game.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);

  return NextResponse.json({
    overview: {
      totalGames,
      totalMembers,
      totalRentals,
      activeRentals,
      overdueRentals,
    },
    popularGames: popularGames.map((g) => ({
      id: g.id,
      name: g.name,
      category: g.category,
      rentalCount: g._count.rentals,
      availableQuantity: g.availableQuantity,
      totalQuantity: g.totalQuantity,
    })),
    recentRentals,
    categoryStats: categoryStats.map((c) => ({
      category: c.category || "미분류",
      count: c._count.id,
    })),
  });
}
