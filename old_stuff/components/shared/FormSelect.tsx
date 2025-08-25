import React from "react";

interface FormSelectProps {
  id?: string;
  name?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export default function FormSelect({
  id,
  name,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  className = "",
  children,
}: FormSelectProps) {
  const baseClasses = `
    mt-1 block w-full px-3 py-2 
    border rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    transition-colors duration-200
    bg-white
  `
    .replace(/\s+/g, " ")
    .trim();

  const borderClasses = error
    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
    : "border-gray-300";

  return (
    <select
      id={id}
      name={name || id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={`${baseClasses} ${borderClasses} ${className}`}
    >
      {children}
    </select>
  );
}
