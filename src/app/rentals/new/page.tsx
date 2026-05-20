"use client";

import { useRouter } from "next/navigation";

// 새 대여 등록 바로가기 페이지
// 홈 대시보드의 "새 대여 등록" 버튼에서 연결되며, 대여/반납 페이지로 리디렉션
export default function NewRentalPage() {
  const router = useRouter();

  // 컴포넌트가 마운트되는 즉시 대여 페이지로 이동
  // (모달 열기는 클라이언트 상태로 제어하므로, 쿼리 파라미터로 의도 전달)
  router.replace("/rentals?action=new");

  return null;
}
