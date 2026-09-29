import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

interface RetryQueueItem {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

let isRefreshing = false;
let failedQueue: RetryQueueItem[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const url = originalRequest.url || "";

    // Ignore 401s from login or refresh endpoints to avoid infinite loops
    if (
      status === 401 &&
      !originalRequest._retry &&
      !url.includes("/api/auth/login") &&
      !url.includes("/api/auth/admins/refresh")
    ) {
      if (isRefreshing) {
        // Another request is already refreshing the token, wait for it
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the access token via Next.js proxy route for admin and staff
        await axios.post(
          "/api/auth/admins/refresh",
          {},
          { withCredentials: true }
        );

        // Refresh succeeded: process all queued requests and retry the original
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g. refresh token expired or revoked)
        processQueue(refreshError);

        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login")
        ) {
          window.location.href = `/login?from=${encodeURIComponent(
            window.location.pathname
          )}&error=session_expired`;
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { api };
export default api;
