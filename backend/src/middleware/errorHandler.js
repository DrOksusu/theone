// backend/src/middleware/errorHandler.js
// 글로벌 에러 핸들러 미들웨어

const errorHandler = (err, req, res, next) => {
  console.error("서버 오류:", err);

  // multer 파일 크기 초과 에러
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "파일 크기가 제한을 초과했습니다." });
  }

  // multer 파일 타입 에러
  if (err.message === "이미지 파일만 업로드 가능합니다.") {
    return res.status(400).json({ message: err.message });
  }

  // 기본 서버 오류 응답
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "서버 오류가 발생했습니다.",
  });
};

module.exports = errorHandler;
