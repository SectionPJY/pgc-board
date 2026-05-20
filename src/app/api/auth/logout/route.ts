import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

// 로그아웃 API (POST /api/auth/logout)
// 세션 쿠키를 삭제하여 로그아웃 처리
export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ message: "로그아웃되었습니다." });
}
