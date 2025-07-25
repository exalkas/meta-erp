"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showDetails: boolean;
  errorId?: string;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  showDetails?: boolean;
  enableReporting?: boolean;
  className?: string;
}

export interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  resetError: () => void;
  hasError: boolean;
  showDetails?: boolean;
  onToggleDetails?: () => void;
  errorId?: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetKeys: Array<string | number>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      showDetails: false,
    };
    this.resetKeys = props.resetKeys || [];
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Call the error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error Boundary caught an error:", error);
      console.error("Error Info:", errorInfo);
    }

    // Report to error tracking service if enabled
    if (this.props.enableReporting) {
      this.reportError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys = [], resetOnPropsChange = false } = this.props;

    if (this.state.hasError && resetOnPropsChange) {
      // Reset if any prop changed
      if (
        Object.keys(prevProps).some(
          (key) => (prevProps as any)[key] !== (this.props as any)[key]
        )
      ) {
        this.resetError();
      }
    }

    if (this.state.hasError && resetKeys.length > 0) {
      // Reset if any reset key changed
      if (
        resetKeys.some(
          (key, index) => key !== (prevProps.resetKeys || [])[index]
        )
      ) {
        this.resetError();
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      showDetails: false,
      errorId: undefined,
    });
  };

  toggleDetails = () => {
    this.setState((prev) => ({
      showDetails: !prev.showDetails,
    }));
  };

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // This is where you would integrate with your error reporting service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    try {
      // Example implementation
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        errorId: this.state.errorId,
      };

      // Send to your error reporting service
      console.log("Error Report:", errorReport);
    } catch (reportingError) {
      console.error("Failed to report error:", reportingError);
    }
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <div className={this.props.className}>
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
            hasError={this.state.hasError}
            showDetails={this.state.showDetails}
            onToggleDetails={this.toggleDetails}
            errorId={this.state.errorId}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  showDetails,
  onToggleDetails,
  errorId,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200 p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Something went wrong
        </h3>

        <p className="text-sm text-gray-500 mb-6">
          An unexpected error occurred. Please try refreshing the page or
          contact support if the problem persists.
        </p>

        {errorId && (
          <p className="text-xs text-gray-400 mb-4">Error ID: {errorId}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </button>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Reload page
          </button>
        </div>

        {(isDevelopment || showDetails !== undefined) && (
          <div className="mt-6 text-left">
            <button
              onClick={onToggleDetails}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Show details
                </>
              )}
            </button>

            {showDetails && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md text-xs">
                <div className="space-y-3">
                  {error && (
                    <div>
                      <h4 className="font-medium text-gray-900">Error:</h4>
                      <pre className="mt-1 text-red-600 whitespace-pre-wrap">
                        {error.message}
                      </pre>
                    </div>
                  )}

                  {error?.stack && (
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Stack trace:
                      </h4>
                      <pre className="mt-1 text-gray-600 whitespace-pre-wrap text-xs overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Component stack:
                      </h4>
                      <pre className="mt-1 text-gray-600 whitespace-pre-wrap text-xs overflow-auto max-h-40">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) => {
  return (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
