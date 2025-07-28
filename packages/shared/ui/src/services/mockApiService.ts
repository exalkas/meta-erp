/**
 * Mock API Service - Intercepts API calls and returns mock data
 *
 * This service intercepts all API calls to /api/metadata/* and /api/auth/*
 * and returns mock data from the MockDataService instead of hitting the real backend.
 */

import {
  MockPageEngine,
  MockDataEngine,
  MockComponentEngine,
  MockAuthService,
  MockLayoutEngine,
  MockTranslationEngine,
  MockThemeEngine,
} from "./mockDataService";

// Flag to enable/disable mock mode
let MOCK_MODE_ENABLED = true;

// Enable/disable mock mode
export const setMockMode = (enabled: boolean) => {
  MOCK_MODE_ENABLED = enabled;
  console.log(`🎭 Mock API Mode: ${enabled ? "ENABLED" : "DISABLED"}`);
};

export const isMockMode = () => MOCK_MODE_ENABLED;

// Mock API Response type
interface MockApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

// Store original fetch
const originalFetch = globalThis.fetch;

// Helper function to create mock Response
const createMockResponse = <T>(data: T, status: number = 200): Response => {
  const responseData = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    json: async () => data,
    text: async () => JSON.stringify(data),
    clone: function () {
      return this;
    },
  };

  return responseData as Response;
};

