import { useState, useCallback, useMemo, useEffect } from "react";

export interface FormField<T = any> {
  value: T;
  error?: string;
  touched?: boolean;
  dirty?: boolean;
  validating?: boolean;
  initialValue?: T;
}

export interface ValidationRule<T = any> {
  required?: boolean;
  pattern?: RegExp;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  custom?: (value: T) => Promise<string | null> | string | null;
  message?: string;
  // Greek-specific validations
  afm?: boolean;
  greekPhone?: boolean;
  greekPostalCode?: boolean;
  doy?: boolean;
  iban?: boolean;
}

export interface FormConfig<T extends Record<string, any>> {
  initialValues: T;
  validation?: { [K in keyof T]?: ValidationRule<T[K]> };
  onSubmit?: (values: T) => Promise<void> | void;
  onReset?: () => void;
  onChange?: (values: T) => void;
  // Greek ERP features
  autoSave?: boolean;
  auditLog?: boolean;
  companyId?: string;
  userId?: string;
  personalDataFields?: (keyof T)[];
}

export interface FormState<T extends Record<string, any>> {
  values: T;
  fields: { [K in keyof T]: FormField<T[K]> };
  errors: { [K in keyof T]?: string };
  touched: { [K in keyof T]?: boolean };
  dirty: { [K in keyof T]?: boolean };

  // Form-level state
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitCount: number;
  lastSubmitTime?: Date;

  // Greek ERP specific
  complianceStatus?: "compliant" | "pending" | "violation";
  auditTrail?: Array<{
    timestamp: Date;
    action: string;
    field?: string;
    value?: any;
    userId?: string;
  }>;
}

export interface FormActions<T extends Record<string, any>> {
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: <K extends keyof T>(field: K, error: string) => void;
  setErrors: (errors: Partial<{ [K in keyof T]: string }>) => void;
  setTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  clearErrors: () => void;
  reset: () => void;
  submit: () => Promise<void>;
  validate: () => Promise<boolean>;
  validateField: <K extends keyof T>(field: K) => Promise<string | null>;

  // Greek ERP specific actions
  auditAction: (action: string, field?: keyof T, value?: any) => void;
  checkCompliance: () => Promise<"compliant" | "pending" | "violation">;
}

