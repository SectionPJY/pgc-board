import { SignJWT } from "jose";
import { cookies } from "next/headers";
// edge 모듈에서 공통 타입 및 상수 재사용
export { verifyToken, getSessionFromRequest, COOKIE_NAME } from "@/lib/auth-edge";
export type { SessionPayload } from "@/lib/auth-edge";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pgc-board-secret-key-change-in-production"
);

import type { SessionPayload } from "@/lib/auth-edge";
import { COOKIE_NAME, verifyToken } from "@/lib/auth-edge";

// JWT 토큰 생성 (로그인 성공 시 호출)
export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // 7일 유효
    .sign(SECRET);
}

// 서버 컴포넌트에서 현재 세션 조회 (next/headers 사용)
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// 로그인 성공 시 세션 쿠키에 JWT 저장
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,   // JS 접근 차단 (XSS 방지)
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7일
    path: "/",
  });
}

// 로그아웃 시 세션 쿠키 삭제
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
