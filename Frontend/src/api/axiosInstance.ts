// src/api/axiosInstance.ts
import axios from 'axios';

const axiosInstance = axios.create({
  // ✅ 항상 /api로 보내서 Vite proxy를 타게 한다 (localhost -> proxy -> 백엔드)
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // ✅ 쿠키(세션) 로그인 핵심
  withCredentials: true,
});

export default axiosInstance;
