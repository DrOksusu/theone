'use client';

import StatsViewer from '@/components/StatsViewer';
import { useAuth } from '@/components/AuthProvider';

export default function StatsPage() {
  const { token } = useAuth();
  return <StatsViewer token={token} />;
}
