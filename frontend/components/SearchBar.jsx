'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import axios from '@/lib/axios';

// 검색 바 컴포넌트
export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  // 디바운스 검색 (300ms)
  const handleSearch = useCallback((value) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!value.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/pages/search?q=${encodeURIComponent(value.trim())}`);
        setResults(res.data);
        setIsOpen(true);
      } catch (error) {
        console.error('검색 오류:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  // ESC키로 닫기
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 결과 클릭 시 이동
  const handleResultClick = (item) => {
    setIsOpen(false);
    setQuery('');
    window.location.href = `/?chapterId=${item.chapterId}&pageId=${item.id}`;
  };

  // 내용 미리보기 (최대 80자)
  const getPreview = (text) => {
    if (!text) return '';
    return text.length > 80 ? text.substring(0, 80) + '...' : text;
  };

  return (
    <div className="search-bar-container" ref={containerRef}>
      <input
        type="text"
        className="search-input"
        placeholder="단어/내용 검색..."
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      {isOpen && (
        <div className="search-dropdown">
          {loading ? (
            <div className="search-loading">검색 중...</div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <div
                key={item.id}
                className="search-result-item"
                onClick={() => handleResultClick(item)}
              >
                <div className="search-result-title">{item.title}</div>
                <div className="search-result-chapter">{item.chapterTitle}</div>
                {item.content && (
                  <div className="search-result-preview">{getPreview(item.content)}</div>
                )}
              </div>
            ))
          ) : (
            <div className="search-no-result">검색 결과가 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}
