'use client';

/**
 * TotalViewer 테이블에서 사용하는 드래그 가능한 단어 셀
 */
export default function WordCell({
  page,
  chapterId,
  chapters,
  rowIndex,
  onDragStart,
  onDragEnd,
  onDelete,
  isDragging,
}) {
  // 전역 페이지 번호 계산
  const chapterIdx = chapters.findIndex((ch) => ch.id === chapterId);
  const globalOffset = chapters
    .slice(0, chapterIdx)
    .reduce((sum, ch) => sum + (ch.pages?.length || 0), 0);

  return (
    <div
      className={`word-cell draggable ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, page, chapterId)}
      onDragEnd={onDragEnd}
    >
      <span className="drag-handle">⋮⋮</span>
      <span
        className="word-title-link"
        onClick={(e) => {
          e.stopPropagation();
          window.location.href = `/?chapterId=${chapterId}&pageId=${page.id}`;
        }}
        title="클릭하면 해당 단어 페이지로 이동"
      >
        {globalOffset + rowIndex + 1}. {page.title}
      </span>
      <button
        className="word-delete-btn"
        onClick={() => onDelete(page.id, page.title)}
        title="삭제"
      >
        ✕
      </button>
    </div>
  );
}
