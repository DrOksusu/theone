'use client';

import { useEffect, useState, useRef } from 'react';
import axios from '@/lib/axios';
import { useAuth } from '@/components/AuthProvider';
import ImageDropzone from '@/components/ImageDropzone';
import ChapterPageSelector from '@/components/ChapterPageSelector';
import PageNavigation from '@/components/PageNavigation';

export default function PageViewer({ token, userId, lastChapterId, lastPageId }) {
  const { refreshStats } = useAuth();
  const [chapters, setChapters] = useState([]);
  const [pages, setPages] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedPageId, setSelectedPageId] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    memo: '',
    chapterId: '',
    image: null,
    imageUrl: '',
    subImage: null,
    subImageUrl: '',
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [subPreviewUrl, setSubPreviewUrl] = useState('');
  const [pageInfo, setPageInfo] = useState(null);

  // 챕터 목록 로드
  useEffect(() => {
    axios.get('/api/chapters').then((res) => {
      if (Array.isArray(res.data)) {
        setChapters(res.data);
        if (!initialized && lastChapterId) {
          setSelectedChapterId(lastChapterId.toString());
          setForm((prev) => ({ ...prev, chapterId: lastChapterId.toString() }));
        }
      } else {
        console.error('chapters 응답이 배열이 아님:', res.data);
        setChapters([]);
      }
    });
  }, []);

  // 선택된 챕터의 페이지 목록 로드
  useEffect(() => {
    if (selectedChapterId) {
      axios
        .get(`/api/chapters/${selectedChapterId}/pages`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setPages(res.data);
          if (!initialized && lastPageId) {
            const exists = res.data.some((p) => p.id.toString() === lastPageId.toString());
            if (exists) {
              setSelectedPageId(lastPageId.toString());
            }
            setInitialized(true);
          }
        });
    } else {
      setPages([]);
      setSelectedPageId('');
      resetForm();
    }
  }, [selectedChapterId, token]);

  // 선택된 페이지 상세 로드
  useEffect(() => {
    if (!selectedPageId) {
      resetForm();
      return;
    }
    if (selectedPageId.startsWith('_new_')) return;

    console.log('페이지 조회 요청:', selectedPageId);

    axios
      .get(`/api/pages/${selectedPageId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        console.log('페이지 조회 성공:', res.data);
        const page = res.data;
        setForm({
          title: page.title,
          content: page.content || '',
          memo: page.memo || '',
          chapterId: selectedChapterId,
          image: null,
          imageUrl: page.imageUrl || '',
          subImage: null,
          subImageUrl: page.subImageUrl || '',
        });
        setConfirmed(page.confirmed || false);
        setPreviewUrl(page.imageUrl || '');
        setSubPreviewUrl(page.subImageUrl || '');
        setPageInfo({
          createdBy: page.user?.name || '',
          updatedByName: page.updatedByUser?.name || '',
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        });
      })
      .catch((err) => {
        console.error('페이지 조회 실패:', err);
        alert('페이지 조회 중 오류가 발생했습니다.');
      });
  }, [selectedPageId, selectedChapterId, token]);

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      memo: '',
      chapterId: selectedChapterId,
      image: null,
      imageUrl: '',
      subImage: null,
      subImageUrl: '',
    });
    setPreviewUrl('');
    setSubPreviewUrl('');
    setPageInfo(null);
    setConfirmed(false);
  };

  const saveLastPosition = (chapterId, pageId) => {
    if (!userId) return;
    axios.put('/api/auth/last-position', {
      userId,
      lastChapterId: chapterId || null,
      lastPageId: pageId || null,
    }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // 챕터 변경 핸들러
  const handleChapterChange = (value) => {
    setSelectedChapterId(value);
    setForm((prev) => ({ ...prev, chapterId: value }));
    saveLastPosition(value, '');
  };

  // 페이지(단어) 변경 핸들러
  const handlePageChange = (value) => {
    if (value === 'add_new') {
      const newTitle = prompt('새로운 단어(타이틀)를 입력해주세요:');
      if (!newTitle || newTitle.trim() === '') {
        alert('단어 제목을 입력해주세요!');
        return;
      }
      const trimmedTitle = newTitle.trim();
      const newId = `_new_${Date.now()}`;
      setPages((prev) => [
        ...prev,
        { id: newId, title: trimmedTitle, order: 0 },
      ]);
      setForm({
        title: trimmedTitle,
        content: '',
        memo: '',
        chapterId: selectedChapterId,
        image: null,
        imageUrl: '',
        subImage: null,
        subImageUrl: '',
      });
      setPreviewUrl('');
      setSubPreviewUrl('');
      setSelectedPageId(newId);
    } else {
      console.log('단어 선택됨:', value);
      setSelectedPageId(value);
      saveLastPosition(selectedChapterId, value);
    }
  };

  // 네비게이션 핸들러
  const handleNavigate = (newId) => {
    setSelectedPageId(newId);
    saveLastPosition(selectedChapterId, newId);
  };

  // 메인 이미지 파일 선택 핸들러
  const handleMainFileChange = (file) => {
    setForm((prev) => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  // 메인 이미지 제거 핸들러
  const handleMainFileRemove = () => {
    setForm((prev) => ({ ...prev, image: null, imageUrl: '' }));
    setPreviewUrl('');
  };

  // 보조 이미지 파일 선택 핸들러
  const handleSubFileChange = (file) => {
    setForm((prev) => ({ ...prev, subImage: file }));
    const reader = new FileReader();
    reader.onloadend = () => setSubPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  // 보조 이미지 제거 핸들러
  const handleSubFileRemove = () => {
    setForm((prev) => ({ ...prev, subImage: null, subImageUrl: '' }));
    setSubPreviewUrl('');
  };

  // 페이지 저장 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.chapterId) {
      alert('필수 항목을 입력해주세요!');
      return;
    }

    try {
      let imageUrl = form.imageUrl;
      if (form.image) {
        const imageForm = new FormData();
        imageForm.append('file', form.image);
        const imageRes = await axios.post('/api/upload', imageForm, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        imageUrl = imageRes.data.url;
      }

      let subImageUrl = form.subImageUrl;
      if (form.subImage) {
        const subImageForm = new FormData();
        subImageForm.append('file', form.subImage);
        const subImageRes = await axios.post('/api/upload', subImageForm, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        subImageUrl = subImageRes.data.url;
      }

      const pageList = await axios.get('/api/pages', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newOrder = pages.length
        ? Math.max(...pages.map((p) => p.order)) + 1
        : 1;

      const payload = {
        title: form.title,
        content: form.content || '',
        memo: form.memo || '',
        imageUrl,
        subImageUrl,
        chapterId: parseInt(form.chapterId),
        userId: parseInt(userId),
        order: newOrder,
      };

      const existingPage = pageList.data.find(
        (p) => p.chapterId === payload.chapterId && p.title === payload.title
      );

      if (existingPage) {
        if (existingPage.id.toString() === selectedPageId) {
          await axios.put(`/api/pages/${existingPage.id}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          alert('기존 페이지를 성공적으로 수정했습니다!');

          const pagesRes = await axios.get(`/api/chapters/${selectedChapterId}/pages`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPages(pagesRes.data);
        } else {
          alert('같은 단어가 이미 있습니다, 페이지조회를 눌러서 수정하세요');
          return;
        }
      } else {
        console.log('새 페이지 생성 요청...');
        const newPageRes = await axios.post('/api/pages', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('새 페이지 생성 완료:', newPageRes.data);
        alert('새 페이지를 성공적으로 생성했습니다!');

        console.log('페이지 목록 갱신 중...');
        const pagesRes = await axios.get(`/api/chapters/${selectedChapterId}/pages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('갱신된 페이지 목록:', pagesRes.data);
        setPages(pagesRes.data);
        setSelectedPageId(newPageRes.data.id.toString());
        console.log('목록 갱신 완료');
      }
    } catch (error) {
      console.error('저장 중 오류:', error);
      alert('저장 중 문제가 발생했습니다!');
    }
  };

  // 확정 토글 핸들러
  const handleConfirmToggle = async () => {
    try {
      const res = await axios.put(`/api/pages/${selectedPageId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfirmed(res.data.confirmed);
      if (refreshStats) refreshStats();
    } catch (error) {
      console.error('확정 토글 실패:', error);
      alert('확정 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 페이지 삭제 핸들러
  const handleDelete = async () => {
    if (!selectedPageId || selectedPageId.startsWith('_new_')) return;

    const confirmDelete = window.confirm(
      `"${form.title}" 단어를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/pages/${selectedPageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('단어가 삭제되었습니다.');

      const pagesRes = await axios.get(`/api/chapters/${selectedChapterId}/pages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPages(pagesRes.data);
      setSelectedPageId('');
      resetForm();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-form">
      <h2>📖 단어 조회 & 수정 & 추가 & 삭제</h2>

      <ChapterPageSelector
        chapters={chapters}
        pages={pages}
        selectedChapterId={selectedChapterId}
        selectedPageId={selectedPageId}
        onChapterChange={handleChapterChange}
        onPageChange={handlePageChange}
      />

      <PageNavigation
        pages={pages}
        selectedPageId={selectedPageId}
        chapters={chapters}
        selectedChapterId={selectedChapterId}
        onNavigate={handleNavigate}
      />

      <ImageDropzone
        previewUrl={previewUrl}
        onFileChange={handleMainFileChange}
        onRemove={handleMainFileRemove}
        label="메인 이미지"
        maxSize={20}
      />

      <ImageDropzone
        previewUrl={subPreviewUrl}
        onFileChange={handleSubFileChange}
        onRemove={handleSubFileRemove}
        label="보조 이미지"
        maxSize={20}
      />

      <textarea
        name="content"
        value={form.content}
        onChange={handleChange}
        placeholder="본문"
        rows={18}
      />

      <textarea
        name="memo"
        value={form.memo}
        onChange={handleChange}
        placeholder="메모"
        rows={8}
      />

      <div className="button-row">
        <button type="submit" disabled={!form.chapterId || !form.title}>
          저장하기
        </button>
        <button
          type="button"
          className={confirmed ? 'confirm-btn confirmed' : 'confirm-btn'}
          disabled={!selectedPageId || selectedPageId.startsWith('_new_')}
          onClick={handleConfirmToggle}
        >
          {confirmed ? '확정취소' : '확정하기'}
        </button>
        <button
          type="button"
          className="delete-btn"
          disabled={!selectedPageId || selectedPageId.startsWith('_new_')}
          onClick={handleDelete}
        >
          삭제하기
        </button>
      </div>

      {pageInfo && (
        <div className="page-meta">
          <span>작성: {pageInfo.createdBy}</span>
          {pageInfo.updatedByName && (
            <span>수정: {pageInfo.updatedByName} ({new Date(pageInfo.updatedAt).toLocaleDateString('ko-KR')})</span>
          )}
        </div>
      )}
    </form>
  );
}
