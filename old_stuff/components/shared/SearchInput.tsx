"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-sm py-2 pl-9 pr-8",
  md: "text-base py-2 pl-10 pr-10",
  lg: "text-lg py-3 pl-12 pr-12",
};

const iconSizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  debounceMs = 300,
  disabled = false,
  size = "md",
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounce the onChange call
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChange, debounceMs]);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon
          className={`${iconSizeClasses[size]} text-gray-400`}
          aria-hidden="true"
        />
      </div>

      {/* Input */}
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          block w-full border border-gray-300 rounded-md
          focus:ring-blue-500 focus:border-blue-500
          placeholder-gray-400 bg-white
          ${sizeClasses[size]}
          ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
        `.trim()}
      />

      {/* Clear Button */}
      {localValue && !disabled && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <XMarkIcon
              className={`${iconSizeClasses[size]}`}
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </div>
  );
}
