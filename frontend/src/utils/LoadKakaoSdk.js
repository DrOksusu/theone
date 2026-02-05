// src/utils/loadKakaoSdk.js
export const loadKakaoSdk = () => {
    return new Promise((resolve, reject) => {
      if (window.Kakao && window.Kakao.isInitialized?.()) {
        return resolve();
      }
  
      if (document.getElementById("kakao-sdk")) {
        return resolve();
      }
  
      const script = document.createElement("script");
      script.id = "kakao-sdk";
      script.src = "https://developers.kakao.com/sdk/js/kakao.js";
      script.onload = () => resolve();
      script.onerror = () => reject("Kakao SDK load error");
      document.head.appendChild(script);
    });
  };
  