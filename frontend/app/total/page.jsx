'use client';

import { useEffect, useState } from 'react';
import TotalViewer from '@/components/TotalViewer';

export default function TotalPage() {
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserId(user.id);
      } catch {}
    }
  }, []);

  return <TotalViewer token={token} userId={userId} />;
}
