// backend/src/middleware/auth.js
const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "인증 토큰이 필요합니다." });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "유효한 토큰 형식이 아닙니다." });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    console.error("토큰 검증 오류:", error);

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "토큰이 만료되었습니다. 다시 로그인해주세요." });
    }

    return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
  }
};

module.exports = { authenticateJWT };
