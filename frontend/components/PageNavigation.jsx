'use client';

/**
 * 페이지 이전/다음 네비게이션 (← →)
 */
export default function PageNavigation({
  pages,
  selectedPageId,
  chapters,
  selectedChapterId,
  onNavigate,
}) {
  if (pages.length === 0) return null;

  const currentIdx = pages.findIndex((p) => p.id.toString() === selectedPageId);
  const chapterIdx = chapters.findIndex(
    (ch) => ch.id.toString() === selectedChapterId
  );
  const globalOffset = chapters
    .slice(0, chapterIdx)
    .reduce((sum, ch) => sum + (ch._count?.pages || 0), 0);
  const globalPageNum = currentIdx >= 0 ? globalOffset + currentIdx + 1 : '-';

  return (
    <div className="page-nav">
      <button
        type="button"
        className="page-nav-btn"
        disabled={currentIdx <= 0}
        onClick={() => {
          if (currentIdx > 0) {
            onNavigate(pages[currentIdx - 1].id.toString());
          }
        }}
      >
        ←
      </button>
      <span className="page-nav-info">
        p.{globalPageNum} ({currentIdx >= 0 ? currentIdx + 1 : '-'}/{pages.length})
      </span>
      <button
        type="button"
        className="page-nav-btn"
        disabled={currentIdx >= pages.length - 1}
        onClick={() => {
          let newId;
          if (currentIdx < 0) {
            newId = pages[0].id.toString();
          } else if (currentIdx < pages.length - 1) {
            newId = pages[currentIdx + 1].id.toString();
          }
          if (newId) {
            onNavigate(newId);
          }
        }}
      >
        →
      </button>
    </div>
  );
}
