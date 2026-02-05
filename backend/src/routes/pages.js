const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 전체 페이지 목록 조회 + 전역 페이지 번호 포함
 */
router.get("/", async (req, res) => {
  try {
    // 1. 챕터 순서대로 정렬 + 각 챕터의 페이지들 정렬
    const chapters = await prisma.chapter.findMany({
      orderBy: { order: "asc" },
      include: {
        pages: {
          orderBy: { order: "asc" },
        },
      },
    });

    // 2. 페이지 번호 누적 계산
    let totalCount = 0;
    const pagesWithGlobalPageNumbers = [];

    for (const chapter of chapters) {
      for (const page of chapter.pages) {
        totalCount++; // 누적된 전역 페이지 번호
        pagesWithGlobalPageNumbers.push({
          ...page,
          chapterTitle: chapter.title,
          globalPageNumber: totalCount,
        });
      }
    }

    res.json(pagesWithGlobalPageNumbers);
  } catch (error) {
    console.error("페이지 목록 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.put("/:id", async (req, res) => {
  console.log("📥 [요청 수신] 페이지 수정 요청 도착");
  console.log("📦 요청 파라미터 pageId:", req.params.id);
  console.log("📝 요청 바디:", req.body);

  const pageId = parseInt(req.params.id);
  const { title, content, memo, imageUrl, chapterId, userId, order } = req.body;

  // 파싱 및 값 확인
  const parsedOrder = parseInt(order);
  const parsedChapterId = parseInt(chapterId);
  const parsedUserId = parseInt(userId);

  console.log("🔍 파싱된 값들:", {
    parsedOrder,
    parsedChapterId,
    parsedUserId,
  });

  // 유효성 검사
  const errors = [];
  if (!title) errors.push("title 없음");
  if (!content) errors.push("content 없음");
  if (isNaN(parsedOrder)) errors.push("order 파싱 실패");
  if (isNaN(parsedChapterId)) errors.push("chapterId 파싱 실패");
  if (isNaN(parsedUserId)) errors.push("userId 파싱 실패");

  if (errors.length > 0) {
    console.warn("⚠️ 유효성 검사 실패:", errors);
    return res.status(400).json({
      message: "입력값이 유효하지 않습니다.",
      details: errors,
      rawInput: { title, content, memo, imageUrl, chapterId, userId, order },
    });
  }

  try {
    console.log("🚀 페이지 수정 시도 - Prisma page.update()");
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        title,
        content,
        memo,
        imageUrl,
        order: parsedOrder,
        chapter: { connect: { id: parsedChapterId } },
        user: { connect: { id: parsedUserId } },
      },
    });

    console.log("✅ 페이지 수정 성공:", updatedPage);
    res.json(updatedPage);
  } catch (error) {
    console.error("❌ 페이지 수정 실패");
    console.error("🧨 Prisma 오류 내용:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    res.status(500).json({
      message: "페이지 수정 중 오류가 발생했습니다.",
      error: error.message,
      code: error.code,
      meta: error.meta,
    });
  }
});


// 페이지 생성 API
// 
router.post("/", async (req, res) => {
  const { title, imageUrl, content, memo, chapterId, userId, order } = req.body;

  console.log("📥 [요청 수신] 페이지 생성 요청 도착");
  console.log("📝 요청 바디:", {
    title,
    imageUrl,
    content,
    memo,
    chapterId,
    userId,
    order,
  });

  try {
    // 🧪 파싱 (문자열일 수 있는 숫자들 변환)
    const parsedOrder = parseInt(order);
    const parsedChapterId = parseInt(chapterId);
    const parsedUserId = parseInt(userId);

    console.log("🔍 파싱된 값들:", {
      parsedOrder,
      parsedChapterId,
      parsedUserId,
    });

    // 🛑 필수값 체크
    if (!title  || isNaN(parsedOrder) || isNaN(parsedChapterId) || isNaN(parsedUserId)) {
      console.warn("⚠️ 유효하지 않은 입력값 감지");
      return res.status(400).json({
        message: "입력값이 부족하거나 잘못되었습니다.",
        detail: {
          title,
          content,
          order,
          chapterId,
          userId,
        },
      });
    }

    // 🔁 중복 확인: 같은 챕터에서 같은 제목의 페이지가 있는지 확인
    const existing = await prisma.page.findFirst({
      where: {
        chapterId: parsedChapterId,
        title: title,
      },
    });

    if (existing) {
      console.warn("⚠️ 중복된 제목 발견");
      return res.status(400).json({
        message: "같은 단어가 이미 있습니다, 페이지조회를 눌러서 수정하세요",
        duplicate: true,
        existingPageId: existing.id, // 선택적으로 프론트에서 링크할 수 있도록
      });
    }

    // ✅ 중복이 아니면 새로 생성
    const newPage = await prisma.page.create({
      data: {
        title,
        imageUrl,
        content,
        memo,
        chapterId: parsedChapterId,
        userId: parsedUserId,
        order: parsedOrder,
      },
    });

    console.log("✅ 페이지 생성 성공:", newPage);
    res.status(201).json(newPage);

  } catch (error) {
    console.error("❌ 페이지 생성 에러 발생");
    console.error("🔴 Prisma 에러 내용:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    res.status(500).json({
      message: "페이지 생성 중 서버 오류가 발생했습니다.",
      error: error.message,
      code: error.code,
      meta: error.meta,
    });
  }
});

// 📘 2. 특정 페이지 상세 조회
router.get("/:id", async (req, res) => {
  const pageId = parseInt(req.params.id);

  try {
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        title: true,
        content: true,
        memo: true,
        imageUrl: true,
        order: true,
        chapterId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!page) {
      return res.status(404).json({ error: "페이지를 찾을 수 없습니다." });
    }

    res.json(page);
  } catch (error) {
    console.error("🔴 페이지 상세 조회 실패:", error);
    res.status(500).json({ error: "서버 오류" });
  }
}); 


module.exports = router;
