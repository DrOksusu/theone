'use client';

import { useState } from 'react';
import axios from '@/lib/axios';

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', { username, password });
      const { token, user } = res.data;

      // localStorage에 저장
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      onLogin(token, user);
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>🔐 로그인</h2>

        {error && <p className="error-message">{error}</p>}

        <input
          type="text"
          placeholder="사용자명"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>

        <p className="hint">
          기본 계정: oksusu / theone
        </p>
      </form>
    </div>
  );
}
