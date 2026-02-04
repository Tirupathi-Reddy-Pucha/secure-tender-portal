import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');
            const userId = localStorage.getItem('userId');
            if (token && role) {
                setUser({ token, role, userId });
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        // If OTP sent, return immediately without setting user
        if (res.data.message === 'OTP_SENT') {
            return res.data;
        }
        // Fallback for legacy (should not happen with new flow)
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('userId', res.data.userId);
        setUser({ token: res.data.token, role: res.data.role, userId: res.data.userId });
        return res.data;
    };

    const verifyOtp = async (username, otp) => {
        const res = await api.post('/auth/verify-otp', { username, otp });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('userId', res.data.userId);
        setUser({ token: res.data.token, role: res.data.role, userId: res.data.userId });
        return res.data;
    };

    const register = async (username, email, password, role, officerCode) => {
        const res = await api.post('/auth/register', { username, email, password, role, officerCode });
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, verifyOtp, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
