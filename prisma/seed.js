const path = require("path");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { PrismaClient } = require("@prisma/client");

// Prisma 7: URL 형식으로 SQLite DB 경로를 어댑터에 전달
const dbPath = path.join(__dirname, "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const games = [
    { name: "카탄", category: "전략", minPlayers: 3, maxPlayers: 4, totalQuantity: 2, availableQuantity: 2, description: "자원을 모아 섬을 개척하는 전략 보드게임" },
    { name: "코드네임", category: "파티", minPlayers: 2, maxPlayers: 8, totalQuantity: 3, availableQuantity: 3, description: "스파이 요원을 찾는 단어 추리 게임" },
    { name: "뱅!", category: "파티", minPlayers: 4, maxPlayers: 7, totalQuantity: 2, availableQuantity: 2, description: "서부 배경의 역할 추리 게임" },
    { name: "도미니언", category: "덱빌딩", minPlayers: 2, maxPlayers: 4, totalQuantity: 1, availableQuantity: 1, description: "카드를 구매하고 덱을 구축하는 게임" },
    { name: "아줄", category: "추상", minPlayers: 2, maxPlayers: 4, totalQuantity: 2, availableQuantity: 2, description: "타일을 배치하여 패턴을 완성하는 게임" },
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: { id: games.indexOf(game) + 1 },
      update: {},
      create: game,
    });
  }

  console.log("Seed data created successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
