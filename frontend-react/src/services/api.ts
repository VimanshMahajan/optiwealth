import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const api = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Debug: Log the API base URL (remove in production)
console.log("API Base URL:", baseURL);

// Interceptor to attach token if present
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

export default api;
