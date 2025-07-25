/**
 * Dashboard API Client for Greek ERP/CRM System
 * Provides functions to fetch dashboard statistics and KPIs
 */

export interface DashboardStats {
  total_customers: number;
  monthly_invoices: number;
  monthly_revenue: number;
  active_opportunities: number;
  monthly_revenue_formatted: string;
  change_indicators: {
    customers: number;
    invoices: number;
    revenue: number;
    opportunities: number;
  };
  last_updated: string;
}

export interface DashboardStatsDetailed {
  total_customers: number;
  monthly_invoices: number;
  monthly_revenue: number;
  active_opportunities: number;
  period: {
    month: number;
    year: number;
    month_name: string;
  };
  last_updated: string;
}

export interface RecentActivity {
  id: string;
  type: string; // "activity", "audit", "system"
  title: string;
  description?: string;
  time: string; // "2 hours ago", "yesterday"
  timestamp: string;
  icon: string; // "FileText", "Users", "Phone", etc.
  color: string; // "green", "blue", "purple", etc.
  entity_type?: string; // "customer", "invoice", "opportunity"
  entity_id?: string;
  user_name?: string;
}

export interface RecentActivitiesResponse {
  activities: RecentActivity[];
  total_count: number;
  last_updated: string;
}

export interface QuickAction {
  title: string;
  description: string;
  icon: string;
  color: string;
  href: string;
  count?: number;
  status?: string;
}

export interface QuickActionsResponse {
  actions: QuickAction[];
  last_updated: string;
}

export interface ApiError {
  detail: string;
  message?: string;
}

/**
 * Dashboard API Client Class
 */
export class DashboardApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  /**
   * Get dashboard statistics for the current month
   */
  async getDashboardStats(accessToken: string): Promise<DashboardStats> {
    const response = await fetch(`${this.baseUrl}/api/v1/dashboard/stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorData = (await response.json()) as ApiError;
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        errorMessage = response.statusText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const data = (await response.json()) as DashboardStats;
    return data;
  }

  /**
   * Get detailed dashboard statistics with optional month/year filters
   */
  async getDashboardStatsDetailed(
    accessToken: string,
    month?: number,
    year?: number
  ): Promise<DashboardStatsDetailed> {
    const params = new URLSearchParams();
    if (month) params.append("month", month.toString());
    if (year) params.append("year", year.toString());

    const queryString = params.toString();
    const url = `${this.baseUrl}/api/v1/dashboard/stats/detailed${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorData = (await response.json()) as ApiError;
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (parseError) {
        errorMessage = response.statusText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const data = (await response.json()) as DashboardStatsDetailed;
    return data;
  }

  /**
   * Get recent activities for the dashboard
   */
  async getRecentActivities(
    accessToken: string,
    limit: number = 10
  ): Promise<RecentActivitiesResponse> {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());

    const url = `${
      this.baseUrl
    }/api/v1/dashboard/recent-activities?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorData = (await response.json()) as ApiError;
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (parseError) {
        errorMessage = response.statusText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const data = (await response.json()) as RecentActivitiesResponse;
    return data;
  }

  /**
   * Get quick actions with dynamic data
   */
  async getQuickActions(accessToken: string): Promise<QuickActionsResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/dashboard/quick-actions`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorData = (await response.json()) as ApiError;
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (parseError) {
        errorMessage = response.statusText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const data = (await response.json()) as QuickActionsResponse;
    return data;
  }
}

/**
 * Create a dashboard API client instance
 */
export const createDashboardApiClient = (baseUrl: string = "") => {
  return new DashboardApiClient(baseUrl);
};

/**
 * Default dashboard API client instance
 */
export const dashboardApi = new DashboardApiClient();

/**
 * Convenience functions for direct use
 */

/**
 * Fetch dashboard statistics with authentication
 */
export const fetchDashboardStats = async (
  accessToken: string
): Promise<DashboardStats> => {
  return dashboardApi.getDashboardStats(accessToken);
};

/**
 * Fetch detailed dashboard statistics with optional filters
 */
export const fetchDashboardStatsDetailed = async (
  accessToken: string,
  month?: number,
  year?: number
): Promise<DashboardStatsDetailed> => {
  return dashboardApi.getDashboardStatsDetailed(accessToken, month, year);
};

/**
 * Fetch recent activities for the dashboard
 */
export const fetchRecentActivities = async (
  accessToken: string,
  limit?: number
): Promise<RecentActivitiesResponse> => {
  return dashboardApi.getRecentActivities(accessToken, limit);
};

/**
 * Fetch quick actions with dynamic data
 */
export const fetchQuickActions = async (
  accessToken: string
): Promise<QuickActionsResponse> => {
  return dashboardApi.getQuickActions(accessToken);
};

/**
 * Hook-friendly error type
 */
export interface DashboardApiError extends Error {
  status?: number;
  response?: Response;
}
