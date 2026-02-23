'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

// 토스트 알림 훅
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast는 ToastProvider 안에서만 사용 가능합니다.');
  }
  return context;
}

// 토스트 알림 프로바이더
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) =>
      t.id === id ? { ...t, removing: true } : t
    ));
    // 애니메이션 후 실제 제거
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type, removing: false }]);
    // 3초 후 자동 사라짐
    setTimeout(() => removeToast(id), 3000);
    return id;
  }, [removeToast]);

  const toast = {
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    info: (message) => addToast(message, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* 토스트 컨테이너 - 우상단 고정 */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type} ${t.removing ? 'toast-exit' : 'toast-enter'}`}
            onClick={() => removeToast(t.id)}
          >
            <span className="toast-icon">
              {t.type === 'success' && '\u2713'}
              {t.type === 'error' && '\u2717'}
              {t.type === 'info' && '\u2139'}
            </span>
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
