import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";

const api = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor to attach token if present
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

export default api;

export const searchSymbols = async (query: string, limit = 20): Promise<string[]> => {
    const response = await api.get<string[]>("/api/symbols", {
        params: { query, limit },
    });
    return response.data;
};
