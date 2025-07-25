import React, { useState } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { Language } from "../../types";
import { FormFieldType } from "../../types/forms";

export interface FormField {
  id: string;
  type: FormFieldType;
  name: string;
  label: Record<Language, string>;
  placeholder?: Record<Language, string>;
  helperText?: Record<Language, string>;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: string;
  };
  options?: Array<{
    id: string;
    label: Record<Language, string>;
    value: string;
  }>;
  conditional?: {
    dependsOn: string;
    condition: "equals" | "not_equals" | "contains" | "not_empty";
    value: string;
  };
  layout?: {
    width?: "full" | "half" | "third" | "quarter";
    order?: number;
  };
}

export interface FormSchema {
  id: string;
  title: Record<Language, string>;
  description?: Record<Language, string>;
  fields: FormField[];
  settings: {
    layout: "vertical" | "horizontal" | "grid";
    submitText?: Record<Language, string>;
    resetText?: Record<Language, string>;
    showProgress?: boolean;
    allowSaveDraft?: boolean;
  };
}

export interface FormBuilderProps {
  schema?: FormSchema;
  onSchemaChange: (schema: FormSchema) => void;
  availableFieldTypes?: FormFieldType[];
  onPreview?: () => void;
  onSave?: () => void;
  className?: string;
}

const DEFAULT_FIELD_TYPES: FormFieldType[] = [
  "text",
  "email",
  "password",
  "number",
  "tel",
  "url",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "date",
  "afm",
  "greek_phone",
  "iban",
];

