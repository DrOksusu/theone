import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PageForm.css";

function PageForm({ token, userId }) {
  const [form, setForm] = useState({
    title: "",
    content: "",
    memo: "",
    chapterId: "",
    order: "",
    image: null,
  });

  const [previewUrl, setPreviewUrl] = useState(""); // ✅ 이미지 미리보기용 상태
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    axios.get("/api/chapters").then((res) => setChapters(res.data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, image: file });

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result); // ✅ base64 url 저장
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let imageUrl = "";
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

      await axios.post(
        "/api/pages",
        {
          title: form.title,
          content: form.content,
          memo: form.memo,
          imageUrl,
          chapterId: parseInt(form.chapterId),
          userId: parseInt(userId),
          order: parseInt(form.order),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("페이지가 성공적으로 등록되었습니다!");
    } catch (error) {
      console.error("페이지 등록 실패:", error);
      alert("문제가 발생했습니다!");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-form">
      <h2>📘 페이지 작성 폼</h2>

      <input
        type="text"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="제목을 입력하세요"
      />

      <div className="form-row">
        <select
          name="chapterId"
          value={form.chapterId}
          onChange={handleChange}
        >
          <option value="">챕터 선택</option>
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.order}. {ch.title}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="order"
          value={form.order}
          onChange={handleChange}
          placeholder="페이지 순서"
        />
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
        rows={6}
      />

      <textarea
        name="memo"
        value={form.memo}
        onChange={handleChange}
        placeholder="메모"
        rows={4}
      />

      <button type="submit">저장하기</button>
    </form>
  );
}

export default PageForm;
