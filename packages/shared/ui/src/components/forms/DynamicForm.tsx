import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { Input, PasswordInput } from "../ui/Input";
import { AFMInput } from "../greek/AFMInput";
import { GreekPhoneInput } from "../greek/GreekPhoneInput";
import { Button } from "../ui/Button";
import { Form, FormField } from "../ui/Form";
import { Language } from "../../types";
import { FormFieldType } from "../../types/forms";

export interface DynamicFormField {
  id: string;
  type: FormFieldType;
  name: string;
  label: string | Record<Language, string>;
  placeholder?: string | Record<Language, string>;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  options?: Array<
    | string
    | {
        id: string;
        label: string | Record<Language, string>;
        value: string;
      }
  >;
}

export interface DynamicFormSchema {
  id: string;
  title: Record<Language, string>;
  description?: Record<Language, string>;
  fields: DynamicFormField[];
  submitText?: Record<Language, string>;
}

export interface DynamicFormProps {
  schema: DynamicFormSchema;
  values?: Record<string, any>;
  onChange?: (name: string, value: any) => void;
  onSubmit?: (values: Record<string, any>) => void;
  loading?: boolean;
  errors?: Record<string, string>;
  className?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  values = {},
  onChange,
  onSubmit,
  loading = false,
  errors = {},
  className = "",
}) => {
  const { t, language } = useTranslation();

  // Safety check for translation context
  const safeLanguage = language || "en";
  const safeT = t || ((key: string) => key);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(values);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    onChange?.(fieldName, value);
  };

  // Helper function to normalize options
  const normalizeOption = (
    option:
      | string
      | { id: string; label: string | Record<Language, string>; value: string }
  ) => {
    if (typeof option === "string") {
      return {
        id: option,
        label: option, // Keep as-is for now - could be enhanced to use translation keys
        value: option,
      };
    }

    // Handle both translation keys and language objects for option labels
    // Safety check: ensure option.label exists
    if (!option.label) {
      console.warn("🔍 Option missing label:", option);
      return {
        ...option,
        label: option.value || option.id || "Unknown Option",
      };
    }

    const optionLabel =
      typeof option.label === "string"
        ? safeT(option.label)
        : option.label?.[safeLanguage] || option.label?.en || option.value;
    return {
      ...option,
      label: optionLabel,
    };
  };

  const renderField = (field: DynamicFormField) => {
    const fieldValue = values[field.name] || "";
    const fieldError = errors[field.name];

    // Handle translation keys for labels and placeholders
    const fieldLabel =
      typeof field.label === "string"
        ? safeT(field.label)
        : field.label[safeLanguage] || field.label.en || field.name;
    const fieldPlaceholder = field.placeholder
      ? typeof field.placeholder === "string"
        ? safeT(field.placeholder)
        : field.placeholder[safeLanguage] || field.placeholder.en
      : undefined;

    const commonProps = {
      label: fieldLabel,
      required: field.required,
      error: fieldError,
      placeholder: fieldPlaceholder,
      value: fieldValue,
    };

    switch (field.type) {
      case "text":
        return (
          <Input
            {...commonProps}
            type="text"
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      case "email":
        return (
          <Input
            {...commonProps}
            type="email"
            validation="email"
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      case "password":
        return (
          <PasswordInput
            {...commonProps}
            strength={true}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      case "number":
        return (
          <Input
            {...commonProps}
            type="number"
            min={field.validation?.min}
            max={field.validation?.max}
            onChange={(e) =>
              handleFieldChange(field.name, parseFloat(e.target.value) || 0)
            }
          />
        );

      case "tel":
        return (
          <Input
            {...commonProps}
            type="tel"
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      case "textarea":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldLabel}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={fieldValue}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={fieldPlaceholder}
              minLength={field.validation?.minLength}
              maxLength={field.validation?.maxLength}
              className={`
                w-full px-3 py-2 border rounded-md resize-y min-h-20
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${fieldError ? "border-red-500" : "border-gray-300"}
              `}
            />
            {fieldError && (
              <div className="mt-1 text-sm text-red-600">{fieldError}</div>
            )}
          </div>
        );

      case "select":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldLabel}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={fieldValue}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${fieldError ? "border-red-500" : "border-gray-300"}
              `}
            >
              <option value="">{safeT("select_option")}</option>
              {field.options?.map((opt, index) => {
                const option = normalizeOption(opt);
                const label = option.label; // normalizeOption ensures this is always a string
                return (
                  <option
                    key={option.id || `option-${index}`}
                    value={option.value}
                  >
                    {label}
                  </option>
                );
              })}
            </select>
            {fieldError && (
              <div className="mt-1 text-sm text-red-600">{fieldError}</div>
            )}
          </div>
        );

      case "checkbox":
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.id}
              checked={!!fieldValue}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor={field.id} className="ml-2 text-sm text-gray-700">
              {fieldLabel}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {fieldError && (
              <div className="mt-1 text-sm text-red-600">{fieldError}</div>
            )}
          </div>
        );

      case "radio":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {fieldLabel}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((opt, index) => {
                const option = normalizeOption(opt);
                const label = option.label; // normalizeOption ensures this is always a string
                return (
                  <div
                    key={option.id || `radio-${index}`}
                    className="flex items-center"
                  >
                    <input
                      type="radio"
                      id={`${field.id}_${option.id}`}
                      name={field.name}
                      value={option.value}
                      checked={fieldValue === option.value}
                      onChange={(e) =>
                        handleFieldChange(field.name, e.target.value)
                      }
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`${field.id}_${option.id}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {label}
                    </label>
                  </div>
                );
              })}
            </div>
            {fieldError && (
              <div className="mt-1 text-sm text-red-600">{fieldError}</div>
            )}
          </div>
        );

      case "date":
        return (
          <Input
            {...commonProps}
            type="date"
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      case "afm":
        return (
          <AFMInput
            {...commonProps}
            onValidChange={(isValid, afm) => handleFieldChange(field.name, afm)}
          />
        );

      case "greek_phone":
        return (
          <GreekPhoneInput
            {...commonProps}
            onValidChange={(isValid, phone) =>
              handleFieldChange(field.name, phone)
            }
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );
    }
  };

  return (
    <div className={className}>
      <Form onSubmit={handleSubmit} spacing="md">
        {/* Form Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {typeof schema.title === "string"
              ? safeT(schema.title)
              : schema.title?.[safeLanguage] || schema.title?.en || "Form"}
          </h2>
          {schema.description && (
            <p className="mt-2 text-gray-600">
              {typeof schema.description === "string"
                ? safeT(schema.description)
                : schema.description?.[safeLanguage] ||
                  schema.description?.en ||
                  ""}
            </p>
          )}
        </div>

        {/* Form Fields */}
        {schema.fields.map((field) => (
          <FormField
            key={field.id}
            name={field.name}
            label={
              typeof field.label === "string"
                ? field.label
                : field.label[safeLanguage] || field.label.en
            }
            required={field.required}
            error={errors[field.name]}
          >
            {renderField(field)}
          </FormField>
        ))}

        {/* Submit Button */}
        <div className="pt-4">
          <Button type="submit" loading={loading} fullWidth>
            {schema.submitText?.[safeLanguage] ||
              schema.submitText?.en ||
              safeT("submit")}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default DynamicForm;
