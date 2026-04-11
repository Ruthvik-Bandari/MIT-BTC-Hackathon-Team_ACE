import xior from "xior";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const xiorInstance = xior.create({
  baseURL: API_URL,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach auth if needed
xiorInstance.interceptors.request.use((config) => {
  return config;
});

// Response interceptor — unwrap errors
xiorInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error ?? error?.message ?? "Network error";
    console.error(`[xior] ${message}`);
    return Promise.reject(new Error(message));
  }
);
