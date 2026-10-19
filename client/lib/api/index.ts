const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type RequestOptions = RequestInit & {
  token?: string;
  responseType?: "json" | "blob";
};

function formatApiError(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(formatApiError).filter(Boolean).join(", ");
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value)
      .map(([field, detail]) => `${field}: ${formatApiError(detail)}`)
      .join("; ");
  }
  return value === undefined || value === null ? "" : String(value);
}

export async function api<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers, responseType, ...rest } = options;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        ...(typeof FormData === "undefined" || !(rest.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
        ...headers,
      },
    });
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "Network error. Please check your connection.";
    throw new Error(errorMsg);
  }

  if (responseType === "blob" && response.ok) {
    return (await response.blob()) as T;
  }

  let data: unknown = {};
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = {};
    }
  } else {
    try {
      const text = await response.text();
      data = { message: text };
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    const errorData =
      typeof data === "object" && data !== null && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : {};
    const preferredMessage =
      errorData.detail ?? errorData.message ?? errorData.error;
    let errorMessage = formatApiError(preferredMessage);

    if (!errorMessage) {
      const entries = Object.entries(errorData);
      if (entries.length > 0) {
        const [field, val] = entries[0];
        const msg = formatApiError(val);
        errorMessage = field === "non_field_errors" ? msg : `${field}: ${msg}`;
      }
    }

    throw new Error(
      errorMessage || `Request failed with status ${response.status}`,
    );
  }

  return data as T;
}

export * from "./endpoints";
export * from "./signupApi";
