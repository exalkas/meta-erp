import React, { forwardRef, useState } from "react";
import { Input, InputProps } from "../ui/Input";
import { useTranslation } from "../../contexts/TranslationContext";
import { useGreekLocalization } from "../../hooks/useGreekLocalization";
import { validateGreekPhone } from "../../utils/greekValidation";
import { formatGreekPhone } from "../../utils/formatters";

export interface GreekPhoneInputProps
  extends Omit<InputProps, "validation" | "type"> {
  allowLandline?: boolean;
  allowMobile?: boolean;
  preferredFormat?: "international" | "national";
  onValidChange?: (isValid: boolean, phone: string, isMobile: boolean) => void;
}

export const GreekPhoneInput = forwardRef<
  HTMLInputElement,
  GreekPhoneInputProps
>(
  (
    {
      allowLandline = true,
      allowMobile = true,
      preferredFormat = "international",
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
    const { validatePhone } = useGreekLocalization();
    const [formattedValue, setFormattedValue] = useState<string>("");
    const [isValid, setIsValid] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Remove non-digit characters except + at the beginning
      let cleanValue = inputValue.replace(/[^\d+]/g, "");

      // Ensure + is only at the beginning
      if (cleanValue.includes("+")) {
        const plusIndex = cleanValue.indexOf("+");
        if (plusIndex === 0) {
          cleanValue = "+" + cleanValue.substring(1).replace(/\+/g, "");
        } else {
          cleanValue = cleanValue.replace(/\+/g, "");
        }
      }

      // Limit length based on format
      const maxLength = cleanValue.startsWith("+30")
        ? 13
        : cleanValue.startsWith("+")
        ? 13
        : cleanValue.startsWith("30")
        ? 12
        : 10;

      if (cleanValue.length > maxLength) return;

      setFormattedValue(cleanValue);

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
        const validation = validateGreekPhone(inputValue);
        setIsValid(validation.isValid);

        if (validation.isValid && validation.formatted) {
          const isMobileNumber = validation.formatted.includes("69");
          setIsMobile(isMobileNumber);

          // Check if phone type is allowed
          if (
            (!allowMobile && isMobileNumber) ||
            (!allowLandline && !isMobileNumber)
          ) {
            setIsValid(false);
            onValidChange?.(false, inputValue, isMobileNumber);
            return;
          }

          // Format the phone number
          const formatted = formatGreekPhone(validation.formatted);
          setFormattedValue(formatted);

          onValidChange?.(true, validation.formatted, isMobileNumber);
        } else {
          onValidChange?.(false, inputValue, false);
        }
      } else {
        setIsValid(false);
        onValidChange?.(false, "", false);
      }

      onBlur?.(e);
    };

    const getHelperText = () => {
      if (helperText) return helperText;

      if (allowMobile && allowLandline) {
        return t("greek_phone_helper_all", { ns: "greek" });
      } else if (allowMobile) {
        return t("greek_phone_helper_mobile", { ns: "greek" });
      } else if (allowLandline) {
        return t("greek_phone_helper_landline", { ns: "greek" });
      }

      return t("greek_phone_helper", { ns: "greek" });
    };

    const getPlaceholder = () => {
      if (placeholder) return placeholder;

      if (allowMobile && allowLandline) {
        return "+30 XXX XXX XXXX";
      } else if (allowMobile) {
        return "+30 69X XXX XXXX";
      } else if (allowLandline) {
        return "+30 21X XXX XXXX";
      }

      return "+30 XXX XXX XXXX";
    };

    const getPhoneIcon = () => {
      if (isMobile) {
        return (
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
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      }

      return (
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
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      );
    };

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="tel"
        placeholder={getPlaceholder()}
        helperText={getHelperText()}
        validation="phone"
        validateOnBlur={true}
        showValidationIcon={true}
        leftIcon={getPhoneIcon()}
        value={formattedValue || value}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);

GreekPhoneInput.displayName = "GreekPhoneInput";

export default GreekPhoneInput;
