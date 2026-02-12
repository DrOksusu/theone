'use client';

import { useEffect, useState, useRef } from 'react';
import axios from '@/lib/axios';

export default function PageViewer({ token, userId }) {
  const [chapters, setChapters] = useState([]);
  const [pages, setPages] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedPageId, setSelectedPageId] = useState('');
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
  const [isDragging, setIsDragging] = useState(false);
  const [isSubDragging, setIsSubDragging] = useState(false);
  const fileInputRef = useRef(null);
  const subFileInputRef = useRef(null);

  useEffect(() => {
    axios.get('/api/chapters').then((res) => {
      if (Array.isArray(res.data)) {
        setChapters(res.data);
      } else {
        console.error('📛 chapters 응답이 배열이 아님:', res.data);
        setChapters([]);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedChapterId) {
      axios
        .get(`/api/chapters/${selectedChapterId}/pages`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setPages(res.data));
    } else {
      setPages([]);
      setSelectedPageId('');
      resetForm();
    }
  }, [selectedChapterId, token]);

  useEffect(() => {
    if (!selectedPageId) {
      resetForm();
      return;
    }
    if (selectedPageId.startsWith('_new_')) return;

    console.log('📡 페이지 조회 요청:', selectedPageId);

    axios
      .get(`/api/pages/${selectedPageId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        console.log('✅ 페이지 조회 성공:', res.data);
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
        setPreviewUrl(page.imageUrl || '');
        setSubPreviewUrl(page.subImageUrl || '');
      })
      .catch((err) => {
        console.error('❌ 페이지 조회 실패:', err);
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
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  const handleFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('❌ 이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert(`❌ 파일 용량이 너무 큽니다.\n최대 20MB까지 업로드 가능합니다.\n현재 파일: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setForm((prev) => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    } else {
      setForm((prev) => ({ ...prev, image: null }));
      setPreviewUrl(form.imageUrl || '');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  // 보조 이미지 핸들러
  const handleSubFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('❌ 이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert(`❌ 파일 용량이 너무 큽니다.\n최대 20MB까지 업로드 가능합니다.\n현재 파일: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setForm((prev) => ({ ...prev, subImage: file }));
    const reader = new FileReader();
    reader.onloadend = () => setSubPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleSubFile(file);
    } else {
      setForm((prev) => ({ ...prev, subImage: null }));
      setSubPreviewUrl(form.subImageUrl || '');
    }
  };

  const handleSubDragOver = (e) => {
    e.preventDefault();
    setIsSubDragging(true);
  };

  const handleSubDragLeave = (e) => {
    e.preventDefault();
    setIsSubDragging(false);
  };

  const handleSubDrop = (e) => {
    e.preventDefault();
    setIsSubDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleSubFile(file);
    }
  };

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
          alert('✅ 기존 페이지를 성공적으로 수정했습니다!');

          // 수정 후 페이지 목록 갱신
          const pagesRes = await axios.get(`/api/chapters/${selectedChapterId}/pages`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPages(pagesRes.data);
        } else {
          alert('❗ 같은 단어가 이미 있습니다, 페이지조회를 눌러서 수정하세요');
          return;
        }
      } else {
        console.log('📤 새 페이지 생성 요청...');
        const newPageRes = await axios.post('/api/pages', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('✅ 새 페이지 생성 완료:', newPageRes.data);
        alert('✅ 새 페이지를 성공적으로 생성했습니다!');

        // 저장 성공 후 페이지 목록 갱신
        console.log('🔄 페이지 목록 갱신 중...');
        const pagesRes = await axios.get(`/api/chapters/${selectedChapterId}/pages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('📋 갱신된 페이지 목록:', pagesRes.data);
        setPages(pagesRes.data);
        setSelectedPageId(newPageRes.data.id.toString());
        console.log('✅ 목록 갱신 완료');
      }
    } catch (error) {
      console.error('❌ 저장 중 오류:', error);
      alert('저장 중 문제가 발생했습니다!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-form">
      <h2>📖 단어 조회 & 수정 & 추가 & 삭제</h2>

      <div className="form-row">
        <select
          value={selectedChapterId}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedChapterId(value);
            setForm((prev) => ({ ...prev, chapterId: value }));
          }}
        >
          <option value="">챕터 선택</option>
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.order}. {ch.title}
            </option>
          ))}
        </select>

        <select
          value={selectedPageId}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'add_new') {
              const newTitle = prompt('새로운 단어(타이틀)를 입력해주세요:');
              if (!newTitle || newTitle.trim() === '') {
                alert('❗ 단어 제목을 입력해주세요!');
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
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              if (subFileInputRef.current) {
                subFileInputRef.current.value = '';
              }
              setSelectedPageId(newId);
            } else {
              console.log('🔄 단어 선택됨:', value);
              setSelectedPageId(value);
            }
          }}
        >
          <option value="">단어 선택</option>
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.title}
            </option>
          ))}
          <option value="add_new">➕ 단어 추가</option>
        </select>
      </div>

      <div
        className={`dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
        {previewUrl ? (
          <div className="image-preview">
            <img src={previewUrl} alt="미리보기" />
            <button
              type="button"
              className="remove-image"
              onClick={(e) => {
                e.stopPropagation();
                setForm((prev) => ({ ...prev, image: null, imageUrl: '' }));
                setPreviewUrl('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              ✕ 이미지 삭제
            </button>
          </div>
        ) : (
          <div className="dropzone-text">
            <span>📷 메인 이미지를 드래그하거나 클릭하여 선택</span>
            <span className="file-limit">(최대 20MB)</span>
          </div>
        )}
      </div>

      <div
        className={`dropzone sub-dropzone ${isSubDragging ? 'dragging' : ''}`}
        onDragOver={handleSubDragOver}
        onDragLeave={handleSubDragLeave}
        onDrop={handleSubDrop}
        onClick={() => subFileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={subFileInputRef}
          onChange={handleSubFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
        {subPreviewUrl ? (
          <div className="image-preview">
            <img src={subPreviewUrl} alt="보조 이미지 미리보기" />
            <button
              type="button"
              className="remove-image"
              onClick={(e) => {
                e.stopPropagation();
                setForm((prev) => ({ ...prev, subImage: null, subImageUrl: '' }));
                setSubPreviewUrl('');
                if (subFileInputRef.current) subFileInputRef.current.value = '';
              }}
            >
              ✕ 보조 이미지 삭제
            </button>
          </div>
        ) : (
          <div className="dropzone-text">
            <span>📷 보조 이미지를 드래그하거나 클릭하여 선택</span>
            <span className="file-limit">(최대 20MB)</span>
          </div>
        )}
      </div>

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

      <button type="submit" disabled={!form.chapterId || !form.title}>
        저장하기
      </button>
    </form>
  );
}
