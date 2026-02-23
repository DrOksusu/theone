'use client';

import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import { useTheme } from '@/components/ThemeProvider';

// 네비게이션 바 (검색, 테마 토글 포함)
export default function NavBar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="nav-menu">
      <Link href="/total" className="nav-link">챕터 및 단어 조회</Link>
      <Link href="/" className="nav-link">단어 추가 및 수정(삭제)</Link>
      <Link href="/stats" className="nav-link">통계</Link>
      <SearchBar />
      <button
        className="theme-toggle-btn"
        onClick={toggleTheme}
        title={theme === 'light' ? '다크모드로 전환' : '라이트모드로 전환'}
      >
        {theme === 'light' ? '\uD83C\uDF19' : '\u2600\uFE0F'}
      </button>
    </nav>
  );
}