// Enhanced fetch interceptor
const mockFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  if (!MOCK_MODE_ENABLED) {
    console.log(`🔄 Mock disabled, using original fetch for: ${input}`);
    return originalFetch(input, init);
  }

  const url = typeof input === "string" ? input : input.toString();
  const method = init?.method || "GET";

  console.log(`🔍 Mock API intercepting: ${url}`);

  // Only intercept our API calls
  if (!url.includes("/api/metadata/") && !url.includes("/api/auth/")) {
    console.log(`🔄 Not an API call, using original fetch: ${url}`);
    return originalFetch(input, init);
  }

  console.log(`✅ API call detected, processing with mock: ${url}`);

  try {
    // Mock Page Engine endpoints - SPECIFIC LOGIN CHECK FIRST
    if (url.includes("/api/metadata/pages/login")) {
      console.log("🎯 LOGIN PAGE REQUEST DETECTED - Using mock data");
      const pageDefinition = await MockPageEngine.getPageDefinition("/login");
      if (pageDefinition) {
        console.log(
          "✅ Returning mock login page definition:",
          pageDefinition.page_name,
          pageDefinition.page_id
        );
        return createMockResponse(pageDefinition, 200);
      } else {
        console.log("❌ No mock login page definition found");
        return createMockResponse({ message: `Login page not found` }, 404);
      }
    }

    // Mock Page Engine endpoints
    if (url.includes("/api/metadata/pages/")) {
      const pathMatch = url.match(/\/api\/metadata\/pages\/(.+)$/);
      if (pathMatch) {
        const pagePath = `/${pathMatch[1]}`;
        console.log(`🎭 MockPageEngine.getPageDefinition(${pagePath})`);

        const pageDefinition = await MockPageEngine.getPageDefinition(pagePath);
        if (pageDefinition) {
          console.log(
            `✅ Found page: ${pageDefinition.page_name} (${pageDefinition.page_id})`
          );
          return createMockResponse(pageDefinition, 200);
        } else {
          console.log(`❌ Page not found: ${pagePath}`);
          return createMockResponse(
            { message: `Page not found: ${pagePath}` },
            404
          );
        }
      }
    }

    // Mock Data Engine endpoints
    if (url.includes("/api/metadata/entities/")) {
      const pathMatch = url.match(/\/api\/metadata\/entities\/(.+)$/);
      if (pathMatch) {
        const entityId = pathMatch[1];
        console.log(`🎭 MockDataEngine.getEntityDefinition(${entityId})`);

        const entityDef = await MockDataEngine.getEntityDefinition(entityId);
        if (entityDef) {
          return createMockResponse(entityDef, 200);
        } else {
          return createMockResponse(
            { message: `Entity not found: ${entityId}` },
            404
          );
        }
      }
    }

    // Mock list views
    if (url.includes("/api/metadata/list-views/")) {
      const pathMatch = url.match(/\/api\/metadata\/list-views\/(.+)$/);
      if (pathMatch) {
        const listViewId = pathMatch[1];
        console.log(`🎭 MockDataEngine.getListViewDefinition(${listViewId})`);

        const listViewDef = await MockDataEngine.getListViewDefinition(
          "contacts",
          "all_contacts"
        );
        if (listViewDef) {
          return createMockResponse(listViewDef, 200);
        } else {
          return createMockResponse(
            { message: `List view not found: ${listViewId}` },
            404
          );
        }
      }
    }

    // Mock data endpoints
    if (url.includes("/api/data/")) {
      const pathMatch = url.match(/\/api\/data\/(.+)$/);
      if (pathMatch) {
        const entityId = pathMatch[1];
        console.log(`🎭 MockDataEngine.getEntityData(${entityId})`);

        const data = await MockDataEngine.getEntityData(entityId);
        return createMockResponse(data, 200);
      }
    }

    // Mock Component Engine endpoints
    if (url.includes("/api/metadata/components/")) {
      const pathMatch = url.match(/\/api\/metadata\/components\/(.+)$/);
      if (pathMatch) {
        const componentId = pathMatch[1];
        console.log(
          `🎭 MockComponentEngine.getComponentDefinition(${componentId})`
        );

        const componentDef =
          await MockComponentEngine.getComponentDefinition(componentId);
        if (componentDef) {
          return createMockResponse(componentDef, 200);
        } else {
          return createMockResponse(
            { message: `Component not found: ${componentId}` },
            404
          );
        }
      }
    }

    // Mock Layout Engine endpoints
    if (url.includes("/api/metadata/layouts")) {
      if (url.match(/\/api\/metadata\/layouts\/([^\/\?]+)$/)) {
        // Get specific layout
        const pathMatch = url.match(/\/api\/metadata\/layouts\/([^\/\?]+)$/);
        if (pathMatch) {
          const layoutId = pathMatch[1];
          console.log(`🏗️ MockLayoutEngine.getLayout(${layoutId})`);

          const layout = await MockLayoutEngine.getLayout(layoutId);
          if (layout) {
            return createMockResponse(layout, 200);
          } else {
            return createMockResponse(
              { message: `Layout not found: ${layoutId}` },
              404
            );
          }
        }
      } else if (url.includes("/api/metadata/layouts")) {
        if (url.match(/\/api\/metadata\/layouts\/([^\/\?]+)(\?.*)?$/)) {
          // Get specific layout
          const pathMatch = url.match(
            /\/api\/metadata\/layouts\/([^\/\?]+)(\?.*)?$/
          );
          if (pathMatch) {
            const layoutId = pathMatch[1];
            console.log(`🏗️ MockLayoutEngine.getLayout(${layoutId})`);

            const layout = await MockLayoutEngine.getLayout(layoutId);
            if (layout) {
              return createMockResponse(layout, 200);
            } else {
              return createMockResponse(
                { message: `Layout not found: ${layoutId}` },
                404
              );
            }
          }
        } else {
          // Get all layouts
          console.log(`🏗️ MockLayoutEngine.getLayouts()`);
          const layouts = await MockLayoutEngine.getLayouts();
          return createMockResponse(layouts, 200);
        }
      }
    }

    // Mock Translation Engine endpoints
    if (url.includes("/api/metadata/translations/")) {
      console.log(`🌐 Translation endpoint detected: ${url}`);
      const pathMatch = url.match(
        /\/api\/metadata\/translations\/([^\/\?]+)(\?.*)?$/
      );
      console.log(`🌐 Translation regex match result:`, pathMatch);
      if (pathMatch) {
        const locale = pathMatch[1];
        console.log(`🌐 MockTranslationEngine.getTranslations(${locale})`);

        const translations =
          await MockTranslationEngine.getTranslations(locale);
        console.log(`🌐 Translation result:`, translations);
        return createMockResponse(translations, 200);
      } else {
        console.log(`❌ Translation URL pattern did not match: ${url}`);
        return createMockResponse(
          { message: `Invalid translation URL pattern: ${url}` },
          404
        );
      }
    }

    // Mock Theme Engine endpoints
    if (url.includes("/api/metadata/themes")) {
      if (url.match(/\/api\/metadata\/themes\/([^\/\?]+)\/css(\?.*)?$/)) {
        // Get theme CSS
        const pathMatch = url.match(
          /\/api\/metadata\/themes\/([^\/\?]+)\/css(\?.*)?$/
        );
        if (pathMatch) {
          const themeId = pathMatch[1];
          console.log(`🎨 MockThemeEngine.getThemeCSS(${themeId})`);

          const css = await MockThemeEngine.getThemeCSS(themeId);
          return createMockResponse(css, 200);
        }
      } else if (url.match(/\/api\/metadata\/themes\/([^\/\?]+)(\?.*)?$/)) {
        // Get specific theme
        const pathMatch = url.match(
          /\/api\/metadata\/themes\/([^\/\?]+)(\?.*)?$/
        );
        if (pathMatch) {
          const themeId = pathMatch[1];
          console.log(`🎨 MockThemeEngine.getTheme(${themeId})`);

          const theme = await MockThemeEngine.getTheme(themeId);
          if (theme) {
            return createMockResponse(theme, 200);
          } else {
            return createMockResponse(
              { message: `Theme not found: ${themeId}` },
              404
            );
          }
        }
      } else {
        // Get all themes
        console.log(`🎨 MockThemeEngine.getThemes()`);
        const themes = await MockThemeEngine.getThemes();
        return createMockResponse(themes, 200);
      }
    }

    // Mock Auth endpoints
    if (url.includes("/api/auth/login") && method === "POST") {
      console.log("🎭 MockAuthService.authenticate()");
      const body = init?.body ? JSON.parse(init.body as string) : {};
      const authResult = await MockAuthService.authenticate(
        body.email,
        body.password
      );

      if (authResult) {
        return createMockResponse(
          {
            success: true,
            access_token: authResult.accessToken,
            refresh_token: authResult.refreshToken,
            user: authResult.user,
          },
          200
        );
      } else {
        return createMockResponse(
          {
            success: false,
            message: "Invalid credentials",
          },
          401
        );
      }
    }

    if (url.includes("/api/auth/logout") && method === "POST") {
      console.log("🎭 MockAuthService logout (simulated)");
      return createMockResponse(
        { success: true, message: "Logged out successfully" },
        200
      );
    }

    // If no match found, return 404
    console.log(`❌ No mock handler found for: ${method} ${url}`);
    return createMockResponse(
      { message: `Mock endpoint not found: ${method} ${url}` },
      404
    );
  } catch (error) {
    console.error("❌ Mock API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return createMockResponse(
      { message: "Internal mock API error", error: errorMessage },
      500
    );
  }
};

