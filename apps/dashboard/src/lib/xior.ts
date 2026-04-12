import xior from "xior";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const xiorInstance = xior.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach auth if needed
xiorInstance.interceptors.request.use((config) => {
  return config;
});

// Response interceptor — structured error extraction
xiorInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const serverError = error?.response?.data?.error;
    const serverCode = error?.response?.data?.code;

    let message: string;
    if (status === 502 && serverCode) {
      // Backend service errors (Nunchuk, Alby, Claude)
      message = serverError ?? "Upstream service unavailable";
    } else if (status === 400) {
      message = serverError ?? "Invalid request";
    } else if (status === 503) {
      message = serverError ?? "Service not initialized";
    } else if (error?.message?.includes("timeout")) {
      message = "Request timed out — the server may be busy";
    } else if (error?.message?.includes("Network Error") || !error?.response) {
      message = "Cannot reach the API server — is the backend running?";
    } else {
      message = serverError ?? error?.message ?? "Something went wrong";
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(`[BitShield API] ${status ?? "ERR"} ${message}`);
    }

    return Promise.reject(new Error(message));
  }
);
