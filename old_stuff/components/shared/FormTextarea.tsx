import React from "react";

interface FormTextareaProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  rows?: number;
  className?: string;
}

export default function FormTextarea({
  id,
  name,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
  rows = 3,
  className = "",
}: FormTextareaProps) {
  const baseClasses = `
    mt-1 block w-full px-3 py-2 
    border rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    transition-colors duration-200
    resize-vertical
  `
    .replace(/\s+/g, " ")
    .trim();

  const borderClasses = error
    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
    : "border-gray-300";

  return (
    <textarea
      id={id}
      name={name || id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      rows={rows}
      className={`${baseClasses} ${borderClasses} ${className}`}
    />
  );
}
