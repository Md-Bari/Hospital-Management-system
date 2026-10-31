import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { AuthResponseDto } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("hospitalms_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto-Refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = typeof window !== "undefined" ? localStorage.getItem("hospitalms_refresh") : null;
        const response = await axios.post<AuthResponseDto>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        const newAuth = response.data;
        if (typeof window !== "undefined") {
          localStorage.setItem("hospitalms_token", newAuth.accessToken);
          localStorage.setItem("hospitalms_refresh", newAuth.refreshToken);
        }

        processQueue(null, newAuth.accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAuth.accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("hospitalms_token");
          localStorage.removeItem("hospitalms_refresh");
          localStorage.removeItem("hospitalms_user");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

