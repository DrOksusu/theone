'use client';

import PageViewer from '@/components/PageViewer';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const { token, user } = useAuth();

  return (
    <PageViewer
      token={token}
      userId={user?.id}
      lastChapterId={user?.lastChapterId}
      lastPageId={user?.lastPageId}
    />
  );
}
