import React, { forwardRef, useState } from "react";
import { Input, InputProps } from "../ui/Input";
import { useTranslation } from "../../contexts/TranslationContext";
import { useGreekLocalization } from "../../hooks/useGreekLocalization";
import { validateAFM } from "../../utils/greekValidation";
import { formatAFM } from "../../utils/formatters";

export interface AFMInputProps extends Omit<InputProps, "validation" | "type"> {
  validateCompanyAFM?: boolean; // Different validation for companies vs individuals
  showFormatting?: boolean;
  onValidChange?: (isValid: boolean, afm: string) => void;
}

export const AFMInput = forwardRef<HTMLInputElement, AFMInputProps>(
  (
    {
      validateCompanyAFM = false,
      showFormatting = true,
      onValidChange,
      onChange,
      onBlur,
      value,
      placeholder,
      helperText,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    const { validateAFM: validateGreekAFM } = useGreekLocalization();
    const [formattedValue, setFormattedValue] = useState<string>("");
    const [isValid, setIsValid] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Remove non-digit characters
      const cleanValue = inputValue.replace(/\D/g, "");

      // Limit to 9 digits
      if (cleanValue.length > 9) return;

      // Format for display if enabled
      let displayValue = cleanValue;
      if (showFormatting && cleanValue.length === 9) {
        displayValue = formatAFM(cleanValue);
      }

      setFormattedValue(displayValue);

      // Create new event with clean value
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          value: cleanValue,
        },
      };

      onChange?.(newEvent);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      if (inputValue) {
        const validation = validateAFM(inputValue);
        setIsValid(validation.isValid);

        if (validation.isValid && validation.formatted) {
          setFormattedValue(
            showFormatting
              ? formatAFM(validation.formatted)
              : validation.formatted
          );
        }

        onValidChange?.(validation.isValid, validation.formatted || inputValue);
      } else {
        setIsValid(false);
        onValidChange?.(false, "");
      }

      onBlur?.(e);
    };

    const getHelperText = () => {
      if (helperText) return helperText;

      if (validateCompanyAFM) {
        return t("afm_company_helper", { ns: "greek" });
      }

      return t("afm_individual_helper", { ns: "greek" });
    };

    const getPlaceholder = () => {
      if (placeholder) return placeholder;

      if (showFormatting) {
        return "123 456 789";
      }

      return "123456789";
    };

    // Show validation success when AFM is valid
    const showValidationIcon = true;
    const hasValidValue =
      value && typeof value === "string" && value.length === 9;

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={showFormatting ? 11 : 9} // Account for spaces in formatting
        placeholder={getPlaceholder()}
        helperText={getHelperText()}
        validation="afm"
        validateOnBlur={true}
        showValidationIcon={showValidationIcon}
        leftIcon={
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
        value={formattedValue || value}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);

AFMInput.displayName = "AFMInput";

export default AFMInput;
