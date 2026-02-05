import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
// import PageForm from "./PageForm";
import PageViewer from "./views/PageViewer";
import TotalViewer from "./views/TotalViewer";
import axios from "axios";

const REST_API_KEY = "YOUR_REST_API_KEY";
const REDIRECT_URI = "http://localhost:5173/login/kakao";  // 카카오 개발자센터에 등록 필요

function App() {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);

  return (
    <Router>
      <div className="App">
        <h1 className="text-xl font-bold text-center mt-4">📘 The One</h1>

        {/* ✅ 상단 메뉴 */}
        <nav className="text-center my-4">
          <div style={{ display: "inline-flex", gap: "1.5rem" }}>
            <Link to="/total">🔍챕터 및 단어 조회</Link>
            <Link to="/">📝단어 추가 및 수정(삭제)</Link>
            {!token && (
              <a
                href={`https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`}
              >
                🟡 카카오 로그인
              </a>
            )}
          </div>
        </nav>

        {/* ✅ 경로에 따라 컴포넌트 변경 */}
        <Routes>
          <Route path="/" element={<PageViewer token={token} userId={userId} />} />
          <Route path="/total" element={<TotalViewer token={token} userId={userId} />} />
          <Route path="/login/kakao" element={
            <KakaoLoginRedirectHandler setToken={setToken} setUserId={setUserId} />
          } />
        </Routes>
      </div>
    </Router>
  );
}

// ✅ 인가코드 받은 후 토큰 요청 처리
function KakaoLoginRedirectHandler({ setToken, setUserId }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URLSearchParams(location.search).get("code");
    if (!code) return;

    // 👉 백엔드에서 인가코드를 받아 access_token과 user 정보 받기
    axios.post("http://localhost:3100/auth/kakao", { code })
      .then((res) => {
        const { token, userId } = res.data;
        setToken(token);
        setUserId(userId);
        navigate("/");  // 로그인 후 메인으로 이동
      })
      .catch((err) => {
        console.error("❌ 로그인 실패:", err);
      });
  }, [location, setToken, setUserId, navigate]);

  return <div className="text-center mt-20">🔁 카카오 로그인 처리 중...</div>;
}

export default App;
