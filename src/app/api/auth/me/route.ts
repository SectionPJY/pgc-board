import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// 현재 로그인된 사용자 정보 반환 (GET /api/auth/me)
// 클라이언트에서 로그인 상태 확인에 사용
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      username: session.username,
      role: session.role,
    },
  });
}