export const FormBuilder: React.FC<FormBuilderProps> = ({
  schema,
  onSchemaChange,
  availableFieldTypes = DEFAULT_FIELD_TYPES,
  onPreview,
  onSave,
  className = "",
}) => {
  const { t, language } = useTranslation();
  const [activeField, setActiveField] = useState<string | null>(null);
  const [draggedField, setDraggedField] = useState<FormField | null>(null);

  const currentSchema: FormSchema = schema || {
    id: "new-form",
    title: { el: "Νέα Φόρμα", en: "New Form" },
    description: { el: "", en: "" },
    fields: [],
    settings: {
      layout: "vertical",
      submitText: { el: "Υποβολή", en: "Submit" },
      resetText: { el: "Επαναφορά", en: "Reset" },
      showProgress: false,
      allowSaveDraft: false,
    },
  };

  const updateSchema = (updates: Partial<FormSchema>) => {
    onSchemaChange({ ...currentSchema, ...updates });
  };

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      name: `field_${currentSchema.fields.length + 1}`,
      label: {
        el: `Πεδίο ${currentSchema.fields.length + 1}`,
        en: `Field ${currentSchema.fields.length + 1}`,
      },
      required: false,
      layout: {
        width: "full",
        order: currentSchema.fields.length,
      },
    };

    updateSchema({
      fields: [...currentSchema.fields, newField],
    });

    setActiveField(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    const updatedFields = currentSchema.fields.map((field) =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    updateSchema({ fields: updatedFields });
  };

  const removeField = (fieldId: string) => {
    const updatedFields = currentSchema.fields.filter(
      (field) => field.id !== fieldId
    );
    updateSchema({ fields: updatedFields });
    if (activeField === fieldId) {
      setActiveField(null);
    }
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const fields = [...currentSchema.fields];
    const [removed] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, removed);

    // Update order
    const updatedFields = fields.map((field, index) => ({
      ...field,
      layout: { ...field.layout, order: index },
    }));

    updateSchema({ fields: updatedFields });
  };

  const getFieldTypeLabel = (type: FormFieldType): string => {
    const labels: Record<FormFieldType, Record<Language, string>> = {
      text: { el: "Κείμενο", en: "Text" },
      email: { el: "Email", en: "Email" },
      password: { el: "Κωδικός", en: "Password" },
      number: { el: "Αριθμός", en: "Number" },
      tel: { el: "Τηλέφωνο", en: "Phone" },
      url: { el: "URL", en: "URL" },
      textarea: { el: "Κείμενο Πολλών Γραμμών", en: "Textarea" },
      select: { el: "Επιλογή", en: "Select" },
      multiselect: { el: "Πολλαπλή Επιλογή", en: "Multi Select" },
      checkbox: { el: "Checkbox", en: "Checkbox" },
      radio: { el: "Radio", en: "Radio" },
      switch: { el: "Διακόπτης", en: "Switch" },
      date: { el: "Ημερομηνία", en: "Date" },
      "datetime-local": { el: "Ημερομηνία/Ώρα", en: "DateTime" },
      time: { el: "Ώρα", en: "Time" },
      file: { el: "Αρχείο", en: "File" },
      hidden: { el: "Κρυφό", en: "Hidden" },
      afm: { el: "ΑΦΜ", en: "AFM" },
      doy: { el: "ΔΟΥ", en: "DOY" },
      greek_phone: { el: "Ελληνικό Τηλέφωνο", en: "Greek Phone" },
      greek_address: { el: "Ελληνική Διεύθυνση", en: "Greek Address" },
      postal_code: { el: "Ταχυδρομικός Κώδικας", en: "Postal Code" },
      iban: { el: "IBAN", en: "IBAN" },
      vat_number: { el: "Αριθμός ΦΠΑ", en: "VAT Number" },
    };
    return labels[type]?.[language] || type;
  };

  const FieldTypeButton: React.FC<{ type: FormFieldType }> = ({ type }) => (
    <button
      type="button"
      onClick={() => addField(type)}
      className="flex items-center space-x-2 w-full p-2 text-left border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
        <span className="text-xs text-blue-600">T</span>
      </div>
      <span className="text-sm">{getFieldTypeLabel(type)}</span>
    </button>
  );

  const FieldEditor: React.FC<{ field: FormField }> = ({ field }) => {
    const handleLabelChange = (lang: Language, value: string) => {
      updateField(field.id, {
        label: { ...field.label, [lang]: value },
      });
    };

    const handlePlaceholderChange = (lang: Language, value: string) => {
      updateField(field.id, {
        placeholder: {
          el: field.placeholder?.el || "",
          en: field.placeholder?.en || "",
          [lang]: value,
        },
      });
    };

    return (
      <div className="p-4 border-l-4 border-blue-500 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">{field.label[language]}</h4>
          <button
            type="button"
            onClick={() => removeField(field.id)}
            className="text-red-500 hover:text-red-700"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {/* Field Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("field_name")}
            </label>
            <input
              type="text"
              value={field.name}
              onChange={(e) => updateField(field.id, { name: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("label")}
            </label>
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Greek"
                value={field.label.el || ""}
                onChange={(e) => handleLabelChange("el", e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="English"
                value={field.label.en || ""}
                onChange={(e) => handleLabelChange("en", e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Placeholder */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("placeholder")}
            </label>
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Greek"
                value={field.placeholder?.el || ""}
                onChange={(e) => handlePlaceholderChange("el", e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="English"
                value={field.placeholder?.en || ""}
                onChange={(e) => handlePlaceholderChange("en", e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Required */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={(e) =>
                  updateField(field.id, { required: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {t("required")}
              </span>
            </label>
          </div>

          {/* Width */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("width")}
            </label>
            <select
              value={field.layout?.width || "full"}
              onChange={(e) =>
                updateField(field.id, {
                  layout: {
                    ...field.layout,
                    width: e.target.value as
                      | "full"
                      | "half"
                      | "third"
                      | "quarter",
                  },
                })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="full">{t("full_width")}</option>
              <option value="half">{t("half_width")}</option>
              <option value="third">{t("third_width")}</option>
              <option value="quarter">{t("quarter_width")}</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const FormPreview: React.FC = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {currentSchema.title[language]}
        </h2>
        {currentSchema.description?.[language] && (
          <p className="mt-2 text-gray-600">
            {currentSchema.description[language]}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {currentSchema.fields.map((field, index) => (
          <div
            key={field.id}
            onClick={() => setActiveField(field.id)}
            className={`
              p-3 border-2 rounded-md cursor-pointer transition-colors
              ${
                activeField === field.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{field.label[language]}</span>
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </div>
              <span className="text-xs text-gray-500">
                {getFieldTypeLabel(field.type)}
              </span>
            </div>
            {field.placeholder?.[language] && (
              <div className="text-sm text-gray-500 mt-1">
                {t("placeholder")}: {field.placeholder[language]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`flex h-full space-x-6 ${className}`}>
      {/* Field Types Panel */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">{t("field_types")}</h3>
          <div className="space-y-2">
            {availableFieldTypes.map((type) => (
              <FieldTypeButton key={type} type={type} />
            ))}
          </div>
        </div>
      </div>

      {/* Form Preview */}
      <div className="flex-1">
        <FormPreview />
      </div>

      {/* Field Editor Panel */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">{t("field_editor")}</h3>
            <div className="flex space-x-2">
              {onPreview && (
                <button
                  type="button"
                  onClick={onPreview}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  {t("preview")}
                </button>
              )}
              {onSave && (
                <button
                  type="button"
                  onClick={onSave}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {t("save")}
                </button>
              )}
            </div>
          </div>

          {activeField ? (
            (() => {
              const field = currentSchema.fields.find(
                (f) => f.id === activeField
              );
              return field ? (
                <FieldEditor field={field} />
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {t("no_field_selected")}
                </div>
              );
            })()
          ) : (
            <div className="text-center text-gray-500 py-8">
              {t("select_field_to_edit")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
