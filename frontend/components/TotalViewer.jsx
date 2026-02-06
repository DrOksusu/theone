'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';

export default function TotalViewer() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedChapter, setExpandedChapter] = useState(null);

  useEffect(() => {
    fetchChaptersWithPages();
  }, []);

  const fetchChaptersWithPages = async () => {
    try {
      const res = await axios.get('/api/chapters');
      const chaptersData = res.data;

      // 각 챕터별로 페이지 가져오기
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

  const toggleChapter = (chapterId) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  if (loading) {
    return <div className="text-center mt-10">로딩 중...</div>;
  }

  return (
    <div className="total-viewer">
      <h2>📘 챕터 및 단어 한눈에 보기</h2>

      <div className="chapters-list">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="chapter-item">
            <div
              className="chapter-header"
              onClick={() => toggleChapter(chapter.id)}
            >
              <span className="chapter-toggle">
                {expandedChapter === chapter.id ? '▼' : '▶'}
              </span>
              <span className="chapter-title">
                {chapter.order}. {chapter.title}
              </span>
              <span className="chapter-count">
                ({chapter.pages?.length || 0}개 단어)
              </span>
            </div>

            {expandedChapter === chapter.id && (
              <div className="pages-list">
                {chapter.pages?.length > 0 ? (
                  chapter.pages.map((page) => (
                    <div key={page.id} className="page-item">
                      <div className="page-title">📄 {page.title}</div>
                      {page.content && (
                        <div className="page-content">{page.content}</div>
                      )}
                      {page.memo && (
                        <div className="page-memo">💡 {page.memo}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-pages">등록된 단어가 없습니다.</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
