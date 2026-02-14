const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 📘 모든 챕터 조회 (order 순으로)
 * GET /api/chapters
 */
router.get("/", async (req, res) => {
  try {
    const chapters = await prisma.chapter.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { pages: true } } },
    });
    res.json(chapters);
  } catch (err) {
    res.status(500).json({ error: "서버 오류 (챕터 목록 조회 실패)" });
  }
});

/**
 * 📘 특정 챕터 조회
 * GET /api/chapters/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!chapter) return res.status(404).json({ error: "챕터를 찾을 수 없습니다." });
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ error: "서버 오류 (챕터 조회 실패)" });
  }
});

/**
 * ➕ 챕터 생성
 * POST /api/chapters
 * { "title": "제목", "order": 1 }
 */
router.post("/", async (req, res) => {
  try {
    const { title, order } = req.body;
    const newChapter = await prisma.chapter.create({
      data: {
        title,
        order: parseInt(order),
      },
    });
    res.status(201).json(newChapter);
  } catch (err) {
    res.status(500).json({ error: "서버 오류 (챕터 생성 실패)" });
  }
});

/**
 * ✏️ 챕터 수정
 * PUT /api/chapters/:id
 * { "title": "수정된 제목", "order": 2 }
 */
router.put("/:id", async (req, res) => {
  try {
    const { title, order } = req.body;
    const updated = await prisma.chapter.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title,
        order: parseInt(order),
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "서버 오류 (챕터 수정 실패)" });
  }
});

/**
 * ❌ 챕터 삭제
 * DELETE /api/chapters/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    await prisma.chapter.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.sendStatus(204); // 성공적으로 삭제됨
  } catch (err) {
    res.status(500).json({ error: "서버 오류 (챕터 삭제 실패)" });
  }
});

// 📘 1. 특정 챕터의 페이지 리스트 조회
router.get("/:id/pages", async (req, res) => {
  const chapterId = parseInt(req.params.id);

  try {
    const pages = await prisma.page.findMany({
      where: { chapterId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        order: true,
      },
    });

    res.json(pages);
  } catch (error) {
    console.error("🔴 페이지 목록 조회 실패:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});


module.exports = router;
