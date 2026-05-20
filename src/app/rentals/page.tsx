"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/components/Modal";

// 대여 데이터 타입 정의
type Rental = {
  id: number;
  rentedAt: string;
  dueDate: string;
  returnedAt: string | null;
  notes: string | null;
  game: { id: number; name: string; category: string | null };
  member: { id: number; name: string; phone: string | null };
};

// 게임 및 회원 목록 타입 (폼 선택용)
type Game = { id: number; name: string; availableQuantity: number };
type Member = { id: number; name: string };

// 날짜를 한국어 형식으로 표시
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 연체 여부 확인 함수
function isOverdue(rental: Rental) {
  return !rental.returnedAt && new Date(rental.dueDate) < new Date();
}

// 대여 등록 폼 컴포넌트
function RentalForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: {
    gameId: number;
    memberId: number;
    dueDate: string;
    notes: string;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [games, setGames] = useState<Game[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [gameId, setGameId] = useState("");
  const [memberId, setMemberId] = useState("");
  // 기본 반납 기한: 오늘로부터 7일 후
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 폼 로드 시 게임/회원 목록 가져오기
  useEffect(() => {
    Promise.all([
      fetch("/api/games").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
    ]).then(([g, m]) => {
      // 대여 가능한 게임만 표시
      setGames(g.filter((game: Game) => game.availableQuantity > 0));
      setMembers(m);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId || !memberId) {
      setError("게임과 회원을 선택해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({
        gameId: Number(gameId),
        memberId: Number(memberId),
        dueDate,
        notes,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          게임 선택 <span className="text-red-500">*</span>
        </label>
        <select
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">게임을 선택하세요</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} (대여 가능: {g.availableQuantity}개)
            </option>
          ))}
        </select>
        {games.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">현재 대여 가능한 게임이 없습니다.</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          회원 선택 <span className="text-red-500">*</span>
        </label>
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">회원을 선택하세요</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} {m.phone ? `(${m.phone})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          반납 기한 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
          min={new Date().toISOString().slice(0, 10)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="특이사항 메모"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading || games.length === 0}
          className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "처리 중..." : "대여 등록"}
        </button>
      </div>
    </form>
  );
}

// 대여/반납 관리 페이지
export default function RentalsPage() {
  const searchParams = useSearchParams();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [filter, setFilter] = useState("active"); // 기본: 대여 중만 표시
  // URL에 ?action=new가 있으면 대여 등록 모달 자동 열기 (홈 바로가기에서 진입 시)
  const [showModal, setShowModal] = useState(searchParams.get("action") === "new");
  const [loading, setLoading] = useState(true);

  // 대여 목록 조회
  const fetchRentals = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/rentals?filter=${filter}`);
    const data = await res.json();
    setRentals(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  // 대여 등록
  const handleAdd = async (data: {
    gameId: number;
    memberId: number;
    dueDate: string;
    notes: string;
  }) => {
    const res = await fetch("/api/rentals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    fetchRentals();
  };

  // 반납 처리
  const handleReturn = async (rental: Rental) => {
    if (
      !confirm(
        `"${rental.member.name}"님의 "${rental.game.name}" 반납 처리하시겠습니까?`
      )
    )
      return;
    const res = await fetch(`/api/rentals/${rental.id}`, { method: "PATCH" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
      return;
    }
    fetchRentals();
  };

  // 필터 탭 정의
  const filterTabs = [
    { key: "active", label: "대여 중" },
    { key: "overdue", label: "연체" },
    { key: "returned", label: "반납 완료" },
    { key: "all", label: "전체" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">대여 / 반납</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
        >
          + 대여 등록
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-6 border-b pb-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-t text-sm font-medium transition ${
              filter === tab.key
                ? "bg-indigo-600 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 대여 목록 */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">불러오는 중...</p>
      ) : rentals.length === 0 ? (
        <p className="text-center text-gray-400 py-10">해당 대여 기록이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {rentals.map((rental) => {
            const overdue = isOverdue(rental);
            return (
              <div
                key={rental.id}
                className={`bg-white rounded-xl shadow-sm p-4 flex items-center justify-between gap-4 ${
                  overdue ? "border-l-4 border-red-400" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">
                      {rental.game.name}
                    </span>
                    {rental.game.category && (
                      <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded">
                        {rental.game.category}
                      </span>
                    )}
                    {/* 연체 배지 */}
                    {overdue && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium">
                        연체
                      </span>
                    )}
                    {/* 반납 완료 배지 */}
                    {rental.returnedAt && (
                      <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded">
                        반납 완료
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    대여자: <span className="text-gray-700 font-medium">{rental.member.name}</span>
                    {rental.member.phone && (
                      <span className="ml-1 text-gray-400">({rental.member.phone})</span>
                    )}
                  </p>
                  <div className="flex gap-4 text-xs text-gray-400 mt-1 flex-wrap">
                    <span>대여일: {formatDate(rental.rentedAt)}</span>
                    <span className={overdue ? "text-red-500 font-medium" : ""}>
                      반납기한: {formatDate(rental.dueDate)}
                    </span>
                    {rental.returnedAt && (
                      <span className="text-emerald-500">
                        반납일: {formatDate(rental.returnedAt)}
                      </span>
                    )}
                  </div>
                  {rental.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      메모: {rental.notes}
                    </p>
                  )}
                </div>

                {/* 미반납 건만 반납 버튼 표시 */}
                {!rental.returnedAt && (
                  <button
                    onClick={() => handleReturn(rental)}
                    className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-white ${
                      overdue
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-emerald-500 hover:bg-emerald-600"
                    }`}
                  >
                    반납
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 대여 등록 모달 */}
      {showModal && (
        <Modal title="새 대여 등록" onClose={() => setShowModal(false)}>
          <RentalForm
            onSubmit={handleAdd}
            onClose={() => setShowModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}
