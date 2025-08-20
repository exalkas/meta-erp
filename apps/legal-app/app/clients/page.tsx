"use client";

import { useEffect, useState } from "react";
import {
  DynamicPage,
  useMetadataPage,
  useAuth,
  TranslationProvider,
  ThemeProvider,
} from "@erp/shared-ui";
import { useRouter } from "next/navigation";

// Internal component that uses the providers
function LegalClientsPageContent({
  tenantId,
  userId,
}: {
  tenantId: string;
  userId: string;
}) {
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use metadata page hook that handles language/theme changes
  const { pageDefinition, loading, error } = useMetadataPage({
    pageRoute: "clients",
    tenantId,
  });

  // Don't render anything on server side
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Clients Page
          </h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!pageDefinition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-yellow-600 mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-600">
            Clients page definition not found in metadata.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DynamicPage
      pageDefinition={pageDefinition}
      tenantId={tenantId}
      contextProps={{}}
    />
  );
}

// Main exported component that sets up providers
export default function ClientsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle authentication
  useEffect(() => {
    if (isClient && !authLoading && !user) {
      router.push("/login");
    }
  }, [isClient, user, authLoading, router]);

  // Don't render anything on server side
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  // Get tenant_id and user_id from authenticated user - NO FALLBACKS
  if (!user?.tenant_id || !user?.user_id) {
    console.error("❌ No tenant_id or user_id in authenticated user:", user);
    router.push("/login");
    return null;
  }

  const tenantId = user.tenant_id;
  const userId = user.user_id;

  return (
    <TranslationProvider
      tenantId={tenantId}
      defaultLanguage="en-US"
      verticalContext="legal"
    >
      <ThemeProvider tenantId={tenantId} userId={userId}>
        <LegalClientsPageContent tenantId={tenantId} userId={userId} />
      </ThemeProvider>
    </TranslationProvider>
  );
}
