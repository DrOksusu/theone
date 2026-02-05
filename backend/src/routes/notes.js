// backend/src/routes/notes.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateJWT } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// 인증 미들웨어 적용
router.use(authenticateJWT);

// 사용자의 모든 노트 가져오기
router.get("/", async (req, res) => {
  try {
    const userId = req.user.userId;

    const notes = await prisma.note.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: "desc" },
    });

    res.json(notes);
  } catch (error) {
    console.error("노트 목록 조회 에러:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 노트 상세 정보 가져오기
router.get("/:id", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.user.userId;

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: parseInt(userId),
      },
    });

    if (!note) {
      return res.status(404).json({ message: "노트를 찾을 수 없습니다." });
    }

    res.json(note);
  } catch (error) {
    console.error("노트 상세 조회 에러:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 새 노트 생성
router.post("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { content } = req.body;

    const note = await prisma.note.create({
      data: {
        content,
        userId: parseInt(userId),
      },
    });

    res.status(201).json(note);
  } catch (error) {
    console.error("노트 생성 에러:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 노트 수정
router.put("/:id", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { content } = req.body;

    // 노트가 해당 사용자의 것인지 확인
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: parseInt(userId),
      },
    });

    if (!existingNote) {
      return res.status(404).json({ message: "노트를 찾을 수 없습니다." });
    }

    // 노트 정보 업데이트
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: { content },
    });

    res.json(updatedNote);
  } catch (error) {
    console.error("노트 수정 에러:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 노트 삭제
router.delete("/:id", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.user.userId;

    // 노트가 해당 사용자의 것인지 확인
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: parseInt(userId),
      },
    });

    if (!note) {
      return res.status(404).json({ message: "노트를 찾을 수 없습니다." });
    }

    // 노트 삭제
    await prisma.note.delete({
      where: { id: noteId },
    });

    res.json({ message: "노트가 삭제되었습니다." });
  } catch (error) {
    console.error("노트 삭제 에러:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
