import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers?.set("Authorization", `Bearer ${token}`);
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // const hastoken = localStorage.getItem("token");
        
        // if (error.response?.status === 401 && hastoken) {
        //     localStorage.removeItem("token");
        //     window.location.href = "/login";
        // }

        return Promise.reject(error);
    }
);

export default api;
