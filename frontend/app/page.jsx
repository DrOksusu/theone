'use client';

import { useState, useEffect } from 'react';
import PageViewer from '@/components/PageViewer';
import LoginForm from '@/components/LoginForm';

export default function Home() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // localStorage에서 로그인 정보 복원
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return <div className="text-center mt-10">로딩 중...</div>;
  }

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div>
      <div className="user-info">
        <span>👤 {user?.name || user?.username}</span>
        <button onClick={handleLogout} className="logout-btn">로그아웃</button>
      </div>
      <PageViewer token={token} userId={user?.id} lastChapterId={user?.lastChapterId} lastPageId={user?.lastPageId} />
    </div>
  );
}
