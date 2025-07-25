/**
 * Dynamic Component - Metadata-Driven Platform
 *
 * Maps component types from metadata to actual React components.
 * Handles component loading, props validation, and error boundaries.
 */

import React from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import { Alert } from "../ui/Alert";
import { Logo } from "../ui/Logo";
import { LanguageSelector } from "../multilingual/LanguageSelector";
import { ThemeSelector } from "../multilingual/ThemeSelector";
import { SimplePasswordInput } from "../ui/SimplePasswordInput";
import { DynamicForm } from "./DynamicForm";

// Simple PageHeader component for login page
const PageHeader: React.FC<{
  titleKey: string;
  subtitleKey: string;
}> = ({ titleKey, subtitleKey }) => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
        {titleKey} {/* Will be replaced with translation */}
      </h1>
      <p className="text-blue-100">
        {subtitleKey} {/* Will be replaced with translation */}
      </p>
    </div>
  );
};

// Component registry mapping component types to React components
const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  // Form Controls
  Input: Input,
  SimplePasswordInput: SimplePasswordInput,
  Button: Button,
  Checkbox: Checkbox,

  // Display Components
  Alert: Alert,
  Logo: Logo,

  // Navigation Components
  LanguageSelector: LanguageSelector,
  ThemeSelector: ThemeSelector,

  // Complex Components
  Form: DynamicForm,
  PageHeader: PageHeader,
};

interface DynamicComponentProps {
  type: string;
  props: Record<string, any>;
  tenantId?: string;
  onError?: (error: Error) => void;
  children?: React.ReactNode;
}

export const DynamicComponent: React.FC<DynamicComponentProps> = ({
  type,
  props,
  tenantId,
  onError,
  children,
}) => {
  try {
    // Get component from registry
    const Component = COMPONENT_REGISTRY[type];

    if (!Component) {
      const error = new Error(`Component type "${type}" not found in registry`);
      if (onError) {
        onError(error);
      }

      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-yellow-800 text-sm">
          Unknown component: {type}
        </div>
      );
    }

    // Add tenant context to props if needed
    const componentProps = {
      ...props,
      ...(tenantId && { tenantId }),
    };

    // Render component with error boundary
    return (
      <ErrorBoundary onError={onError} componentType={type}>
        <Component {...componentProps}>{children}</Component>
      </ErrorBoundary>
    );
  } catch (error) {
    if (onError) {
      onError(error as Error);
    }

    return (
      <div className="bg-red-50 border border-red-200 rounded p-2 text-red-800 text-sm">
        Error rendering {type}: {(error as Error).message}
      </div>
    );
  }
};

// Error boundary for individual components
class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    onError?: (error: Error) => void;
    componentType: string;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `Error in component ${this.props.componentType}:`,
      error,
      errorInfo
    );

    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded p-2 text-red-800 text-sm">
          Component error in {this.props.componentType}:{" "}
          {this.state.error?.message}
        </div>
      );
    }

    return this.props.children;
  }
}

export default DynamicComponent;
