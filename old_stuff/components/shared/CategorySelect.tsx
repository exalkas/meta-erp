import React from "react";
import FormSelect from "./FormSelect";
import { useCategories } from "@/lib/contexts/CategoriesContext";

interface CategorySelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  includeAll?: boolean;
  allLabel?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export function CategorySelect({
  value,
  onChange,
  placeholder = "Select a category",
  includeAll = false,
  allLabel = "All Categories",
  className,
  disabled = false,
  required = false,
  error,
}: CategorySelectProps) {
  const { categories, loading, error: categoriesError } = useCategories();

  if (loading) {
    return (
      <FormSelect
        value=""
        onChange={() => {}}
        disabled={true}
        className={className}
        error={error}
      >
        <option value="">Loading categories...</option>
      </FormSelect>
    );
  }

  if (categoriesError) {
    return (
      <FormSelect
        value=""
        onChange={() => {}}
        disabled={true}
        className={className}
        error={categoriesError}
      >
        <option value="">Error loading categories</option>
      </FormSelect>
    );
  }

  const activeCategories = categories.filter((cat) => cat.is_active);

  return (
    <FormSelect
      value={value}
      onChange={onChange}
      className={className}
      disabled={disabled}
      required={required}
      error={error}
    >
      {includeAll && <option value="">{allLabel}</option>}
      {!includeAll && <option value="">{placeholder}</option>}
      {activeCategories.map((category) => (
        <option key={category.id} value={category.name}>
          {category.display_name}
        </option>
      ))}
    </FormSelect>
  );
}
