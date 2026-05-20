import { defineConfig } from "prisma/config";

// Prisma 7 설정 파일: 마이그레이션과 DB 연결 URL을 여기서 관리
export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
  datasource: {
    // SQLite DB 파일 경로 (prisma 폴더 내에 생성)
    url: "file:./prisma/dev.db",
  },
});
