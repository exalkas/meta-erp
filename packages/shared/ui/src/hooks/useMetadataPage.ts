import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "../contexts/TranslationContext";
import { useTheme } from "../contexts/ThemeContext";
import { API_ENDPOINTS, buildApiUrl } from "../config/api";

export interface UseMetadataPageOptions {
  pageRoute: string;
  tenantId: string;
}

export interface UseMetadataPageResult {
  pageDefinition: any | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage metadata-driven page definitions.
 * Automatically refetches when language or theme changes.
 */
export const useMetadataPage = ({
  pageRoute,
  tenantId,
}: UseMetadataPageOptions): UseMetadataPageResult => {
  const { language } = useTranslation();
  const { theme } = useTheme();
  const [pageDefinition, setPageDefinition] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPageDefinition = useCallback(async () => {
    // Validate required parameters
    if (!pageRoute) {
      throw new Error("pageRoute is required");
    }
    if (!tenantId || tenantId === "undefined" || tenantId === "null") {
      throw new Error("Valid tenantId is required");
    }

    setLoading(true);
    setError(null);

    try {
      console.log(
        `📐 Fetching ${pageRoute} page definition from metadata API`,
        { language, theme, tenantId }
      );

      // Build API URL with query parameters using the centralized config
      const url = buildApiUrl(API_ENDPOINTS.pages(pageRoute), {
        tenant_id: tenantId,
        language,
        theme,
      });

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${pageRoute} page definition: ${response.status} ${response.statusText}`
        );
      }

      const pageData = await response.json();
      console.log(
        `✅ ${pageRoute} page definition loaded:`,
        pageData.page_name || pageData
      );

      setPageDefinition(pageData);
    } catch (err) {
      console.error(`❌ Failed to fetch ${pageRoute} page definition:`, err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [pageRoute, tenantId, language, theme]);

  // Fetch on mount and when dependencies change (language, theme, etc.)
  useEffect(() => {
    fetchPageDefinition();
  }, [fetchPageDefinition]);

  return {
    pageDefinition,
    loading,
    error,
    refetch: fetchPageDefinition,
  };
};
