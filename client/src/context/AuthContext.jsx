import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }

        setLoading(false);
    }, []);

    // ✅ Login
    const login = async (email, password) => {
        try {
            const res = await api.post("/auth/login", {
                email,
                password,
            });

            const { token, user: userData } = res.data;
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);

            return { success: true, message: res.data.message };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || "Login failed" };
        }
    };

    // ✅ Forgot Password
    const forgotPassword = async (email) => {
        try {
            const res = await api.post("/auth/forgot-password", { email });
            return { success: true, message: res.data.message };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || "Request failed" };
        }
    };

    // ✅ Reset Password
    const resetPassword = async (token, newPassword) => {
        try {
            const res = await api.post("/auth/reset-password", {
                token,
                newPassword
            });
            return { success: true, message: res.data.message };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || "Reset failed" };
        }
    };

    // ✅ Register
    const register = async (username, email, password) => {
        try {
            await api.post("/auth/register", {
                username,
                email,
                password,
            });
            return { success: true, message: "Registration successful. Please login." };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || "Registration failed" };
        }
    };

    // ✅ Login with Token (Called from Callback)
    const loginWithToken = (token, userData) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(userData);
    };

    // ✅ Logout
    const logout = () => {
        localStorage.clear();
        delete axios.defaults.headers.common["Authorization"];
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                forgotPassword,
                resetPassword,
                loginWithToken,
                logout,
                loading,
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);