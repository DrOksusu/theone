// src/components/KakaoLoginButton.js
import React, { useEffect } from "react";
import { loadKakaoSdk } from "../utils/LoadKakaoSdk";

const KAKAO_JS_KEY = "bc6e23d6e33712ac08c2f567f791f08a";

function KakaoLoginButton() {
  useEffect(() => {
    loadKakaoSdk().then(() => {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JS_KEY);
        console.log("Kakao SDK initialized");
      }
    });
  }, []);

  const handleLogin = () => {
    if (!window.Kakao) return;

    window.Kakao.Auth.login({
      success: function (authObj) {
        console.log("카카오 로그인 성공:", authObj);

        // 사용자 정보 요청
        window.Kakao.API.request({
          url: "/v2/user/me",
          success: function (res) {
            console.log("사용자 정보:", res);
            // 여기서 이메일, 닉네임 등 백엔드로 전달 가능
          },
          fail: function (error) {
            console.error("사용자 정보 요청 실패:", error);
          },
        });
      },
      fail: function (err) {
        console.error("카카오 로그인 실패:", err);
      },
    });
  };

  return <button onClick={handleLogin}>카카오 로그인</button>;
}

export default KakaoLoginButton;
