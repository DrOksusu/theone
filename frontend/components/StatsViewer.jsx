'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';

// 통계 대시보드 컴포넌트
export default function StatsViewer({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/pages/stats/detail', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setStats(res.data);
      } catch (error) {
        console.error('통계 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) {
    return <div className="stats-viewer"><p className="stats-loading">통계 로딩 중...</p></div>;
  }

  if (!stats) {
    return <div className="stats-viewer"><p className="stats-error">통계를 불러올 수 없습니다.</p></div>;
  }

  const overallPercent = stats.total > 0
    ? Math.round((stats.confirmed / stats.total) * 100)
    : 0;

  return (
    <div className="stats-viewer">
      <h2>통계 대시보드</h2>

      {/* 전체 완성도 */}
      <div className="stats-section">
        <h3>전체 완성도</h3>
        <div className="stats-overall">
          <div className="stats-overall-bar">
            <div
              className="stats-overall-fill"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <span className="stats-overall-text">
            {stats.confirmed} / {stats.total} ({overallPercent}%)
          </span>
        </div>
      </div>

      {/* 챕터별 완성도 */}
      <div className="stats-section">
        <h3>챕터별 완성도</h3>
        <div className="stats-chapters">
          {stats.chapters?.map((ch) => {
            const chPercent = ch.total > 0
              ? Math.round((ch.confirmed / ch.total) * 100)
              : 0;
            return (
              <div key={ch.id} className="stats-chapter-row">
                <span className="stats-chapter-name">{ch.title}</span>
                <div className="stats-chapter-bar-wrapper">
                  <div className="stats-chapter-bar">
                    <div
                      className="stats-chapter-fill"
                      style={{ width: `${chPercent}%` }}
                    />
                  </div>
                  <span className="stats-chapter-text">
                    {ch.confirmed}/{ch.total} ({chPercent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 최근 수정 */}
      {stats.recentUpdates && stats.recentUpdates.length > 0 && (
        <div className="stats-section">
          <h3>최근 수정</h3>
          <div className="stats-recent">
            {stats.recentUpdates.map((item, i) => (
              <div key={i} className="stats-recent-item">
                <span className="stats-recent-title">{item.title}</span>
                <span className="stats-recent-chapter">{item.chapterTitle}</span>
                <span className="stats-recent-user">{item.updatedBy}</span>
                <span className="stats-recent-date">
                  {new Date(item.updatedAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
