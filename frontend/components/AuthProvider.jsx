'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '@/lib/axios';
import LoginForm from '@/components/LoginForm';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, confirmed: 0 });

  const fetchStats = useCallback(() => {
    axios.get('/api/pages/stats').then((res) => {
      setStats(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);

        // 서버에서 최신 사용자 정보 가져오기 (lastChapterId/lastPageId 갱신)
        axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` },
        }).then((res) => {
          const freshUser = res.data;
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        }).catch(() => {
          // 토큰 만료 등 → 로그아웃 처리
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }).finally(() => {
          setLoading(false);
        });
        return;
      } catch {}
    }
    setLoading(false);
  }, []);

  // 로그인 후 stats 가져오기 + 주기적 갱신
  useEffect(() => {
    if (!token) return;
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [token, fetchStats]);

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
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const percent = stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0;

  return (
    <AuthContext.Provider value={{ token, user, logout: handleLogout, refreshStats: fetchStats }}>
      <div className="user-info">
        <div className="progress-section">
          <span className="progress-label">{stats.confirmed}/{stats.total} ({percent}%)</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <span>{user?.name || user?.username}</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
      {children}
    </AuthContext.Provider>
  );
}
