import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// 개발 환경에서만 API URL 로그 출력
if (import.meta.env.DEV) {
  console.log('🔗 API URL:', API_URL);
  console.log('🌍 Environment:', import.meta.env.MODE);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 별도의 리프레시 전용 인스턴스 (인터셉터 미적용)
const refreshApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 공개 API 인스턴스 (인증 불필요한 엔드포인트용)
export const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// publicApi에도 토큰이 있으면 추가하되, 401 에러시 리디렉션하지 않음
publicApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    // 리프레시 엔드포인트와 로그인/회원가입 엔드포인트의 401은 재시도하지 않음
    const isAuthCall = typeof originalRequest.url === 'string' && 
      (originalRequest.url.includes('/auth/refresh') || 
       originalRequest.url.includes('/auth/login') || 
       originalRequest.url.includes('/auth/register'));

    if (status === 401 && !originalRequest._retry && !isAuthCall) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // 인터셉터 미적용 인스턴스로 리프레시 호출 (무한 루프 방지)
        const response = await refreshApi.post('/auth/refresh', {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data || {};
        if (!access_token) {
          throw new Error('No access token in refresh response');
        }
        localStorage.setItem('access_token', access_token);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// --- Admin helpers ---
export const adminApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});