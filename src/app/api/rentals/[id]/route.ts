import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 반납 처리 (PATCH /api/rentals/:id)
// 대여 중인 게임을 반납 처리하고 재고를 복구
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 해당 대여 기록 조회
  const rental = await prisma.rental.findUnique({
    where: { id: Number(id) },
  });

  if (!rental) {
    return NextResponse.json({ error: "대여 기록을 찾을 수 없습니다." }, { status: 404 });
  }

  // 이미 반납된 경우 처리 거부
  if (rental.returnedAt) {
    return NextResponse.json(
      { error: "이미 반납된 대여 건입니다." },
      { status: 400 }
    );
  }

  // 트랜잭션으로 반납 처리와 재고 복구를 원자적으로 처리
  const updated = await prisma.$transaction(async (tx) => {
    const updatedRental = await tx.rental.update({
      where: { id: Number(id) },
      data: { returnedAt: new Date() }, // 현재 시각으로 반납 처리
      include: { game: true, member: true },
    });

    // 대여 가능 수량 1 증가 (재고 복구)
    await tx.game.update({
      where: { id: rental.gameId },
      data: { availableQuantity: { increment: 1 } },
    });

    return updatedRental;
  });

  return NextResponse.json(updated);
}

// 대여 기록 삭제 (DELETE /api/rentals/:id)
// 반납 완료된 기록만 삭제 가능
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rental = await prisma.rental.findUnique({ where: { id: Number(id) } });
  if (!rental) {
    return NextResponse.json({ error: "대여 기록을 찾을 수 없습니다." }, { status: 404 });
  }

  // 대여 중인 기록은 삭제 불가 (반납 처리 먼저 해야 함)
  if (!rental.returnedAt) {
    return NextResponse.json(
      { error: "반납 처리 후에 삭제할 수 있습니다." },
      { status: 400 }
    );
  }

  await prisma.rental.delete({ where: { id: Number(id) } });
  return NextResponse.json({ message: "삭제되었습니다." });
}
