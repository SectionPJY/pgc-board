import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 특정 회원 조회 (GET /api/members/:id)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id: Number(id) },
    include: {
      // 대여 이력과 게임 정보 함께 조회
      rentals: {
        include: { game: true },
        orderBy: { rentedAt: "desc" },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(member);
}

// 회원 정보 수정 (PUT /api/members/:id)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, phone, email, notes } = body;

  if (!name) {
    return NextResponse.json({ error: "회원 이름은 필수입니다." }, { status: 400 });
  }

  const member = await prisma.member.update({
    where: { id: Number(id) },
    data: {
      name,
      phone: phone || null,
      email: email || null,
      notes: notes || null,
    },
  });

  return NextResponse.json(member);
}

// 회원 삭제 (DELETE /api/members/:id)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 현재 대여 중인 게임이 있는 회원은 삭제 불가
  const activeRentals = await prisma.rental.count({
    where: { memberId: Number(id), returnedAt: null },
  });

  if (activeRentals > 0) {
    return NextResponse.json(
      { error: "현재 대여 중인 게임이 있는 회원은 삭제할 수 없습니다." },
      { status: 400 }
    );
  }

  await prisma.member.delete({ where: { id: Number(id) } });
  return NextResponse.json({ message: "삭제되었습니다." });
}
