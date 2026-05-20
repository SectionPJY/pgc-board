import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 회원 목록 조회 (GET /api/members)
// 쿼리 파라미터: search (이름/전화번호 검색)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const members = await prisma.member.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {},
    include: {
      // 현재 대여 중인 건수 포함
      _count: { select: { rentals: { where: { returnedAt: null } } } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(members);
}

// 회원 등록 (POST /api/members)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, phone, email, notes } = body;

  // 이름은 필수 입력값
  if (!name) {
    return NextResponse.json({ error: "회원 이름은 필수입니다." }, { status: 400 });
  }

  const member = await prisma.member.create({
    data: {
      name,
      phone: phone || null,
      email: email || null,
      notes: notes || null,
    },
  });

  return NextResponse.json(member, { status: 201 });
}
