const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const PDFDocument = require("pdfkit");
const https = require("https");
const http = require("http");
const path = require("path");
const fs = require("fs");

const prisma = new PrismaClient();

// 한글 폰트 경로 (NanumGothic 사용)
const FONT_PATH = path.join(__dirname, "..", "..", "fonts", "NanumGothic.ttf");
const FONT_BOLD_PATH = path.join(__dirname, "..", "..", "fonts", "NanumGothicBold.ttf");

/**
 * URL에서 이미지 버퍼 가져오기
 */
function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchImageBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

/**
 * GET /api/pdf/export
 * 전체 페이지를 챕터 순서 → 페이지 순서대로 PDF 생성 후 다운로드
 */
router.get("/export", async (req, res) => {
  try {
    // 1. 챕터 순서대로 + 페이지 순서대로 조회
    const chapters = await prisma.chapter.findMany({
      orderBy: { order: "asc" },
      include: {
        pages: {
          orderBy: { order: "asc" },
        },
      },
    });

    // 2. PDFKit 문서 생성
    const hasFonts = fs.existsSync(FONT_PATH);
    const hasBoldFont = fs.existsSync(FONT_BOLD_PATH);

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: "The One Book",
        Author: "The One",
      },
    });

    // 3. 응답 헤더 설정
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="TheOneBook.pdf"'
    );

    // PDF를 응답 스트림으로 파이핑
    doc.pipe(res);

    // 한글 폰트 등록
    if (hasFonts) {
      doc.registerFont("Korean", FONT_PATH);
      if (hasBoldFont) {
        doc.registerFont("KoreanBold", FONT_BOLD_PATH);
      }
    }

    let isFirstPage = true;
    let globalPageNumber = 0;

    for (const chapter of chapters) {
      if (chapter.pages.length === 0) continue;

      for (let i = 0; i < chapter.pages.length; i++) {
        const page = chapter.pages[i];
        globalPageNumber++;

        // 새 페이지 추가 (첫 페이지 제외)
        if (!isFirstPage) {
          doc.addPage();
        }
        isFirstPage = false;

        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

        // 챕터 첫 페이지면 챕터 제목 표시
        if (i === 0) {
          if (hasBoldFont) {
            doc.font("KoreanBold");
          } else if (hasFonts) {
            doc.font("Korean");
          }
          doc
            .fontSize(14)
            .fillColor("#3b82f6")
            .text(`${chapter.order}. ${chapter.title}`, { align: "left" });
          doc.moveDown(0.5);
          // 구분선
          doc
            .strokeColor("#3b82f6")
            .lineWidth(1)
            .moveTo(doc.x, doc.y)
            .lineTo(doc.x + pageWidth, doc.y)
            .stroke();
          doc.moveDown(0.5);
        }

        // 페이지 제목
        if (hasBoldFont) {
          doc.font("KoreanBold");
        } else if (hasFonts) {
          doc.font("Korean");
        }
        doc
          .fontSize(18)
          .fillColor("#000000")
          .text(`${globalPageNumber}. ${page.title}`, { align: "center" });
        doc.moveDown(1);

        // 메인 이미지
        if (page.imageUrl) {
          try {
            const imgBuffer = await fetchImageBuffer(page.imageUrl);
            const maxImgWidth = Math.min(pageWidth, 400);
            const maxImgHeight = 300;
            doc.image(imgBuffer, {
              fit: [maxImgWidth, maxImgHeight],
              align: "center",
            });
            doc.moveDown(1);
          } catch (imgErr) {
            console.error(`이미지 로드 실패 (page ${page.id}):`, imgErr.message);
          }
        }

        // 본문
        if (page.content) {
          if (hasFonts) {
            doc.font("Korean");
          }
          doc
            .fontSize(11)
            .fillColor("#333333")
            .text(page.content, {
              align: "left",
              lineGap: 4,
            });
        }
      }
    }

    // PDF 마무리
    doc.end();
  } catch (error) {
    console.error("PDF 생성 오류:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "PDF 생성 중 오류가 발생했습니다." });
    }
  }
});

module.exports = router;
