import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || ""),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Normalize full API_URL in browser to route through Next.js proxy and preserve cookies without CORS blocks
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.baseURL = "";
    if (config.url) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      if (config.url.startsWith(backendUrl)) {
        config.url = config.url.slice(backendUrl.length);
      }
    }
  }
  return config;
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
      !url.includes("/api/auth/staffs/login") &&
      !url.includes("/api/auth/members/login") &&
      !url.includes("/api/auth/admins/refresh") &&
      !url.includes("/api/auth/staffs/refresh") &&
      !url.includes("/api/auth/members/refresh")
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

      // Determine whether to call member, staff or admin refresh endpoint
      let userRole = "ADMIN";
      try {
        const stored = typeof window !== "undefined" ? (localStorage.getItem("gym_user") || localStorage.getItem("kinetic_user")) : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          const rawRole = (parsed?.role || parsed?.userType || "").toUpperCase();
          if (rawRole === "STAFF") userRole = "STAFF";
          else if (rawRole === "MEMBER") userRole = "MEMBER";
        }
      } catch {
        // ignore
      }

      try {
        const refreshEndpoint =
          userRole === "MEMBER"
            ? "/api/auth/members/refresh"
            : userRole === "STAFF"
            ? "/api/auth/staffs/refresh"
            : "/api/auth/admins/refresh";

        // Attempt to refresh the access token via Next.js proxy route
        await axios.post(
          refreshEndpoint,
          {},
          { withCredentials: true }
        );

        // Refresh succeeded: process all queued requests and retry the original
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g. refresh token expired or revoked)
        processQueue(refreshError);

        // Do not redirect to logout if this was simply a role-endpoint mismatch
        // (e.g. member calling an admin endpoint or vice versa)
        const isRoleEndpointMismatch =
          (userRole === "MEMBER" && url.includes("/api/admins/")) ||
          (userRole !== "MEMBER" && url.includes("/api/members/"));

        if (
          !isRoleEndpointMismatch &&
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/staff/login") &&
          !window.location.pathname.startsWith("/admin/login") &&
          !window.location.pathname.startsWith("/member/login") &&
          !window.location.pathname.startsWith("/members/login")
        ) {
          const redirectPath =
            userRole === "MEMBER" || window.location.pathname.startsWith("/member")
              ? "/member/login"
              : userRole === "STAFF" || window.location.pathname.startsWith("/staff")
              ? "/staff/login"
              : "/login";
          window.location.href = `${redirectPath}?from=${encodeURIComponent(
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
