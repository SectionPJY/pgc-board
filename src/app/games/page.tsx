"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/components/Modal";

// 보드게임 데이터 타입 정의
type Game = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  minPlayers: number;
  maxPlayers: number;
  totalQuantity: number;
  availableQuantity: number;
  _count?: { rentals: number };
};

// 게임 폼 초기값
const emptyForm = {
  name: "",
  description: "",
  category: "",
  minPlayers: 2,
  maxPlayers: 4,
  totalQuantity: 1,
};

// 게임 등록/수정 폼 컴포넌트
function GameForm({
  initial,
  onSubmit,
  onClose,
}: {
  initial: typeof emptyForm;
  onSubmit: (data: typeof emptyForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSubmit(form);
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
          게임 이름 <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="카탄, 코드네임 등"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">선택 안 함</option>
          {["전략", "파티", "추상", "덱빌딩", "협력", "경제", "RPG", "기타"].map(
            (c) => (
              <option key={c} value={c}>{c}</option>
            )
          )}
        </select>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">최소 인원</label>
          <input
            type="number"
            name="minPlayers"
            value={form.minPlayers}
            onChange={handleChange}
            min={1}
            max={20}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">최대 인원</label>
          <input
            type="number"
            name="maxPlayers"
            value={form.maxPlayers}
            onChange={handleChange}
            min={1}
            max={20}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            보유 수량 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="totalQuantity"
            value={form.totalQuantity}
            onChange={handleChange}
            min={1}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="간단한 게임 설명"
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
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}

// 보드게임 관리 페이지
export default function GamesPage() {
  const searchParams = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  // 홈 바로가기에서 ?action=new 로 진입하면 모달 자동 열기
  const [modal, setModal] = useState<"add" | "edit" | null>(
    searchParams.get("action") === "new" ? "add" : null
  );
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  // 게임 목록 조회
  const fetchGames = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    const res = await fetch(`/api/games?${params}`);
    const data = await res.json();
    setGames(data);
    setLoading(false);
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // 게임 등록
  const handleAdd = async (form: typeof emptyForm) => {
    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    fetchGames();
  };

  // 게임 수정
  const handleEdit = async (form: typeof emptyForm) => {
    const res = await fetch(`/api/games/${selectedGame!.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    fetchGames();
  };

  // 게임 삭제
  const handleDelete = async (game: Game) => {
    if (!confirm(`"${game.name}"을(를) 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/games/${game.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
      return;
    }
    fetchGames();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">보드게임 관리</h1>
        <button
          onClick={() => setModal("add")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
        >
          + 게임 추가
        </button>
      </div>

      {/* 검색 및 필터 영역 */}
      <div className="flex gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="게임 이름 검색..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">전체 카테고리</option>
          {["전략", "파티", "추상", "덱빌딩", "협력", "경제", "RPG", "기타"].map(
            (c) => <option key={c} value={c}>{c}</option>
          )}
        </select>
      </div>

      {/* 게임 목록 테이블 */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">불러오는 중...</p>
      ) : games.length === 0 ? (
        <p className="text-center text-gray-400 py-10">등록된 게임이 없습니다.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-4 py-3 text-left">게임 이름</th>
                <th className="px-4 py-3 text-left">카테고리</th>
                <th className="px-4 py-3 text-center">인원</th>
                <th className="px-4 py-3 text-center">재고</th>
                <th className="px-4 py-3 text-center">대여 가능</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {games.map((game) => (
                <tr key={game.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {game.name}
                    {game.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                        {game.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {game.category ? (
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
                        {game.category}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {game.minPlayers}~{game.maxPlayers}명
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {game.totalQuantity}개
                  </td>
                  {/* 대여 가능 수량에 따라 색상 변경 */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-semibold ${
                        game.availableQuantity === 0
                          ? "text-red-500"
                          : game.availableQuantity < game.totalQuantity
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {game.availableQuantity}개
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedGame(game);
                        setModal("edit");
                      }}
                      className="text-indigo-600 hover:underline mr-3 text-xs"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(game)}
                      className="text-red-500 hover:underline text-xs"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 게임 추가 모달 */}
      {modal === "add" && (
        <Modal title="새 게임 추가" onClose={() => setModal(null)}>
          <GameForm
            initial={emptyForm}
            onSubmit={handleAdd}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {/* 게임 수정 모달 */}
      {modal === "edit" && selectedGame && (
        <Modal title="게임 정보 수정" onClose={() => setModal(null)}>
          <GameForm
            initial={{
              name: selectedGame.name,
              description: selectedGame.description || "",
              category: selectedGame.category || "",
              minPlayers: selectedGame.minPlayers,
              maxPlayers: selectedGame.maxPlayers,
              totalQuantity: selectedGame.totalQuantity,
            }}
            onSubmit={handleEdit}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
