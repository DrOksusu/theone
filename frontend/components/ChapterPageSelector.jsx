'use client';

/**
 * 챕터/페이지(단어) 선택 드롭다운 UI
 */
export default function ChapterPageSelector({
  chapters,
  pages,
  selectedChapterId,
  selectedPageId,
  onChapterChange,
  onPageChange,
}) {
  return (
    <div className="form-row">
      <select value={selectedChapterId} onChange={(e) => onChapterChange(e.target.value)}>
        <option value="">챕터 선택</option>
        {chapters.map((ch) => (
          <option key={ch.id} value={ch.id}>
            {ch.order}. {ch.title}
          </option>
        ))}
      </select>

      <select value={selectedPageId} onChange={(e) => onPageChange(e.target.value)}>
        <option value="">단어 선택</option>
        {pages.map((page, idx) => {
          const chapterIdx = chapters.findIndex(
            (ch) => ch.id.toString() === selectedChapterId
          );
          const globalOffset = chapters
            .slice(0, chapterIdx)
            .reduce((sum, ch) => sum + (ch._count?.pages || 0), 0);
          return (
            <option key={page.id} value={page.id}>
              {globalOffset + idx + 1}. {page.title}
            </option>
          );
        })}
        <option value="add_new">➕ 단어 추가</option>
      </select>
    </div>
  );
}
