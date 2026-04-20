const BASE_URL = "https://app.tablecrm.com/api/v1"

type ApiErrorDetailItem = {
  msg?: string;
  loc?: Array<string | number>;
  type?: string;
};

interface ApiRequestOptions extends Omit<RequestInit, "method"> {
  token: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: unknown;
  query?: Record<string, string>;
}

export async function apiRequest<T>(
  path: string,
  { token, data, method = "GET", query, ...options }: ApiRequestOptions
): Promise<T> {
  const url = new URL(`${BASE_URL}/${path}`)

  url.searchParams.set("token", token)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  const response = await fetch(url.toString(), {
    ...options,
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: data ? JSON.stringify(data) : options.body,
  })

  if (!response.ok) {
    const text = await response.text()
    let message = text

    try {
      const json: { detail?: string | ApiErrorDetailItem[]; message?: string } = JSON.parse(text)

      if (typeof json.detail === "string") {
        message = json.detail
      } else if (Array.isArray(json.detail)) {
        message = json.detail
          .map((item) => {
            if (item.msg && Array.isArray(item.loc)) {
              return `${item.loc.join(".")}: ${item.msg}`
            }
            if (item.msg) return item.msg
            return JSON.stringify(item)
          })
          .join("; ")
      } else if (json.message) {
        message = json.message
      }
    } catch {
      //
    }

    throw new Error(message || `Ошибка ${response.status}`)
  }

  return response.json()
}