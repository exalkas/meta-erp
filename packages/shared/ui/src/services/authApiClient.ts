/**
 * Authentication Service API Client
 * Connects frontend apps to the FastAPI auth service at localhost:8001
 */

export interface LoginRequest {
  tenant_id: string;
  email: string;
  password: string;
  device_name?: string;
}

export interface LoginResponse {
  user: {
    user_id: string;
    tenant_id: string;
    email: string;
    first_name: string;
    last_name: string;
    display_name: string;
    status: string;
    is_verified: boolean;
    phone?: string;
    phone_verified: boolean;
    avatar_url?: string;
    timezone?: string;
    locale?: string;
    two_factor_enabled: boolean;
    passkey_enabled: boolean;
    compliance_level: string;
    last_login?: string;
    created_at: string;
  };
  session: {
    session_id: string;
    status: string;
    device_name?: string;
    device_type?: string;
    ip_address?: string;
    location_country?: string;
    location_city?: string;
    created_at: string;
    expires_at: string;
    last_activity?: string;
    is_current: boolean;
  };
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthError {
  error_code: string;
  message: string;
  details?: any;
  timestamp: string;
}

class AuthApiClient {
  private baseUrl: string;
  private defaultTenantId: string;

  constructor() {
    // In development, point to our auth service
    this.baseUrl =
      process.env.NODE_ENV === "production"
        ? "/api/auth" // Production: goes through Next.js API routes
        : "http://localhost:8001/auth"; // Development: direct to FastAPI auth service on port 8001

    // Default tenant for demo/development
    this.defaultTenantId = "89f84fea-b5b9-413c-945b-002c7fd9555d"; // demo-eshop-crm tenant
  }

  /**
   * Login with password
   */
  async loginWithPassword(
    email: string,
    password: string,
    tenantId?: string,
    deviceName?: string
  ): Promise<LoginResponse> {
    const requestData: LoginRequest = {
      tenant_id: tenantId || this.defaultTenantId,
      email,
      password,
      device_name: deviceName || "Web Browser",
    };

    console.log(
      "🔐 Auth API: Attempting login to",
      `${this.baseUrl}/login/password`
    );
    console.log("📤 Request data:", { ...requestData, password: "[HIDDEN]" });

    try {
      const response = await fetch(`${this.baseUrl}/login/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("❌ Auth API Error:", response.status, responseData);

        // Handle auth service error format
        if (responseData.error_code) {
          throw new Error(responseData.message || "Authentication failed");
        }

        throw new Error(
          `Authentication failed: ${response.status} ${response.statusText}`
        );
      }

      console.log("✅ Auth API: Login successful");
      console.log("📥 Response data:", {
        user: responseData.user?.email,
        session: responseData.session?.session_id,
        expires_in: responseData.expires_in,
      });

      return responseData as LoginResponse;
    } catch (error) {
      console.error("❌ Auth API: Login failed:", error);
      throw error;
    }
  }

  /**
   * Logout (revoke session)
   */
  async logout(sessionToken: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        console.warn("⚠️ Auth API: Logout failed, but continuing...");
      } else {
        console.log("✅ Auth API: Logout successful");
      }
    } catch (error) {
      console.warn("⚠️ Auth API: Logout error, but continuing:", error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const responseData = await response.json();
      console.log("🔄 Auth API: Token refreshed successfully");

      return responseData as LoginResponse;
    } catch (error) {
      console.error("❌ Auth API: Token refresh failed:", error);
      throw error;
    }
  }

  /**
   * Validate current session
   */
  async validateSession(sessionToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/validate-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: sessionToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.valid === true;
      }

      return false;
    } catch (error) {
      console.error("❌ Auth API: Session validation failed:", error);
      return false;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(sessionToken: string): Promise<LoginResponse["user"]> {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get user profile");
      }

      const responseData = await response.json();
      return responseData.user;
    } catch (error) {
      console.error("❌ Auth API: Get user profile failed:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const authApiClient = new AuthApiClient();
export default authApiClient;
