// src/axios.js
import axios from "axios";

console.log("📡 axios 기본 서버 주소:", import.meta.env.VITE_SERVER_URL);

const instance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default instance;
