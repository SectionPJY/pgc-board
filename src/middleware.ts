import { NextRequest, NextResponse } from "next/server";
// Edge Runtime 호환 모듈만 임포트 (next/headers 미사용)
import { getSessionFromRequest } from "@/lib/auth-edge";

// 로그인이 필요한 페이지 경로
const AUTH_REQUIRED_PAGES = ["/rentals", "/members", "/stats"];

// 관리자 전용 API (쓰기 작업): 경로 패턴과 허용 메서드
const ADMIN_ONLY_API: { pattern: RegExp; methods: string[] }[] = [
  { pattern: /^\/api\/games/, methods: ["POST", "PUT", "DELETE"] },
  { pattern: /^\/api\/members/, methods: ["GET", "POST", "PUT", "DELETE"] },
  { pattern: /^\/api\/stats/, methods: ["GET"] },
  { pattern: /^\/api\/auth\/register/, methods: ["POST"] },
];

// 로그인이 필요한 API
const USER_REQUIRED_API: { pattern: RegExp; methods: string[] }[] = [
  { pattern: /^\/api\/rentals/, methods: ["POST", "PATCH", "DELETE"] },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const session = await getSessionFromRequest(request);

  // ── 페이지 접근 제어 ──────────────────────────────────────
  // 로그인 페이지는 이미 로그인된 경우 홈으로 리다이렉트
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 로그인이 필요한 페이지에 비로그인 접근 시 로그인 페이지로 이동
  const needsAuth = AUTH_REQUIRED_PAGES.some((p) => pathname.startsWith(p));
  if (needsAuth && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── API 접근 제어 ─────────────────────────────────────────
  // 관리자 전용 API 확인
  const isAdminRoute = ADMIN_ONLY_API.some(
    ({ pattern, methods }) => pattern.test(pathname) && methods.includes(method)
  );
  if (isAdminRoute) {
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }
  }

  // 로그인 필요 API 확인
  const isUserRoute = USER_REQUIRED_API.some(
    ({ pattern, methods }) => pattern.test(pathname) && methods.includes(method)
  );
  if (isUserRoute && !session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  // 정적 파일과 Next.js 내부 경로는 미들웨어 제외
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
