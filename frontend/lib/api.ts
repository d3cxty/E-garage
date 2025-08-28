import axios from "axios";
const base = process.env.NEXT_PUBLIC_API_URL;
if (!base) console.error("❌ Missing NEXT_PUBLIC_API_URL in .env.local");
const api = axios.create({ baseURL: base || "/" });
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = "Bearer " + token;
  }
  return config;
});
export default api;
