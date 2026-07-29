type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

type ApiResponse<T> = {
  ok?: boolean;
  message?: string;
  error?: string;
} & T;

export async function apiRequest<T = Record<string, never>>(url: string, options: ApiRequestOptions = {}) {
  const { body, ...requestOptions } = options;
  const headers = new Headers(options.headers);
  const init: RequestInit = {
    ...requestOptions,
    headers,
  };

  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);
  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? ((await response.json()) as ApiResponse<T>)
    : ({ message: await response.text() } as ApiResponse<T>);

  if (!response.ok || data.ok === false) {
    throw new Error(data.message || data.error || "请求失败，请稍后再试。");
  }

  return data as ApiResponse<T>;
}

export function apiGet<T = Record<string, never>>(url: string, options?: Omit<ApiRequestOptions, "method" | "body">) {
  return apiRequest<T>(url, { ...options, method: "GET" });
}

export function apiPost<T = Record<string, never>>(url: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) {
  return apiRequest<T>(url, { ...options, method: "POST", body });
}

export function apiPut<T = Record<string, never>>(url: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) {
  return apiRequest<T>(url, { ...options, method: "PUT", body });
}

export function apiPatch<T = Record<string, never>>(url: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) {
  return apiRequest<T>(url, { ...options, method: "PATCH", body });
}

export function apiDelete<T = Record<string, never>>(url: string, options?: Omit<ApiRequestOptions, "method" | "body">) {
  return apiRequest<T>(url, { ...options, method: "DELETE" });
}
