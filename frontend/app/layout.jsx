import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import ToastProvider from '@/components/ToastProvider';
import ThemeProvider from '@/components/ThemeProvider';
import NavBar from '@/components/NavBar';

export const metadata = {
  title: 'The One Book',
  description: '더 원 책 만들기 프로젝트',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <ToastProvider>
          <ThemeProvider>
            <div className="App">
              <h1 className="text-xl font-bold text-center mt-4">The One</h1>
              <NavBar />
              <AuthProvider>
                {children}
              </AuthProvider>
            </div>
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
