"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "../../contexts/TranslationContext";
import { useTheme } from "../../contexts/ThemeContext";

// Accordion Context
interface AccordionContextValue {
  type: "single" | "multiple";
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal";
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion");
  }
  return context;
};

// Item Context
interface AccordionItemContextValue {
  isOpen: boolean;
  isDisabled: boolean;
  toggle: () => void;
  value: string;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(
  null
);

const useAccordionItem = () => {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error(
      "AccordionItem components must be used within an AccordionItem"
    );
  }
  return context;
};

// Main Accordion Component
interface AccordionProps {
  type: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal";
  className?: string;
  children: React.ReactNode;
  "data-testid"?: string;
}

export function Accordion({
  type,
  value,
  defaultValue,
  onValueChange,
  collapsible = true,
  disabled = false,
  orientation = "vertical",
  className = "",
  children,
  "data-testid": testId,
}: AccordionProps) {
  const { theme } = useTheme();
  const [internalValue, setInternalValue] = useState<string | string[]>(() => {
    if (value !== undefined) return value;
    if (defaultValue !== undefined) return defaultValue;
    return type === "multiple" ? [] : "";
  });

  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = (newValue: string | string[]) => {
    if (disabled) return;

    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const baseClasses = [
    "accordion",
    "w-full",
    orientation === "horizontal" ? "flex" : "space-y-1",
    theme === "dark" ? "dark" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <AccordionContext.Provider
      value={{
        type,
        value: currentValue,
        onValueChange: handleValueChange,
        collapsible,
        disabled,
        orientation,
      }}
    >
      <div className={baseClasses} data-testid={testId} role="region">
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// Accordion Item Component
interface AccordionItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  "data-testid"?: string;
}

export function AccordionItem({
  value,
  disabled = false,
  className = "",
  children,
  "data-testid": testId,
}: AccordionItemProps) {
  const accordion = useAccordion();
  const { theme } = useTheme();

  const isDisabled = disabled || accordion.disabled || false;

  const isOpen = (() => {
    if (accordion.type === "multiple") {
      return Array.isArray(accordion.value) && accordion.value.includes(value);
    }
    return accordion.value === value;
  })();

  const toggle = () => {
    if (isDisabled) return;

    if (accordion.type === "multiple") {
      const currentValues = Array.isArray(accordion.value)
        ? accordion.value
        : [];
      const newValues = isOpen
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      accordion.onValueChange?.(newValues);
    } else {
      const newValue = isOpen && accordion.collapsible ? "" : value;
      accordion.onValueChange?.(newValue);
    }
  };

  const baseClasses = [
    "accordion-item",
    "border border-gray-200 dark:border-gray-700 rounded-lg",
    "bg-white dark:bg-gray-800",
    "transition-colors duration-200",
    isDisabled ? "opacity-50 cursor-not-allowed" : "",
    accordion.orientation === "horizontal" ? "flex-1" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <AccordionItemContext.Provider
      value={{
        isOpen,
        isDisabled,
        toggle,
        value,
      }}
    >
      <div className={baseClasses} data-testid={testId}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// Accordion Trigger Component
interface AccordionTriggerProps {
  className?: string;
  children: React.ReactNode;
  "data-testid"?: string;
  iconPosition?: "left" | "right";
  customIcon?: React.ReactNode;
  hideIcon?: boolean;
}

export function AccordionTrigger({
  className = "",
  children,
  "data-testid": testId,
  iconPosition = "right",
  customIcon,
  hideIcon = false,
}: AccordionTriggerProps) {
  const { isOpen, isDisabled, toggle } = useAccordionItem();
  const { theme } = useTheme();

  const baseClasses = [
    "accordion-trigger",
    "flex items-center justify-between w-full",
    "px-4 py-3 text-left",
    "font-medium text-gray-900 dark:text-white",
    "hover:bg-gray-50 dark:hover:bg-gray-700/50",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    "dark:focus:ring-offset-gray-800",
    "transition-colors duration-200",
    "disabled:cursor-not-allowed disabled:opacity-50",
    isDisabled ? "cursor-not-allowed" : "cursor-pointer",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const IconComponent =
    customIcon ||
    (isOpen ? (
      <ChevronDown className="w-4 h-4" />
    ) : (
      <ChevronRight className="w-4 h-4" />
    ));

  const handleClick = () => {
    if (!isDisabled) {
      toggle();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isDisabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <button
      type="button"
      className={baseClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      aria-expanded={isOpen}
      data-testid={testId}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
    >
      {iconPosition === "left" && !hideIcon && (
        <span className="mr-3 transition-transform duration-200">
          {IconComponent}
        </span>
      )}

      <span className="flex-1 text-left">{children}</span>

      {iconPosition === "right" && !hideIcon && (
        <span className="ml-3 transition-transform duration-200">
          {IconComponent}
        </span>
      )}
    </button>
  );
}

// Accordion Content Component
interface AccordionContentProps {
  className?: string;
  children: React.ReactNode;
  "data-testid"?: string;
}

export function AccordionContent({
  className = "",
  children,
  "data-testid": testId,
}: AccordionContentProps) {
  const { isOpen } = useAccordionItem();
  const { theme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);

  useEffect(() => {
    if (contentRef.current) {
      const scrollHeight = contentRef.current.scrollHeight;
      setHeight(isOpen ? scrollHeight : 0);
    }
  }, [isOpen, children]);

  const baseClasses = [
    "accordion-content",
    "overflow-hidden transition-all duration-300 ease-in-out",
    "border-t border-gray-200 dark:border-gray-700",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={baseClasses}
      style={{ height: height }}
      data-testid={testId}
      role="region"
    >
      <div ref={contentRef} className="px-4 py-3">
        {children}
      </div>
    </div>
  );
}

// Composite Export
export default Accordion;
