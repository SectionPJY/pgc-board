import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 보드게임 목록 조회 (GET /api/games)
// 쿼리 파라미터: search (이름 검색), category (카테고리 필터)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  const games = await prisma.game.findMany({
    where: {
      // 이름 또는 설명에 검색어가 포함된 게임 필터링
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      // 카테고리 필터 적용
      ...(category && { category }),
    },
    include: {
      // 현재 대여 중인 건수 포함
      _count: { select: { rentals: { where: { returnedAt: null } } } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(games);
}

// 보드게임 등록 (POST /api/games)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, category, minPlayers, maxPlayers, totalQuantity } =
    body;

  // 필수 입력값 검증
  if (!name || !totalQuantity) {
    return NextResponse.json(
      { error: "게임 이름과 수량은 필수입니다." },
      { status: 400 }
    );
  }

  const qty = Number(totalQuantity);
  const game = await prisma.game.create({
    data: {
      name,
      description: description || null,
      category: category || null,
      minPlayers: Number(minPlayers) || 2,
      maxPlayers: Number(maxPlayers) || 4,
      totalQuantity: qty,
      availableQuantity: qty, // 처음 등록 시 전체 수량이 대여 가능
    },
  });

  return NextResponse.json(game, { status: 201 });
}
