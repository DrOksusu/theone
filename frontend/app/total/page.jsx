'use client';

import TotalViewer from '@/components/TotalViewer';
import { useAuth } from '@/components/AuthProvider';

export default function TotalPage() {
  const { token, user } = useAuth();

  return <TotalViewer token={token} userId={user?.id} />;
}
