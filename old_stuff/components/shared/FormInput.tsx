import React from "react";

interface FormInputProps {
  id?: string;
  name?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export default function FormInput({
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
  min,
  max,
  step,
  className = "",
}: FormInputProps) {
  const baseClasses = `
    mt-1 block w-full px-3 py-2 
    border rounded-md shadow-sm 
    bg-white text-gray-900
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    transition-colors duration-200
  `
    .replace(/\s+/g, " ")
    .trim();

  const borderClasses = error
    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
    : "border-gray-300";

  return (
    <input
      id={id}
      name={name || id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      min={min}
      max={max}
      step={step}
      className={`${baseClasses} ${borderClasses} ${className}`}
    />
  );
}
