'use client';

import { useEffect, useState, useRef } from 'react';
import axios from '@/lib/axios';
import { useToast } from '@/components/ToastProvider';
import WordCell from '@/components/WordCell';

export default function TotalViewer({ token, userId }) {
  const toast = useToast();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [addingChapterId, setAddingChapterId] = useState(null);
  const [addingTitle, setAddingTitle] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const addInputRef = useRef(null);

  useEffect(() => {
    fetchChaptersWithPages();
  }, []);

  const fetchChaptersWithPages = async () => {
    try {
      const res = await axios.get('/api/chapters');
      const chaptersData = res.data;

      const chaptersWithPages = await Promise.all(
        chaptersData.map(async (chapter) => {
          try {
            const pagesRes = await axios.get(`/api/chapters/${chapter.id}/pages`);
            return { ...chapter, pages: pagesRes.data };
          } catch {
            return { ...chapter, pages: [] };
          }
        })
      );

      setChapters(chaptersWithPages);
    } catch (error) {
      console.error('데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pageId, pageTitle) => {
    const confirmDelete = window.confirm(
      `"${pageTitle}" 단어를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/pages/${pageId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      toast.success('단어가 삭제되었습니다.');
      fetchChaptersWithPages();
    } catch (error) {
      console.error('삭제 실패:', error);
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDragStart = (e, page, chapterId) => {
    setDraggedItem({ page, chapterId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetPage, targetChapterId, targetIndex) => {
    e.preventDefault();
    if (!draggedItem) return;
    setDragOverItem({ chapterId: targetChapterId, index: targetIndex });
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e, targetChapterId, targetIndex) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { page: sourcePage, chapterId: sourceChapterId } = draggedItem;

    // 같은 위치면 무시
    if (sourceChapterId === targetChapterId) {
      const chapter = chapters.find((ch) => ch.id === sourceChapterId);
      const sourceIndex = chapter.pages.findIndex((p) => p.id === sourcePage.id);
      if (sourceIndex === targetIndex) {
        setDraggedItem(null);
        setDragOverItem(null);
        return;
      }
    }

    try {
      // 로컬 상태 먼저 업데이트 (빠른 UI 반응)
      const newChapters = chapters.map((ch) => {
        if (ch.id === sourceChapterId) {
          return {
            ...ch,
            pages: ch.pages.filter((p) => p.id !== sourcePage.id),
          };
        }
        return ch;
      });

      const updatedChapters = newChapters.map((ch) => {
        if (ch.id === targetChapterId) {
          const newPages = [...ch.pages];
          newPages.splice(targetIndex, 0, { ...sourcePage, chapterId: targetChapterId });
          return { ...ch, pages: newPages };
        }
        return ch;
      });

      setChapters(updatedChapters);

      // 서버에 순서 업데이트
      const targetChapter = updatedChapters.find((ch) => ch.id === targetChapterId);
      await axios.put(`/api/pages/${sourcePage.id}/reorder`, {
        chapterId: targetChapterId,
        newOrder: targetIndex + 1,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // 해당 챕터의 모든 페이지 순서 업데이트
      for (let i = 0; i < targetChapter.pages.length; i++) {
        const page = targetChapter.pages[i];
        if (page.id !== sourcePage.id) {
          await axios.put(`/api/pages/${page.id}/reorder`, {
            chapterId: targetChapterId,
            newOrder: i + 1,
          }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        }
      }

    } catch (error) {
      console.error('순서 변경 실패:', error);
      toast.error('순서 변경 중 오류가 발생했습니다.');
      fetchChaptersWithPages();
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const startAdding = (chapterId) => {
    setAddingChapterId(chapterId);
    setAddingTitle('');
    setTimeout(() => addInputRef.current?.focus(), 0);
  };

  const cancelAdding = () => {
    setAddingChapterId(null);
    setAddingTitle('');
  };

  const submitAddWord = async (chapterId) => {
    if (!addingTitle.trim()) {
      cancelAdding();
      return;
    }

    try {
      const chapter = chapters.find((ch) => ch.id === chapterId);
      const newOrder = chapter.pages?.length
        ? Math.max(...chapter.pages.map((p) => p.order)) + 1
        : 1;

      await axios.post('/api/pages', {
        title: addingTitle.trim(),
        content: '',
        memo: '',
        chapterId,
        userId: parseInt(userId),
        order: newOrder,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setAddingTitle('');
      fetchChaptersWithPages();
    } catch (error) {
      console.error('단어 추가 실패:', error);
      toast.error('단어 추가 중 오류가 발생했습니다.');
    }
    cancelAdding();
  };

  const handleAddKeyDown = (e, chapterId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitAddWord(chapterId);
    } else if (e.key === 'Escape') {
      cancelAdding();
    }
  };

  const handlePdfDownload = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch('/api/pdf/export');
      if (!res.ok) throw new Error('PDF 생성 실패');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'TheOneBook.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF 다운로드 오류:', error);
      toast.error('PDF 다운로드 중 오류가 발생했습니다.');
    } finally {
      setPdfLoading(false);
    }
  };

  // 전체 단어 수 계산
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.pages?.length || 0), 0);

  // 가장 많은 단어를 가진 챕터의 단어 수 (행 개수 결정)
  const maxWords = Math.max(...chapters.map((ch) => ch.pages?.length || 0), 0);

  if (loading) {
    return <div className="text-center mt-10">로딩 중...</div>;
  }

  return (
    <div className="total-viewer">
      <h2>📘 챕터 및 단어 한눈에 보기</h2>
      <div className="total-header-row">
        <p className="total-summary">총 {chapters.length}개 챕터, {totalWords}개 단어</p>
        <button
          className="pdf-download-btn"
          onClick={handlePdfDownload}
          disabled={pdfLoading}
        >
          {pdfLoading ? 'PDF 생성 중...' : 'PDF 다운로드'}
        </button>
      </div>

      <div className="table-container">
        <table className="pages-table pivot-table">
          <thead>
            <tr>
              <th className="col-no">No.</th>
              {chapters.map((chapter) => (
                <th key={chapter.id} className="col-chapter-header">
                  {chapter.order}. {chapter.title}
                  <span className="chapter-word-count">({chapter.pages?.length || 0})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxWords + 1 }, (_, rowIndex) => (
              <tr key={rowIndex}>
                <td className="col-no">{rowIndex + 1}</td>
                {chapters.map((chapter) => {
                  const page = chapter.pages?.[rowIndex];
                  const isDragOver = dragOverItem?.chapterId === chapter.id && dragOverItem?.index === rowIndex;
                  return (
                    <td
                      key={chapter.id}
                      className={`col-word ${isDragOver ? 'drag-over' : ''}`}
                      onDragOver={(e) => handleDragOver(e, page, chapter.id, rowIndex)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, chapter.id, rowIndex)}
                    >
                      {page ? (
                        <WordCell
                          page={page}
                          chapterId={chapter.id}
                          chapters={chapters}
                          rowIndex={rowIndex}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onDelete={handleDelete}
                          isDragging={draggedItem?.page.id === page.id}
                        />
                      ) : rowIndex === (chapter.pages?.length || 0) ? (
                        addingChapterId === chapter.id ? (
                          <input
                            ref={addInputRef}
                            className="word-add-input"
                            type="text"
                            value={addingTitle}
                            onChange={(e) => setAddingTitle(e.target.value)}
                            onKeyDown={(e) => handleAddKeyDown(e, chapter.id)}
                            onBlur={() => submitAddWord(chapter.id)}
                            placeholder="단어 입력"
                          />
                        ) : (
                          <button
                            className="word-add-btn"
                            onClick={() => startAdding(chapter.id)}
                            title="단어 추가"
                          >
                            +
                          </button>
                        )
                      ) : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
