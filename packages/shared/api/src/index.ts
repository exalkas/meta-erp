// Greek ERP/CRM - Shared API Client

// API types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiClient {
  get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
  post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>>;
  put<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>>;
  delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  companyId?: string;
}

// Dashboard API
export * from "./dashboardApi";

// API utilities
export const createApiClient = (
  baseURL: string,
  defaultConfig?: RequestConfig
): ApiClient => {
  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...defaultConfig?.headers,
  };

  const makeRequest = async <T = any>(
    method: string,
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> => {
    const headers: Record<string, string> = {
      ...defaultHeaders,
      ...config?.headers,
    };

    // Add company context if provided
    if (config?.companyId) {
      headers["X-Company-ID"] = config.companyId;
    }

    try {
      // TODO: Replace with actual HTTP client (axios, fetch, etc.)
      const response = await fetch(`${baseURL}${url}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: config?.timeout
          ? AbortSignal.timeout(config.timeout)
          : undefined,
      });

      const result = (await response.json()) as any;

      return {
        data: result.data,
        success: response.ok,
        message: result.message,
        errors: result.errors,
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  };

  return {
    get: <T = any>(url: string, config?: RequestConfig) =>
      makeRequest<T>("GET", url, undefined, config),
    post: <T = any>(url: string, data?: any, config?: RequestConfig) =>
      makeRequest<T>("POST", url, data, config),
    put: <T = any>(url: string, data?: any, config?: RequestConfig) =>
      makeRequest<T>("PUT", url, data, config),
    delete: <T = any>(url: string, config?: RequestConfig) =>
      makeRequest<T>("DELETE", url, undefined, config),
  };
};

export const isApiError = (
  response: ApiResponse
): response is ApiResponse & { success: false } => {
  return !response.success;
};

export const getErrorMessage = (response: ApiResponse): string => {
  if (response.errors && response.errors.length > 0) {
    return response.errors[0];
  }
  return response.message || "Unknown error occurred";
};
