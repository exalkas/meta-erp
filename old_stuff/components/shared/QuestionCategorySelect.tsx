"use client";

import React from "react";
import { useQuestionCategories } from "../../lib/contexts/QuestionCategoriesContext";

interface QuestionCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  includeAll?: boolean;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const QuestionCategorySelect: React.FC<QuestionCategorySelectProps> = ({
  value,
  onChange,
  placeholder = "Select category",
  includeAll = true,
  className = "",
  disabled = false,
  required = false,
}) => {
  const { categories, loading, error } = useQuestionCategories();

  if (loading) {
    return (
      <select
        className={`px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 ${className}`}
        disabled
      >
        <option>Loading categories...</option>
      </select>
    );
  }

  if (error) {
    return (
      <select
        className={`px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-500 ${className}`}
        disabled
      >
        <option>Error loading categories</option>
      </select>
    );
  }

  const activeCategories = categories.filter((cat) => cat.is_active !== false);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${className}`}
      disabled={disabled}
      required={required}
    >
      {!required && (
        <option value="">{includeAll ? "All Categories" : placeholder}</option>
      )}
      {activeCategories.map((category) => (
        <option key={category.id} value={category.name}>
          {category.display_name}
        </option>
      ))}
    </select>
  );
};
