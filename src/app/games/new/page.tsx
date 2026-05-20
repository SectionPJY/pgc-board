"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// 홈 "게임 추가" 바로가기에서 진입 시 게임 관리 페이지로 리다이렉트
// 쿼리 파라미터 action=new 를 전달하여 모달 자동 열기
export default function NewGamePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/games?action=new");
  }, [router]);

  return null;
}
