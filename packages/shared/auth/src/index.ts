// Greek ERP/CRM - Shared Authentication

// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  companyId: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Auth utilities
export const createAuthToken = (user: User): string => {
  // TODO: Implement JWT token creation
  return `auth-token-${user.id}`;
};

export const validateToken = (token: string): boolean => {
  // TODO: Implement token validation
  return token.startsWith("auth-token-");
};

export const getStoredToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth-token");
  }
  return null;
};

export const setStoredToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth-token", token);
  }
};

export const removeStoredToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth-token");
  }
};
