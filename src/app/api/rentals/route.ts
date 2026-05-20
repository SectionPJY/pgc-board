import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 대여 목록 조회 (GET /api/rentals)
// 쿼리 파라미터: filter (all | active | overdue | returned)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all";

  const now = new Date();

  // 필터 조건 설정
  const where =
    filter === "active"
      ? { returnedAt: null } // 현재 대여 중
      : filter === "overdue"
      ? { returnedAt: null, dueDate: { lt: now } } // 연체 중
      : filter === "returned"
      ? { returnedAt: { not: null } } // 반납 완료
      : {}; // 전체

  const rentals = await prisma.rental.findMany({
    where,
    include: {
      game: true,   // 게임 정보 포함
      member: true, // 회원 정보 포함
    },
    orderBy: { rentedAt: "desc" },
  });

  return NextResponse.json(rentals);
}

// 대여 등록 (POST /api/rentals)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { gameId, memberId, dueDate, notes } = body;

  // 필수 입력값 검증
  if (!gameId || !memberId || !dueDate) {
    return NextResponse.json(
      { error: "게임, 회원, 반납 기한은 필수입니다." },
      { status: 400 }
    );
  }

  // 대여 가능 수량 확인
  const game = await prisma.game.findUnique({ where: { id: Number(gameId) } });
  if (!game) {
    return NextResponse.json({ error: "게임을 찾을 수 없습니다." }, { status: 404 });
  }
  if (game.availableQuantity < 1) {
    return NextResponse.json(
      { error: "현재 대여 가능한 수량이 없습니다." },
      { status: 400 }
    );
  }

  // 트랜잭션으로 대여 생성과 재고 감소를 원자적으로 처리
  const rental = await prisma.$transaction(async (tx) => {
    const newRental = await tx.rental.create({
      data: {
        gameId: Number(gameId),
        memberId: Number(memberId),
        dueDate: new Date(dueDate),
        notes: notes || null,
      },
      include: { game: true, member: true },
    });

    // 대여 가능 수량 1 감소
    await tx.game.update({
      where: { id: Number(gameId) },
      data: { availableQuantity: { decrement: 1 } },
    });

    return newRental;
  });

  return NextResponse.json(rental, { status: 201 });
}
