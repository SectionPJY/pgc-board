import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 특정 보드게임 조회 (GET /api/games/:id)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const game = await prisma.game.findUnique({
    where: { id: Number(id) },
    include: {
      // 대여 이력도 함께 조회 (회원 정보 포함)
      rentals: {
        include: { member: true },
        orderBy: { rentedAt: "desc" },
        take: 10, // 최근 10건만 조회
      },
    },
  });

  if (!game) {
    return NextResponse.json({ error: "게임을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(game);
}

// 보드게임 정보 수정 (PUT /api/games/:id)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, description, category, minPlayers, maxPlayers, totalQuantity } =
    body;

  if (!name) {
    return NextResponse.json({ error: "게임 이름은 필수입니다." }, { status: 400 });
  }

  // 현재 대여 중인 수량을 구하여 가용 수량을 재계산
  const activeRentals = await prisma.rental.count({
    where: { gameId: Number(id), returnedAt: null },
  });

  const newTotal = Number(totalQuantity);
  // 대여 중인 수량보다 총 수량이 작아지면 안 됨
  if (newTotal < activeRentals) {
    return NextResponse.json(
      { error: `현재 ${activeRentals}개가 대여 중이라 총 수량을 그 이하로 줄일 수 없습니다.` },
      { status: 400 }
    );
  }

  const game = await prisma.game.update({
    where: { id: Number(id) },
    data: {
      name,
      description: description || null,
      category: category || null,
      minPlayers: Number(minPlayers) || 2,
      maxPlayers: Number(maxPlayers) || 4,
      totalQuantity: newTotal,
      availableQuantity: newTotal - activeRentals,
    },
  });

  return NextResponse.json(game);
}

// 보드게임 삭제 (DELETE /api/games/:id)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 현재 대여 중인 게임은 삭제 불가
  const activeRentals = await prisma.rental.count({
    where: { gameId: Number(id), returnedAt: null },
  });

  if (activeRentals > 0) {
    return NextResponse.json(
      { error: "현재 대여 중인 게임은 삭제할 수 없습니다." },
      { status: 400 }
    );
  }

  await prisma.game.delete({ where: { id: Number(id) } });
  return NextResponse.json({ message: "삭제되었습니다." });
}
