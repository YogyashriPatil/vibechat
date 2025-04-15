import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE ==="development" ? "https://vibechat-2-z3lg.onrender.com":"/api", // Ensure this is your backend URL
  withCredentials: true,  // Allow credentials like cookies
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Get token from storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Attach token
    }
    return config;
  },
  (error) => Promise.reject(error)
);
