// backend/src/server.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const path = require("path");

// 환경에 따라 .env 파일 선택
const envFile = process.env.NODE_ENV === "production" ? ".env" : ".env.local";
const envPath = path.resolve(__dirname, "..", envFile);
require("dotenv").config({ path: envPath, override: true });

const prisma = require("./lib/prisma");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS origin 설정 (환경변수 또는 기본값)
const DEFAULT_ORIGINS = ["http://localhost:5173", "http://54.180.188.8:9000", "https://theonebook.me"];
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : DEFAULT_ORIGINS;

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// 라우트 임포트
const authRoutes = require("./routes/auth");
const chapterRoutes = require("./routes/chapters");
const pageRoutes = require("./routes/pages");
const uploadRoutes = require("./routes/upload");
const pdfRoutes = require("./routes/pdf");

// 라우트 등록
app.use("/api/auth", authRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/pdf", pdfRoutes);

// 정적 파일 경로 설정 (이미지 접근 가능하게)
app.use("/uploads", express.static("uploads"));

// 기본 라우트
app.get("/", (req, res) => {
  res.send("더 원 책 작성 API 서버");
});

// 글로벌 에러 핸들러 (라우트 등록 이후에 배치)
app.use(errorHandler);

// 데이터베이스 초기화 함수 - 기본 사용자 및 챕터 등록
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
      console.log("기본 사용자 생성 완료");
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
      console.log("기본 챕터 생성 완료");
    }
  } catch (error) {
    console.error("데이터베이스 초기화 오류:", error);
  }
}

// 서버 시작 전 초기화
initializeDatabase().then(() => {
  const HOST = process.env.HOST || "localhost";
  app.listen(PORT, () => {
    console.log(`서버 실행 중: http://${HOST}:${PORT}`);
  });
});


// Prisma 종료 처리
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
