'use client';

import { useSearchParams } from 'next/navigation';
import PageViewer from '@/components/PageViewer';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const { token, user } = useAuth();
  const searchParams = useSearchParams();

  // URL 쿼리 파라미터 우선, 없으면 마지막 위치 사용
  const chapterId = searchParams.get('chapterId') || user?.lastChapterId;
  const pageId = searchParams.get('pageId') || user?.lastPageId;

  return (
    <PageViewer
      token={token}
      userId={user?.id}
      lastChapterId={chapterId}
      lastPageId={pageId}
    />
  );
}
