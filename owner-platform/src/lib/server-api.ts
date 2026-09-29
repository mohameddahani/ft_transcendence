import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const API_URL = process.env.API_URL || "http://localhost:3000";

export interface BackendResponse<T = any> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
  json: () => Promise<T>;
  text: () => Promise<string>;
  headers: {
    get: (name: string) => string | null;
    getSetCookie?: () => string[];
  };
  raw: AxiosResponse<T>;
}

export async function fetchFromBackend<T = any>(
  endpoint: string,
  userToken?: string,
  options?: RequestInit | {
    method?: string;
    headers?: Record<string, string> | HeadersInit;
    body?: any;
    [key: string]: any;
  }
): Promise<BackendResponse<T>> {
  const url = `${API_URL}${endpoint}`;

  let headers: Record<string, string> = {};
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      headers = { ...(options.headers as Record<string, string>) };
    }
  }

  if (userToken) {
    headers.Authorization = `Bearer ${userToken}`;
  }

  let data = options?.body;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      // keep raw string if not JSON
    }
  }

  const config: AxiosRequestConfig = {
    url,
    method: ((options?.method as string) || "GET").toUpperCase(),
    headers,
    data,
    validateStatus: () => true, // Don't throw on error status codes
  };

  const axiosRes = await axios(config);

  const getHeader = (name: string): string | null => {
    const val = axiosRes.headers[name.toLowerCase()];
    if (Array.isArray(val)) return val.join(", ");
    return val !== undefined && val !== null ? String(val) : null;
  };

  const getSetCookie = (): string[] => {
    const cookies = axiosRes.headers["set-cookie"];
    if (Array.isArray(cookies)) return cookies;
    if (typeof cookies === "string") return [cookies];
    return [];
  };

  return {
    ok: axiosRes.status >= 200 && axiosRes.status < 300,
    status: axiosRes.status,
    statusText: axiosRes.statusText,
    data: axiosRes.data,
    json: async () => axiosRes.data,
    text: async () => (typeof axiosRes.data === "string" ? axiosRes.data : JSON.stringify(axiosRes.data)),
    headers: {
      get: getHeader,
      getSetCookie,
    },
    raw: axiosRes,
  };
}
