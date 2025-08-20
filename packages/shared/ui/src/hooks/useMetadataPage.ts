import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "../contexts/TranslationContext";
import { useTheme } from "../contexts/ThemeContext";

export interface UseMetadataPageOptions {
  pageRoute: string;
  tenantId: string;
  enabled?: boolean;
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
  enabled = true,
}: UseMetadataPageOptions): UseMetadataPageResult => {
  const { language } = useTranslation();
  const { theme } = useTheme();
  const [pageDefinition, setPageDefinition] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPageDefinition = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      console.log(
        `📐 Fetching ${pageRoute} page definition from metadata API`,
        { language, theme, tenantId }
      );

      // Build API URL with language and theme parameters
      const url = new URL(`http://localhost:8000/metadata/pages/${pageRoute}`);

      // Only set tenant_id if it's a valid value (not undefined, null, or "undefined")
      if (tenantId && tenantId !== "undefined" && tenantId !== "null") {
        url.searchParams.set("tenant_id", tenantId);
      }

      if (language) {
        url.searchParams.set("language", language);
      }
      if (theme) {
        url.searchParams.set("theme", theme);
      }

      const response = await fetch(url.toString());

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
  }, [pageRoute, tenantId, language, theme, enabled]);

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
