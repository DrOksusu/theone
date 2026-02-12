'use client';

import { useEffect, useState } from 'react';
import TotalViewer from '@/components/TotalViewer';

export default function TotalPage() {
  const [token, setToken] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  return <TotalViewer token={token} />;
}