// Set up the fetch override
export const setupMockFetch = () => {
  if (typeof globalThis !== "undefined") {
    globalThis.fetch = mockFetch;
    console.log("🎭 Mock fetch interceptor installed globally");
  }
  if (typeof window !== "undefined") {
    window.fetch = mockFetch;
    console.log("🎭 Mock fetch interceptor installed on window");
  }
};

// Restore original fetch
export const restoreOriginalFetch = () => {
  if (typeof globalThis !== "undefined") {
    globalThis.fetch = originalFetch;
  }
  if (typeof window !== "undefined") {
    window.fetch = originalFetch;
  }
  console.log("🔄 Original fetch restored");
};

// Mock axios interceptors (if using axios)
export const setupAxiosInterceptors = () => {
  // This would be implemented if the frontend uses axios instead of fetch
  console.log("📡 Axios interceptors would be set up here if needed");
};

// Initialize mock API service
export const initializeMockApi = (enabled: boolean = true) => {
  setMockMode(enabled);

  if (enabled) {
    setupMockFetch();
    console.log("🎭 Mock API Service initialized");
    console.log(
      "📡 All API calls to /api/metadata/* and /api/auth/* will be mocked"
    );
    console.log("🔧 Use setMockMode(false) to disable mock mode");
  } else {
    restoreOriginalFetch();
  }
};

// Initialize immediately when module loads
if (typeof window !== "undefined") {
  console.log("🎭 Auto-initializing mock API service");
  initializeMockApi(true);
}

// Export for use in other modules
export default {
  setMockMode,
  isMockMode,
  initializeMockApi,
  restoreOriginalFetch,
  setupAxiosInterceptors,
  setupMockFetch,
};
