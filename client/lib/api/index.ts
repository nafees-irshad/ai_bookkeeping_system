const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type RequestOptions = RequestInit & {
  token?: string;
};

export async function api<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
        ...headers,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Network error. Please check your connection.";
    throw new Error(errorMsg);
  }

  let data: any = {};
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
    let errorMessage = data.detail || data.message || data.error;

    if (!errorMessage && typeof data === "object" && data !== null) {
      // DRF style errors: { "username": ["A user with that username already exists."], "password": [...] }
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const [field, val] = entries[0];
        const msg = Array.isArray(val) ? val.join(", ") : String(val);
        errorMessage = field === "non_field_errors" ? msg : `${field}: ${msg}`;
      }
    }

    throw new Error(errorMessage || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export * from "./endpoints";
export * from "./signupApi";