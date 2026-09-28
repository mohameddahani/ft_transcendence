const API_URL = process.env.API_URL || "http://localhost:3000";

export async function fetchFromBackend(
  endpoint: string,
  userToken?: string,
  options?: RequestInit
): Promise<Response> {
  const url = `${API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (userToken) {
    headers.Authorization = `Bearer ${userToken}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
