// src/utils/api.js
// =============================================
// HTTP CLIENT (Axios)
// - baseURL trỏ về Node.js Backend mới
// - Request Interceptor: tự động đính kèm JWT
// - Response Interceptor: tự logout khi token hết hạn (401)
// =============================================
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// ── REQUEST INTERCEPTOR ── Đính kèm JWT vào mọi request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));

// ── RESPONSE INTERCEPTOR ── Tự logout khi token hết hạn
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Token hết hạn hoặc không hợp lệ → xóa token, redirect về login
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && currentPath !== '/register') {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
