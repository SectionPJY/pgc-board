import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createToken, setSessionCookie } from "@/lib/auth";

// 로그인 API (POST /api/auth/login)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "아이디와 비밀번호를 입력해주세요." },
      { status: 400 }
    );
  }

  // DB에서 사용자 조회
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    // 보안상 "아이디 또는 비밀번호가 틀렸습니다"로 통일
    return NextResponse.json(
      { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  // 비밀번호 검증 (bcrypt 비교)
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json(
      { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  // JWT 생성 및 쿠키 저장
  const token = await createToken({
    userId: user.id,
    username: user.username,
    role: user.role as "USER" | "ADMIN",
  });
  await setSessionCookie(token);

  return NextResponse.json({
    username: user.username,
    role: user.role,
  });
}
