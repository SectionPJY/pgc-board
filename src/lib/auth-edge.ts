import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

// Edge Runtime에서도 동작하는 JWT 검증 유틸리티
// next/headers를 사용하지 않아 미들웨어에서 안전하게 임포트 가능
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pgc-board-secret-key-change-in-production"
);

export const COOKIE_NAME = "pgc_session";

export type SessionPayload = {
  userId: number;
  username: string;
  role: "USER" | "ADMIN";
};

// JWT 토큰을 검증하고 페이로드 반환
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// NextRequest 쿠키에서 세션 정보 반환 (미들웨어용)
export async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