export const useForm = <T extends Record<string, any>>(
  config: FormConfig<T>
): FormState<T> & FormActions<T> => {
  const [formState, setFormState] = useState<FormState<T>>(() => {
    const initialFields: { [K in keyof T]: FormField<T[K]> } = {} as any;

    Object.keys(config.initialValues).forEach((key) => {
      const k = key as keyof T;
      initialFields[k] = {
        value: config.initialValues[k],
        initialValue: config.initialValues[k],
        touched: false,
        dirty: false,
        validating: false,
      };
    });

    return {
      values: { ...config.initialValues },
      fields: initialFields,
      errors: {},
      touched: {},
      dirty: {},
      isSubmitting: false,
      isValidating: false,
      isValid: true,
      isDirty: false,
      submitCount: 0,
      complianceStatus: "compliant",
      auditTrail: [],
    };
  });

  // Greek validation helpers
  const validateGreekField = useCallback(
    (field: keyof T, value: any, rule: ValidationRule): string | null => {
      if (rule.afm && typeof value === "string") {
        const afmRegex = /^\d{9}$/;
        if (!afmRegex.test(value.replace(/\s/g, ""))) {
          return "Invalid Greek AFM format";
        }
      }

      if (rule.greekPhone && typeof value === "string") {
        const phoneRegex = /^(\+30|0030)?[2-9]\d{9}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))) {
          return "Invalid Greek phone number";
        }
      }

      if (rule.greekPostalCode && typeof value === "string") {
        const postalRegex = /^\d{5}$/;
        if (!postalRegex.test(value.replace(/\s/g, ""))) {
          return "Invalid Greek postal code";
        }
      }

      if (rule.doy && typeof value === "string") {
        const doyRegex = /^\d{4}$/;
        if (!doyRegex.test(value.replace(/\s/g, ""))) {
          return "Invalid DOY code";
        }
      }

      if (rule.iban && typeof value === "string") {
        const ibanRegex = /^GR\d{25}$/;
        if (!ibanRegex.test(value.replace(/\s/g, "").toUpperCase())) {
          return "Invalid Greek IBAN";
        }
      }

      return null;
    },
    []
  );

  // Validation function
  const validateField = useCallback(
    async <K extends keyof T>(field: K): Promise<string | null> => {
      const value = formState.values[field];
      const rule = config.validation?.[field];

      if (!rule) return null;

      // Required validation
      if (
        rule.required &&
        (value === undefined || value === null || value === "")
      ) {
        return rule.message || "This field is required";
      }

      // Skip other validations if value is empty and not required
      if (value === undefined || value === null || value === "") {
        return null;
      }

      // Pattern validation
      if (
        rule.pattern &&
        typeof value === "string" &&
        !rule.pattern.test(value)
      ) {
        return rule.message || "Invalid format";
      }

      // Number validations
      if (typeof value === "number") {
        if (rule.min !== undefined && value < rule.min) {
          return rule.message || `Minimum value is ${rule.min}`;
        }
        if (rule.max !== undefined && value > rule.max) {
          return rule.message || `Maximum value is ${rule.max}`;
        }
      }

      // String length validations
      if (typeof value === "string") {
        if (rule.minLength !== undefined && value.length < rule.minLength) {
          return rule.message || `Minimum length is ${rule.minLength}`;
        }
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
          return rule.message || `Maximum length is ${rule.maxLength}`;
        }
      }

      // Greek-specific validations
      const greekError = validateGreekField(field, value, rule);
      if (greekError) {
        return greekError;
      }

      // Custom validation
      if (rule.custom) {
        try {
          const customResult = await rule.custom(value);
          if (customResult) {
            return customResult;
          }
        } catch (error) {
          return "Validation error occurred";
        }
      }

      return null;
    },
    [formState.values, config.validation, validateGreekField]
  );

  // Actions
  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setFormState((prev) => {
        const newValues = { ...prev.values, [field]: value };
        const isDirty = value !== prev.fields[field].initialValue;

        // Audit logging for Greek compliance
        if (config.auditLog) {
          const auditEntry = {
            timestamp: new Date(),
            action: "field_change",
            field: field as string,
            value: config.personalDataFields?.includes(field)
              ? "[REDACTED]"
              : value,
            userId: config.userId,
          };

          prev.auditTrail?.push(auditEntry);
        }

        return {
          ...prev,
          values: newValues,
          fields: {
            ...prev.fields,
            [field]: {
              ...prev.fields[field],
              value,
              dirty: isDirty,
            },
          },
          dirty: { ...prev.dirty, [field]: isDirty },
          isDirty: Object.values({ ...prev.dirty, [field]: isDirty }).some(
            Boolean
          ),
        };
      });

      // Trigger onChange callback
      config.onChange?.(formState.values);
    },
    [config, formState.values]
  );

  const setValues = useCallback(
    (values: Partial<T>) => {
      Object.entries(values).forEach(([field, value]) => {
        setValue(field as keyof T, value);
      });
    },
    [setValue]
  );

  const setError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setFormState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
      fields: {
        ...prev.fields,
        [field]: { ...prev.fields[field], error },
      },
    }));
  }, []);

  const setErrors = useCallback(
    (errors: Partial<{ [K in keyof T]: string }>) => {
      setFormState((prev) => ({
        ...prev,
        errors: { ...prev.errors, ...errors },
      }));
    },
    []
  );

  const setTouched = useCallback(
    <K extends keyof T>(field: K, touched = true) => {
      setFormState((prev) => ({
        ...prev,
        touched: { ...prev.touched, [field]: touched },
        fields: {
          ...prev.fields,
          [field]: { ...prev.fields[field], touched },
        },
      }));
    },
    []
  );

  const clearErrors = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      errors: {},
      fields: Object.fromEntries(
        Object.entries(prev.fields).map(([key, field]) => [
          key,
          { ...field, error: undefined },
        ])
      ) as { [K in keyof T]: FormField<T[K]> },
    }));
  }, []);

  const reset = useCallback(() => {
    setFormState((prev) => {
      const resetFields: { [K in keyof T]: FormField<T[K]> } = {} as any;

      Object.keys(config.initialValues).forEach((key) => {
        const k = key as keyof T;
        resetFields[k] = {
          value: config.initialValues[k],
          initialValue: config.initialValues[k],
          touched: false,
          dirty: false,
          validating: false,
        };
      });

      return {
        ...prev,
        values: { ...config.initialValues },
        fields: resetFields,
        errors: {},
        touched: {},
        dirty: {},
        isDirty: false,
        isValid: true,
      };
    });

    config.onReset?.();
  }, [config]);

  const validate = useCallback(async (): Promise<boolean> => {
    setFormState((prev) => ({ ...prev, isValidating: true }));

    const errors: { [K in keyof T]?: string } = {};
    let isValid = true;

    // Validate all fields
    for (const field of Object.keys(formState.values) as (keyof T)[]) {
      const error = await validateField(field);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    }

    setFormState((prev) => ({
      ...prev,
      errors,
      isValid,
      isValidating: false,
    }));

    return isValid;
  }, [formState.values, validateField]);

  const submit = useCallback(async () => {
    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const isValid = await validate();

      if (isValid) {
        await config.onSubmit?.(formState.values);

        setFormState((prev) => ({
          ...prev,
          submitCount: prev.submitCount + 1,
          lastSubmitTime: new Date(),
        }));
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [config, formState.values, validate]);

  const auditAction = useCallback(
    (action: string, field?: keyof T, value?: any) => {
      if (config.auditLog) {
        setFormState((prev) => ({
          ...prev,
          auditTrail: [
            ...(prev.auditTrail || []),
            {
              timestamp: new Date(),
              action,
              field: field as string,
              value: config.personalDataFields?.includes(field as keyof T)
                ? "[REDACTED]"
                : value,
              userId: config.userId,
            },
          ],
        }));
      }
    },
    [config]
  );

  const checkCompliance = useCallback(async (): Promise<
    "compliant" | "pending" | "violation"
  > => {
    // Simple compliance check - can be enhanced
    const hasPersonalData = config.personalDataFields?.some(
      (field) =>
        formState.values[field] !== undefined &&
        formState.values[field] !== null
    );

    if (hasPersonalData && !config.auditLog) {
      return "violation";
    }

    return "compliant";
  }, [config, formState.values]);

  // Auto-save functionality
  useEffect(() => {
    if (config.autoSave && formState.isDirty) {
      const timeoutId = setTimeout(() => {
        // Save to localStorage or call API
        localStorage.setItem(
          `form_autosave_${config.companyId}_${config.userId}`,
          JSON.stringify(formState.values)
        );
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [config, formState.values, formState.isDirty]);

  return {
    ...formState,
    setValue,
    setValues,
    setError,
    setErrors,
    setTouched,
    clearErrors,
    reset,
    submit,
    validate,
    validateField,
    auditAction,
    checkCompliance,
  };
};
