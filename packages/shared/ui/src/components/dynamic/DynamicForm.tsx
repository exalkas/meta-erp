/**
 * Dynamic Form Component - Metadata-Driven Platform
 *
 * Renders forms dynamically from EntityDefinition and FieldDefinition metadata.
 * Integrates with existing LoginForm for authentication.
 */

import React from "react";
import { LoginForm } from "../auth/LoginForm";
import { AppName } from "../../types";

interface DynamicFormProps {
  entity: string;
  layout: string;
  submitLabelKey: string;
  tenantId?: string;
  onSubmit?: (data: any) => void | Promise<void>;
  onError?: (error: Error) => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  entity,
  layout,
  submitLabelKey,
  tenantId,
  onSubmit,
  onError,
}) => {
  // Handle login form submission
  const handleLogin = async (data: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => {
    try {
      if (onSubmit) {
        const result = onSubmit(data);
        // Handle both sync and async onSubmit functions
        if (result instanceof Promise) {
          await result;
        }
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
    }
  };

  // For now, handle LoginForm specifically
  // TODO: Expand to handle other entities from metadata
  if (entity === "LoginForm") {
    return (
      <LoginForm
        app={AppName.CLIENT}
        onLogin={handleLogin}
        isLoading={false}
        error={undefined}
        language="en"
      />
    );
  }

  // Placeholder for other entity types
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-yellow-800">
      Dynamic form for entity "{entity}" not yet implemented
    </div>
  );
};

export default DynamicForm;
