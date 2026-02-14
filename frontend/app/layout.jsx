import './globals.css';
import Link from 'next/link';
import AuthProvider from '@/components/AuthProvider';

export const metadata = {
  title: 'The One Book',
  description: '더 원 책 만들기 프로젝트',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <div className="App">
          <h1 className="text-xl font-bold text-center mt-4">📘 The One</h1>

          <nav className="nav-menu">
            <Link href="/total" className="nav-link">🔍챕터 및 단어 조회</Link>
            <Link href="/" className="nav-link">📝단어 추가 및 수정(삭제)</Link>
          </nav>

          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
