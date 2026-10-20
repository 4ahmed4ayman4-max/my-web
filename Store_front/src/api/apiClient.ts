import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";

declare global {
  interface ImportMetaEnv {
    VITE_API_BASE_URL?: string;
  }
  interface ImportMeta {
    env: ImportMetaEnv;
  }
}

/**
 * Creates the Axios instance with base configuration.
 * Uses the base URL from environment variables.
 */
export function createApiClient(): AxiosInstance {
  return axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
    timeout: 30000,
  });
}

/**
 * Extracts a human readable message out of a backend error payload.
 * The API returns a few different shapes depending on where the failure
 * came from:
 *  - { success, message, errors? }  -> exception middleware / validation filter
 *  - { success, message, errors? }  -> auth endpoints
 *  - { title, status }              -> unhandled ASP.NET Core errors
 */
function extractErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const payload = data as Record<string, any>;

    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      return payload.errors.join(". ");
    }

    // ASP.NET model validation returns { errors: { field: [messages] } }
    if (payload.errors && typeof payload.errors === "object") {
      const messages = Object.values(payload.errors as Record<string, any>)
        .flat()
        .filter((m): m is string => typeof m === "string");
      if (messages.length > 0) {
        return messages.join(". ");
      }
    }

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    if (typeof payload.title === "string" && payload.title.trim()) {
      return payload.title;
    }
  }

  return fallback;
}

/**
 * Standardized API call that unwraps ApiResponseDto<T> and surfaces the
 * backend error message instead of the generic axios one.
 */
export async function apiFetch<T>(
  client: AxiosInstance,
  method: "get" | "post" | "put" | "patch" | "delete",
  endpoint: string,
  data?: unknown,
  token?: string
): Promise<T> {
  const config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  let requestPromise: Promise<AxiosInstance["request"]>;

  switch (method) {
    case "get":
      requestPromise = client.get(endpoint, config);
      break;
    case "post":
      requestPromise = client.post(endpoint, data, config);
      break;
    case "put":
      requestPromise = client.put(endpoint, data, config);
      break;
    case "patch":
      requestPromise = client.patch(endpoint, data, config);
      break;
    case "delete":
      requestPromise = client.delete(endpoint, config);
      break;
  }

  try {
    const response = await requestPromise;

    // Unwrap ApiResponseDto<T> - the API serializes it in camelCase.
    // Endpoints that answer with a plain payload (products, cart, orders, ...)
    // are returned untouched.
    const responseData = (response as any).data;
    if (
      responseData &&
      typeof responseData === "object" &&
      "success" in responseData
    ) {
      if (!responseData.success) {
        throw new Error(
          extractErrorMessage(responseData, "API request failed")
        );
      }

      if ("data" in responseData) {
        return responseData.data as T;
      }
    }

    return responseData as T;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const fallback = status
        ? `Request failed with status ${status}.`
        : "Network error. Please try again.";

      throw new Error(extractErrorMessage(error.response?.data, fallback));
    }

    throw error;
  }
}

/**
 * Convenience methods matching the endpoint constants
 */
export const api = {
  get: <T>(client: AxiosInstance, endpoint: string, data?: unknown, token?: string) => apiFetch<T>(client, "get", endpoint, data, token),
  post: <T>(client: AxiosInstance, endpoint: string, data?: unknown, token?: string) => apiFetch<T>(client, "post", endpoint, data, token),
  put: <T>(client: AxiosInstance, endpoint: string, data?: unknown, token?: string) => apiFetch<T>(client, "put", endpoint, data, token),
  patch: <T>(client: AxiosInstance, endpoint: string, data?: unknown, token?: string) => apiFetch<T>(client, "patch", endpoint, data, token),
  delete: <T>(client: AxiosInstance, endpoint: string, token?: string) => apiFetch<T>(client, "delete", endpoint, undefined, token),
};