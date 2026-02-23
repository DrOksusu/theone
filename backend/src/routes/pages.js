const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { authenticateJWT } = require("../middleware/auth");

// 전체 페이지 목록 조회 + 전역 페이지 번호 포함
router.get("/", async (req, res) => {
  try {
    const chapters = await prisma.chapter.findMany({
      orderBy: { order: "asc" },
      include: {
        pages: {
          orderBy: { order: "asc" },
        },
      },
    });

    let totalCount = 0;
    const pagesWithGlobalPageNumbers = [];

    for (const chapter of chapters) {
      for (const page of chapter.pages) {
        totalCount++;
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

// 공정률 통계 API
router.get("/stats", async (req, res) => {
  try {
    const total = await prisma.page.count();
    const confirmed = await prisma.page.count({ where: { confirmed: true } });
    res.json({ total, confirmed });
  } catch (error) {
    console.error("통계 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 특정 페이지 상세 조회
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
        subImageUrl: true,
        order: true,
        chapterId: true,
        userId: true,
        updatedBy: true,
        confirmed: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { name: true } },
        updatedByUser: { select: { name: true } },
      },
    });

    if (!page) {
      return res.status(404).json({ error: "페이지를 찾을 수 없습니다." });
    }

    res.json(page);
  } catch (error) {
    console.error("페이지 상세 조회 실패:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 페이지 수정 (인증 필요)
router.put("/:id", authenticateJWT, async (req, res) => {
  const pageId = parseInt(req.params.id);
  const { title, content, memo, imageUrl, subImageUrl, chapterId, userId, order } = req.body;

  const parsedOrder = parseInt(order);
  const parsedChapterId = parseInt(chapterId);
  const parsedUserId = parseInt(userId);

  // 유효성 검사
  const errors = [];
  if (!title) errors.push("title 없음");
  if (!content) errors.push("content 없음");
  if (isNaN(parsedOrder)) errors.push("order 파싱 실패");
  if (isNaN(parsedChapterId)) errors.push("chapterId 파싱 실패");
  if (isNaN(parsedUserId)) errors.push("userId 파싱 실패");

  if (errors.length > 0) {
    return res.status(400).json({
      message: "입력값이 유효하지 않습니다.",
      details: errors,
      rawInput: { title, content, memo, imageUrl, chapterId, userId, order },
    });
  }

  try {
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        title,
        content,
        memo,
        imageUrl,
        subImageUrl,
        order: parsedOrder,
        chapter: { connect: { id: parsedChapterId } },
        user: { connect: { id: parsedUserId } },
        updatedBy: parsedUserId,
      },
    });

    res.json(updatedPage);
  } catch (error) {
    console.error("페이지 수정 실패:", error);
    res.status(500).json({
      message: "페이지 수정 중 오류가 발생했습니다.",
      error: error.message,
      code: error.code,
      meta: error.meta,
    });
  }
});

// 페이지 생성 (인증 필요)
router.post("/", authenticateJWT, async (req, res) => {
  const { title, imageUrl, subImageUrl, content, memo, chapterId, userId, order } = req.body;

  try {
    const parsedOrder = parseInt(order);
    const parsedChapterId = parseInt(chapterId);
    const parsedUserId = parseInt(userId);

    // 필수값 체크
    if (!title || isNaN(parsedOrder) || isNaN(parsedChapterId) || isNaN(parsedUserId)) {
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

    // 중복 확인: 같은 챕터에서 같은 제목의 페이지가 있는지 확인
    const existing = await prisma.page.findFirst({
      where: {
        chapterId: parsedChapterId,
        title: title,
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "같은 단어가 이미 있습니다, 페이지조회를 눌러서 수정하세요",
        duplicate: true,
        existingPageId: existing.id,
      });
    }

    // 중복이 아니면 새로 생성
    const newPage = await prisma.page.create({
      data: {
        title,
        imageUrl,
        subImageUrl,
        content,
        memo,
        chapterId: parsedChapterId,
        userId: parsedUserId,
        order: parsedOrder,
      },
    });

    res.status(201).json(newPage);
  } catch (error) {
    console.error("페이지 생성 오류:", error);
    res.status(500).json({
      message: "페이지 생성 중 서버 오류가 발생했습니다.",
      error: error.message,
      code: error.code,
      meta: error.meta,
    });
  }
});

// 페이지 순서 변경 (인증 필요)
router.put("/:id/reorder", authenticateJWT, async (req, res) => {
  const pageId = parseInt(req.params.id);
  const { chapterId, newOrder } = req.body;

  try {
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        chapterId: parseInt(chapterId),
        order: parseInt(newOrder),
      },
    });

    res.json(updatedPage);
  } catch (error) {
    console.error("페이지 순서 변경 실패:", error);
    res.status(500).json({ error: "페이지 순서 변경 중 오류가 발생했습니다." });
  }
});

// 확정 토글 (인증 필요)
router.put("/:id/confirm", authenticateJWT, async (req, res) => {
  const pageId = parseInt(req.params.id);

  try {
    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) {
      return res.status(404).json({ error: "페이지를 찾을 수 없습니다." });
    }

    const updated = await prisma.page.update({
      where: { id: pageId },
      data: { confirmed: !page.confirmed },
    });

    res.json({ confirmed: updated.confirmed });
  } catch (error) {
    console.error("확정 토글 오류:", error);
    res.status(500).json({ error: "확정 상태 변경 중 오류가 발생했습니다." });
  }
});

// 페이지 삭제 (인증 필요)
router.delete("/:id", authenticateJWT, async (req, res) => {
  const pageId = parseInt(req.params.id);

  try {
    const page = await prisma.page.findUnique({
      where: { id: pageId },
    });

    if (!page) {
      return res.status(404).json({ error: "페이지를 찾을 수 없습니다." });
    }

    await prisma.page.delete({
      where: { id: pageId },
    });

    res.json({ message: "페이지가 삭제되었습니다.", deletedId: pageId });
  } catch (error) {
    console.error("페이지 삭제 실패:", error);
    res.status(500).json({ error: "페이지 삭제 중 오류가 발생했습니다." });
  }
});

module.exports = router;
