import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// 회원가입 API (POST /api/auth/register)
// 관리자만 새 계정을 생성할 수 있음
export async function POST(request: NextRequest) {
  // 관리자 권한 확인
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "관리자만 계정을 생성할 수 있습니다." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { username, password, role } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "아이디와 비밀번호는 필수입니다." },
      { status: 400 }
    );
  }

  // 중복 아이디 확인
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { error: "이미 사용 중인 아이디입니다." },
      { status: 409 }
    );
  }

  // 비밀번호 해시화 (bcrypt, salt rounds=12)
  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashed,
      role: role === "ADMIN" ? "ADMIN" : "USER",
    },
  });

  return NextResponse.json(
    { id: user.id, username: user.username, role: user.role },
    { status: 201 }
  );
}
