/**
 * API Configuration
 *
 * Centralized configuration for API endpoints and base URLs.
 * Uses environment variables with sensible defaults.
 */

/**
 * Base URL for the metadata API service
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Base URL for the auth service
 */
export const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8001";

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  // Metadata endpoints
  pages: (route: string) => `${API_BASE_URL}/metadata/pages/${route}`,
  layouts: (layoutId?: string) =>
    layoutId
      ? `${API_BASE_URL}/metadata/layouts/${layoutId}`
      : `${API_BASE_URL}/metadata/layouts`,
  themes: (baseTheme: string, variant: string) =>
    `${API_BASE_URL}/metadata/themes/${baseTheme}/${variant}`,
  translations: (locale: string) =>
    `${API_BASE_URL}/metadata/translations/${locale}`,
  entities: (entityName: string) =>
    `${API_BASE_URL}/metadata/entities/${entityName}`,

  // System endpoints
  version: `${API_BASE_URL}/system/version/string`,
  health: `${API_BASE_URL}/system/health`,

  // Auth endpoints
  auth: {
    login: `${AUTH_BASE_URL}/auth/login/password`,
    logout: `${AUTH_BASE_URL}/auth/logout`,
    refresh: `${AUTH_BASE_URL}/auth/refresh`,
  },
} as const;

/**
 * Default request configuration
 */
export const DEFAULT_REQUEST_CONFIG = {
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include" as RequestCredentials,
};

/**
 * Helper function to build API URLs with query parameters
 */
export function buildApiUrl(
  baseUrl: string,
  params?: Record<string, string | number | boolean | null | undefined>
): string {
  if (!params) return baseUrl;

  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

/**
 * API client helper functions
 */
export const apiClient = {
  get: async (url: string, config?: RequestInit) => {
    const response = await fetch(url, {
      ...DEFAULT_REQUEST_CONFIG,
      method: "GET",
      ...config,
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  },

  post: async (url: string, data?: any, config?: RequestInit) => {
    const response = await fetch(url, {
      ...DEFAULT_REQUEST_CONFIG,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  },
};
