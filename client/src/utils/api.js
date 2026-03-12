import axios from "axios";

const rawUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";
// Ensure the base URL ends with exactly one slash
const API_URL = rawUrl.replace(/\/+$/, "") + "/";

const api = axios.create({
    baseURL: API_URL,
});

// Automatically add token to every request
api.interceptors.request.use((config) => {
    // Prevent double slashes in URL
    if (config.url) {
        config.url = config.url.replace(/^\/+/, "");
    }
    
    const token = sessionStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
