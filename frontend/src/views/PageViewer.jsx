// ✅ 페이지 순서 입력 없이 자동 처리되는 PageViewer
import React, { useEffect, useState } from "react";
import "../PageViewer.css";

import axios from "../axios";

const BASE_URL = import.meta.env.VITE_SERVER_URL;
console.log("BASE_URL:", BASE_URL);

function PageViewer({ token, userId }) {
  const [chapters, setChapters] = useState([]);
  const [pages, setPages] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [form, setForm] = useState({
    title: "",
    content: "",
    memo: "",
    chapterId: "",
    image: null,
    imageUrl: "",
  });
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    axios.get("/api/chapters").then((res) => {
      if (Array.isArray(res.data)) {
        setChapters(res.data);
      } else {
        console.error("📛 chapters 응답이 배열이 아님:", res.data);
        setChapters([]); // fallback
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
      setSelectedPageId("");
      resetForm();
    }
  }, [selectedChapterId]);

  useEffect(() => {
    if (!selectedPageId) {
      resetForm();
      return;
    }
    if (selectedPageId.startsWith("_new_")) return;

    axios
      .get(`/api/pages/${selectedPageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const page = res.data;
        setForm({
          title: page.title,
          content: page.content,
          memo: page.memo || "",
          chapterId: selectedChapterId,
          image: null,
          imageUrl: page.imageUrl || "",
        });
        const fullUrl = page.imageUrl?.startsWith("http")
          ? page.imageUrl
          : `${BASE_URL}${page.imageUrl}`;
        setPreviewUrl(fullUrl);
      });
  }, [selectedPageId]);

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      memo: "",
      chapterId: selectedChapterId,
      image: null,
      imageUrl: "",
    });
    setPreviewUrl("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      setForm((prev) => ({ ...prev, image: null }));
      setPreviewUrl(form.imageUrl ? `${BASE_URL}${form.imageUrl}` : "");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.chapterId) {
      alert("필수 항목을 입력해주세요!");
      return;
    }

    try {
      let imageUrl = form.imageUrl;
      if (form.image) {
        const imageForm = new FormData();
        imageForm.append("file", form.image);
        const imageRes = await axios.post("/api/upload", imageForm, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
        imageUrl = imageRes.data.url;
      }

      const pageList = await axios.get("/api/pages", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newOrder = pages.length
        ? Math.max(...pages.map((p) => p.order)) + 1
        : 1;

      const payload = {
        title: form.title,
        content: form.content || "",
        memo: form.memo || "",
        imageUrl,
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
          alert("✅ 기존 페이지를 성공적으로 수정했습니다!");
        } else {
          alert("❗ 같은 단어가 이미 있습니다, 페이지조회를 눌러서 수정하세요");
          return;
        }
      } else {
        await axios.post("/api/pages", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("✅ 새 페이지를 성공적으로 생성했습니다!");
      }
    } catch (error) {
      console.error("❌ 저장 중 오류:", error);
      alert("저장 중 문제가 발생했습니다!");
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
            if (value === "add_new") {
              const newTitle = prompt("새로운 단어(타이틀)를 입력해주세요:");
              if (!newTitle || newTitle.trim() === "") {
                alert("❗ 단어 제목을 입력해주세요!");
                return;
              }
              const trimmedTitle = newTitle.trim();
              const newId = `_new_${Date.now()}`;
              setPages((prev) => [
                ...prev,
                { id: newId, title: trimmedTitle, order: 0 },
              ]);
              setForm((prev) => ({
                ...prev,
                title: trimmedTitle,
                chapterId: selectedChapterId,
              }));
              setSelectedPageId(newId);
            } else {
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

      <input type="file" onChange={handleFileChange} />

      {previewUrl && (
        <div className="image-preview">
          <img src={previewUrl} alt="미리보기" />
        </div>
      )}

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

export default PageViewer;
