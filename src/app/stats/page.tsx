"use client";

import { useState, useEffect } from "react";

// 통계 데이터 타입 정의
type StatsData = {
  overview: {
    totalGames: number;
    totalMembers: number;
    totalRentals: number;
    activeRentals: number;
    overdueRentals: number;
  };
  popularGames: {
    id: number;
    name: string;
    category: string | null;
    rentalCount: number;
    availableQuantity: number;
    totalQuantity: number;
  }[];
  recentRentals: {
    id: number;
    rentedAt: string;
    returnedAt: string | null;
    game: { name: string };
    member: { name: string };
  }[];
  categoryStats: { category: string; count: number }[];
};

// 날짜 형식 변환 헬퍼
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

// 통계 페이지
export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 통계 API 호출
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-center text-gray-400 py-20">불러오는 중...</p>;
  }

  if (!stats) return null;

  const { overview, popularGames, recentRentals, categoryStats } = stats;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">통계 / 리포트</h1>

      {/* 전체 현황 요약 카드 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">전체 현황</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "게임 종류", value: overview.totalGames, color: "bg-indigo-50 text-indigo-700" },
            { label: "전체 회원", value: overview.totalMembers, color: "bg-emerald-50 text-emerald-700" },
            { label: "총 대여 횟수", value: overview.totalRentals, color: "bg-blue-50 text-blue-700" },
            { label: "대여 중", value: overview.activeRentals, color: "bg-amber-50 text-amber-700" },
            { label: "연체 중", value: overview.overdueRentals, color: "bg-red-50 text-red-700" },
          ].map((item) => (
            <div key={item.label} className={`${item.color} rounded-xl p-4 text-center`}>
              <p className="text-3xl font-bold">{item.value}</p>
              <p className="text-sm mt-1 opacity-70">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 인기 게임 순위 TOP 5 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            인기 게임 TOP 5
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {popularGames.length === 0 ? (
              <p className="text-center text-gray-400 py-8">데이터가 없습니다.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="px-4 py-2 text-left">순위</th>
                    <th className="px-4 py-2 text-left">게임</th>
                    <th className="px-4 py-2 text-center">대여 횟수</th>
                    <th className="px-4 py-2 text-center">현재 상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {popularGames.map((game, idx) => (
                    <tr key={game.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-400">
                        {/* 1~3위는 트로피 이모지로 강조 */}
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}위`}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{game.name}</p>
                        {game.category && (
                          <p className="text-xs text-gray-400">{game.category}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-indigo-600">
                        {game.rentalCount}회
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            game.availableQuantity === 0
                              ? "bg-red-100 text-red-600"
                              : "bg-emerald-100 text-emerald-600"
                          }`}
                        >
                          {game.availableQuantity === 0
                            ? "대여 중"
                            : `${game.availableQuantity}/${game.totalQuantity} 가능`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* 카테고리별 보유 현황 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            카테고리별 보유 현황
          </h2>
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            {categoryStats.length === 0 ? (
              <p className="text-center text-gray-400 py-8">데이터가 없습니다.</p>
            ) : (
              (() => {
                // 전체 대비 비율 바 그래프로 표시
                const maxCount = Math.max(...categoryStats.map((c) => c.count));
                return categoryStats.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{cat.category}</span>
                      <span className="text-gray-400">{cat.count}종</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full transition-all"
                        style={{ width: `${(cat.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ));
              })()
            )}
          </div>
        </section>
      </div>

      {/* 최근 대여 이력 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">최근 대여 이력</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {recentRentals.length === 0 ? (
            <p className="text-center text-gray-400 py-8">대여 이력이 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-2 text-left">게임</th>
                  <th className="px-4 py-2 text-left">회원</th>
                  <th className="px-4 py-2 text-center">대여일</th>
                  <th className="px-4 py-2 text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentRentals.map((rental) => (
                  <tr key={rental.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {rental.game.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{rental.member.name}</td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">
                      {formatDate(rental.rentedAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rental.returnedAt ? (
                        <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded">
                          반납 완료
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded">
                          대여 중
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
