const BASE_URL = "https://app.tablecrm.com/api/v1";

interface ApiRequestOptions extends Omit<RequestInit, "method"> {
  token: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: unknown;
}

export async function apiRequest<T>(
  path: string,
  { token, data, method = "GET", ...options }: ApiRequestOptions
): Promise<T> {
  const url = `${BASE_URL}/${path}?token=${token}`;

  const response = await fetch(url, {
    ...options,
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: data ? JSON.stringify(data) : options.body,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;

    try {
      const json = JSON.parse(text);
      message = json.detail || text;
    } catch {
    }

    throw new Error(message || `Ошибка ${response.status}`);
  }

  return response.json();
}