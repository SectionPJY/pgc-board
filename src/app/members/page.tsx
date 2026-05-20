"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/Modal";

// 회원 데이터 타입 정의
type Member = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  _count?: { rentals: number };
};

// 회원 폼 초기값
const emptyForm = { name: "", phone: "", email: "", notes: "" };

// 회원 등록/수정 폼 컴포넌트
function MemberForm({
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="홍길동"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="010-0000-0000"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="example@email.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="특이사항 등 메모"
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

// 회원 관리 페이지
export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  // 회원 목록 조회
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/members?${params}`);
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // 회원 등록
  const handleAdd = async (form: typeof emptyForm) => {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    fetchMembers();
  };

  // 회원 수정
  const handleEdit = async (form: typeof emptyForm) => {
    const res = await fetch(`/api/members/${selectedMember!.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    fetchMembers();
  };

  // 회원 삭제
  const handleDelete = async (member: Member) => {
    if (!confirm(`"${member.name}" 회원을 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
      return;
    }
    fetchMembers();
  };

  // 가입일 포맷 변환
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ko-KR");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">회원 관리</h1>
        <button
          onClick={() => setModal("add")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
        >
          + 회원 추가
        </button>
      </div>

      {/* 검색 입력 */}
      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 전화번호, 이메일 검색..."
          className="w-full max-w-sm border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* 회원 목록 */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">불러오는 중...</p>
      ) : members.length === 0 ? (
        <p className="text-center text-gray-400 py-10">등록된 회원이 없습니다.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-4 py-3 text-left">이름</th>
                <th className="px-4 py-3 text-left">연락처</th>
                <th className="px-4 py-3 text-center">현재 대여</th>
                <th className="px-4 py-3 text-center">가입일</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{member.name}</p>
                    {member.notes && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                        {member.notes}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {member.phone && <p>{member.phone}</p>}
                    {member.email && (
                      <p className="text-xs text-gray-400">{member.email}</p>
                    )}
                    {!member.phone && !member.email && (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  {/* 현재 대여 중인 게임 수 표시 */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-semibold ${
                        (member._count?.rentals ?? 0) > 0
                          ? "text-amber-500"
                          : "text-gray-400"
                      }`}
                    >
                      {member._count?.rentals ?? 0}건
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">
                    {formatDate(member.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedMember(member);
                        setModal("edit");
                      }}
                      className="text-indigo-600 hover:underline mr-3 text-xs"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(member)}
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

      {/* 회원 추가 모달 */}
      {modal === "add" && (
        <Modal title="새 회원 추가" onClose={() => setModal(null)}>
          <MemberForm
            initial={emptyForm}
            onSubmit={handleAdd}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {/* 회원 수정 모달 */}
      {modal === "edit" && selectedMember && (
        <Modal title="회원 정보 수정" onClose={() => setModal(null)}>
          <MemberForm
            initial={{
              name: selectedMember.name,
              phone: selectedMember.phone || "",
              email: selectedMember.email || "",
              notes: selectedMember.notes || "",
            }}
            onSubmit={handleEdit}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
