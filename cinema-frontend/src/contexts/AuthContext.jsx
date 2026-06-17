import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data);
            } catch (error) {
                console.error('Lỗi lấy thông tin user', error);
                localStorage.removeItem('token');
                setUser(null);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUser();

        // Lắng nghe event 'auth:refresh' từ ProfilePage sau khi cập nhật thông tin
        const handleRefresh = () => fetchUser();
        window.addEventListener('auth:refresh', handleRefresh);
        return () => window.removeEventListener('auth:refresh', handleRefresh);
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { access_token, user } = response.data;
        localStorage.setItem('token', access_token);
        setUser(user);
        return user;
    };

    const register = async (userData) => {
        const response = await api.post('/auth/register', userData);
        const { access_token, user } = response.data;
        localStorage.setItem('token', access_token);
        setUser(user);
        return user;
    };

    // Bước 1: Gửi OTP xác thực email đăng ký
    const sendVerificationOTP = async (userData) => {
        const response = await api.post('/auth/register/send-otp', userData);
        return response.data; // { message: "Mã OTP đã gửi..." }
    };

    // Bước 2: Xác thực OTP và tạo tài khoản
    const verifyAndRegister = async ({ email, otp }) => {
        const response = await api.post('/auth/register/verify-otp', { email, otp });
        const { access_token, user } = response.data;
        localStorage.setItem('token', access_token);
        setUser(user);
        return user;
    };


    const logout = async () => {
        // Cập nhật UI ngay lập tức để tránh block hiển thị (Fix INP Issue)
        localStorage.removeItem('token');
        setUser(null);
        toast.success("Đăng xuất thành công!");

        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Lỗi đăng xuất phía server', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, sendVerificationOTP, verifyAndRegister, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );

};

export const useAuth = () => {
    return useContext(AuthContext);
};
