// backend/src/index.js
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors({
  origin: ["http://localhost:5173", "http://54.180.188.8:9000"], // 프론트 주소
  credentials: true
}));

// 라우트 임포트
const authRoutes = require("./routes/auth");
const chapterRoutes = require("./routes/chapters");
const pageRoutes = require("./routes/pages"); // ✅ 새로 추가
const uploadRoutes = require("./routes/upload"); // ✅ 파일 업로드 라우트

// 라우트 등록
app.use("/api/auth", authRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/pages", pageRoutes); // ✅ 페이지 API 등록
app.use("/api/upload", uploadRoutes); // ✅ 파일 업로드 API 등록

// 정적 파일 경로 설정 (이미지 접근 가능하게)
app.use("/uploads", express.static("uploads"));


// 기본 라우트
app.get("/", (req, res) => {
  res.send("더 원 책 작성 API 서버");
});

// ✅ 데이터베이스 초기화 함수 - 기본 사용자 및 챕터 등록
async function initializeDatabase() {
  try {
    // 사용자 생성
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash("theone", 10);
      await prisma.user.createMany({
        data: [
          { username: "joanna", password: hashedPassword, name: "조안나" },
          { username: "oksusu", password: hashedPassword, name: "옥수수" },
          { username: "guest", password: hashedPassword, name: "게스트" },
        ],
        skipDuplicates: true,
      });
      console.log("✅ 기본 사용자 생성 완료");
    }

    // 챕터 생성
    const chapterCount = await prisma.chapter.count();
    if (chapterCount === 0) {
      const chapters = [
        { title: "머리말", order: 1 },
        { title: "목차", order: 2 },
        { title: "문제", order: 3 },
        { title: "마음", order: 4 },
        { title: "감정", order: 5 },
        { title: "몸", order: 6 },
        { title: "수면", order: 7 },
        { title: "과학", order: 8 },
        { title: "관계", order: 9 },
        { title: "성공", order: 10 },
        { title: "자아발견", order: 11 },
        { title: "맺음말", order: 12 },
      ];
      await prisma.chapter.createMany({ data: chapters, skipDuplicates: true });
      console.log("✅ 기본 챕터 생성 완료");
    }
  } catch (error) {
    console.error("❌ 데이터베이스 초기화 오류:", error);
  }
}

// 서버 시작 전 초기화
initializeDatabase().then(() => {
  const HOST = process.env.HOST || "localhost"; // 🔄 동적 호스트 설정
  app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://${HOST}:${PORT}`);
  });
});


// Prisma 종료 처리
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
