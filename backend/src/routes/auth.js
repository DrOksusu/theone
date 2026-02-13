// backend/src/routes/auth.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();
const prisma = new PrismaClient();

// 로그인
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "잘못된 사용자명 또는 비밀번호입니다." });
    }

    // 비밀번호 확인
    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res
        .status(401)
        .json({ message: "잘못된 사용자명 또는 비밀번호입니다." });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // 토큰 유효기간 7일로 연장
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        lastChapterId: user.lastChapterId,
        lastPageId: user.lastPageId,
      },
    });
  } catch (error) {
    console.error("로그인 에러:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 사용자 리스트 가져오기 (간단한 관리용)
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error("사용자 목록 조회 에러:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 마지막 작업 위치 저장
router.put("/last-position", async (req, res) => {
  try {
    const { userId, lastChapterId, lastPageId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId가 필요합니다." });
    }

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        lastChapterId: lastChapterId ? parseInt(lastChapterId) : null,
        lastPageId: lastPageId ? parseInt(lastPageId) : null,
      },
    });

    res.json({ message: "위치 저장 완료" });
  } catch (error) {
    console.error("위치 저장 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
