"use client";

import { useState, useEffect } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "./Button";
import { FormInput, FormTextarea, FormSelect, QuestionCategorySelect } from ".";
import RichTextEditor from "./RichTextEditor";
import {
  QuestionType,
  QuestionDifficulty,
  Question,
  QuestionOption,
} from "@/lib/api/education";

interface QuestionFormProps {
  question?: Question;
  onSubmit: (data: QuestionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export interface QuestionFormData {
  title: string;
  question_text: string;
  question_type: QuestionType;
  explanation?: string;
  points: number;
  difficulty_level: QuestionDifficulty;
  category: string;
  tags: string[];
  is_active: boolean;
  options?: Omit<QuestionOption, "id">[];
  blank_answers?: string[]; // For fill-in-the-blank questions
  numeric_answer?: {
    correct_value: number;
    tolerance?: number;
    unit?: string;
  }; // For numeric questions
  true_false_answer?: boolean; // For true/false questions
}

const QUESTION_TYPES: {
  value: QuestionType;
  label: string;
  description: string;
}[] = [
  {
    value: "multiple_choice",
    label: "Multiple Choice",
    description: "Single correct answer",
  },
  {
    value: "multiple_select",
    label: "Multiple Select",
    description: "Multiple correct answers",
  },
  { value: "true_false", label: "True/False", description: "Boolean question" },
  {
    value: "fill_in_blank",
    label: "Fill in the Blank",
    description: "Text input answer",
  },
  { value: "numeric", label: "Numeric", description: "Number input answer" },
  {
    value: "essay",
    label: "Essay",
    description: "Long text answer (manual grading)",
  },
  {
    value: "matching",
    label: "Matching",
    description: "Match pairs (coming soon)",
  },
  {
    value: "ordering",
    label: "Ordering",
    description: "Sequence questions (coming soon)",
  },
];

const DIFFICULTY_LEVELS: {
  value: QuestionDifficulty;
  label: string;
  color: string;
}[] = [
  { value: "EASY", label: "Easy", color: "text-green-600" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
  { value: "HARD", label: "Hard", color: "text-red-600" },
];

export default function QuestionForm({
  question,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save Question",
}: QuestionFormProps) {
  const [formData, setFormData] = useState<QuestionFormData>({
    title: "",
    question_text: "",
    question_type: "multiple_choice",
    explanation: "",
    points: 1,
    difficulty_level: "EASY",
    category: "",
    tags: [],
    is_active: true,
    options: [],
    blank_answers: [],
    numeric_answer: undefined,
    true_false_answer: undefined,
  });

  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when question prop changes
  useEffect(() => {
    if (question) {
      let options: QuestionOption[] = [];
      let blank_answers: string[] = [];
      let numeric_answer = undefined;
      let true_false_answer = undefined;

      // Handle different question types when loading existing questions
      if (
        ["multiple_choice", "multiple_select"].includes(question.question_type)
      ) {
        // For MCQ questions, use options as-is
        options =
          question.options?.map((opt) => ({
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            sort_order: opt.sort_order,
            explanation: opt.explanation,
          })) || [];
      } else if (
        question.question_type === "fill_in_blank" &&
        question.options
      ) {
        // For fill-in-the-blank questions, convert options back to blank_answers
        blank_answers = question.options
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((opt) => opt.option_text);
      } else if (
        question.question_type === "numeric" &&
        question.options &&
        question.options.length > 0
      ) {
        // For numeric questions, parse the answer from the first option
        const answerOption = question.options[0];
        try {
          const answerData = JSON.parse(answerOption.option_text);
          numeric_answer = {
            correct_value: answerData.correct_value || 0,
            tolerance: answerData.tolerance,
            unit: answerData.unit,
          };
        } catch {
          // Fallback for simple numeric values
          numeric_answer = {
            correct_value: parseFloat(answerOption.option_text) || 0,
            tolerance: undefined,
            unit: undefined,
          };
        }
      } else if (
        question.question_type === "true_false" &&
        question.options &&
        question.options.length > 0
      ) {
        // For true/false questions, parse the answer from the first option
        const answerOption = question.options[0];
        true_false_answer = answerOption.option_text.toLowerCase() === "true";
      }

      setFormData({
        title: question.title,
        question_text: question.question_text,
        question_type: question.question_type,
        explanation: question.explanation || "",
        points: question.points,
        difficulty_level: question.difficulty_level,
        category: question.category,
        tags: question.tags || [],
        is_active: question.is_active,
        options: options,
        blank_answers: blank_answers,
        numeric_answer: numeric_answer,
        true_false_answer: true_false_answer,
      });
    }
  }, [question]);

  // Update options when question type changes
  useEffect(() => {
    const needsOptions = ["multiple_choice", "multiple_select"].includes(
      formData.question_type
    );
    const needsBlankAnswers = formData.question_type === "fill_in_blank";
    const needsNumericAnswer = formData.question_type === "numeric";
    const needsTrueFalseAnswer = formData.question_type === "true_false";

    if (needsOptions && (!formData.options || formData.options.length === 0)) {
      setFormData((prev) => ({
        ...prev,
        options: [
          { option_text: "", is_correct: false, sort_order: 1 },
          { option_text: "", is_correct: false, sort_order: 2 },
        ],
      }));
    } else if (!needsOptions) {
      setFormData((prev) => ({ ...prev, options: [] }));
    }

    if (
      needsBlankAnswers &&
      (!formData.blank_answers || formData.blank_answers.length === 0)
    ) {
      setFormData((prev) => ({
        ...prev,
        blank_answers: [""],
      }));
    } else if (!needsBlankAnswers) {
      setFormData((prev) => ({ ...prev, blank_answers: [] }));
    }

    if (needsNumericAnswer && !formData.numeric_answer) {
      setFormData((prev) => ({
        ...prev,
        numeric_answer: {
          correct_value: 0,
          tolerance: undefined,
          unit: undefined,
        },
      }));
    } else if (!needsNumericAnswer) {
      setFormData((prev) => ({ ...prev, numeric_answer: undefined }));
    }

    if (needsTrueFalseAnswer && formData.true_false_answer === undefined) {
      setFormData((prev) => ({
        ...prev,
        true_false_answer: true, // Default to true
      }));
    } else if (!needsTrueFalseAnswer) {
      setFormData((prev) => ({ ...prev, true_false_answer: undefined }));
    }
  }, [formData.question_type]);

  const handleInputChange = (field: keyof QuestionFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleAddOption = () => {
    if (!formData.options) return;

    const newOption: Omit<QuestionOption, "id"> = {
      option_text: "",
      is_correct: false,
      sort_order: formData.options.length + 1,
    };

    setFormData((prev) => ({
      ...prev,
      options: [...(prev.options || []), newOption],
    }));
  };

  const handleRemoveOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleOptionChange = (
    index: number,
    field: keyof QuestionOption,
    value: any
  ) => {
    if (!formData.options) return;

    const updatedOptions = [...formData.options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };

    setFormData((prev) => ({ ...prev, options: updatedOptions }));
  };

  const handleAddBlankAnswer = () => {
    setFormData((prev) => ({
      ...prev,
      blank_answers: [...(prev.blank_answers || []), ""],
    }));
  };

  const handleRemoveBlankAnswer = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      blank_answers: prev.blank_answers?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleBlankAnswerChange = (index: number, value: string) => {
    if (!formData.blank_answers) return;

    const updatedAnswers = [...formData.blank_answers];
    updatedAnswers[index] = value;

    setFormData((prev) => ({ ...prev, blank_answers: updatedAnswers }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.question_text.trim()) {
      newErrors.question_text = "Question text is required";
    }

    if (formData.points < 1) {
      newErrors.points = "Points must be at least 1";
    }

    // Validate options for question types that need them
    if (
      ["multiple_choice", "multiple_select"].includes(formData.question_type)
    ) {
      if (!formData.options || formData.options.length < 2) {
        newErrors.options = "At least 2 options are required";
      } else {
        const hasCorrectAnswer = formData.options.some(
          (option) => option.is_correct
        );
        if (!hasCorrectAnswer) {
          newErrors.options = "At least one option must be marked as correct";
        }

        // Check if all options have text
        const emptyOptions = formData.options.some(
          (option) => !option.option_text.trim()
        );
        if (emptyOptions) {
          newErrors.options = "All options must have text";
        }
      }
    }

    // Validate fill-in-the-blank questions
    if (formData.question_type === "fill_in_blank") {
      if (!formData.blank_answers || formData.blank_answers.length === 0) {
        newErrors.blank_answers = "At least one blank answer is required";
      } else {
        const emptyAnswers = formData.blank_answers.some(
          (answer) => !answer.trim()
        );
        if (emptyAnswers) {
          newErrors.blank_answers = "All blank answers must have text";
        }
      }

      // Check if question text contains blank placeholders
      if (!formData.question_text.includes("____")) {
        newErrors.question_text =
          "Question text must contain blank placeholders (____) for fill-in-the-blank questions";
      }
    }

    // Validate numeric questions
    if (formData.question_type === "numeric") {
      if (!formData.numeric_answer) {
        newErrors.numeric_answer = "Numeric answer is required";
      } else {
        if (isNaN(formData.numeric_answer.correct_value)) {
          newErrors.numeric_answer = "Correct value must be a valid number";
        } else if (
          formData.numeric_answer.tolerance !== undefined &&
          (isNaN(formData.numeric_answer.tolerance) ||
            formData.numeric_answer.tolerance < 0)
        ) {
          newErrors.numeric_answer = "Tolerance must be a non-negative number";
        }
      }
    }

    // Validate true/false questions
    if (formData.question_type === "true_false") {
      if (formData.true_false_answer === undefined) {
        newErrors.true_false_answer =
          "Please select the correct answer (True or False)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Question Title *
        </label>
        <FormInput
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="Enter question title"
          required
          error={errors.title}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Question Type */}
      <div>
        <label
          htmlFor="question_type"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Question Type *
        </label>
        <FormSelect
          id="question_type"
          value={formData.question_type}
          onChange={(e) =>
            handleInputChange("question_type", e.target.value as QuestionType)
          }
          required
        >
          {QUESTION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label} - {type.description}
            </option>
          ))}
        </FormSelect>
      </div>

      {/* Question Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Text *
        </label>
        <RichTextEditor
          value={formData.question_text}
          onChange={(value) => handleInputChange("question_text", value)}
          placeholder="Enter your question here..."
          error={errors.question_text}
        />
        {errors.question_text && (
          <p className="mt-1 text-sm text-red-600">{errors.question_text}</p>
        )}
      </div>

      {/* Answer Options */}
      {["multiple_choice", "multiple_select"].includes(
        formData.question_type
      ) && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700">
              Answer Options *
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={PlusIcon}
              onClick={handleAddOption}
            >
              Add Option
            </Button>
          </div>

          {formData.options && formData.options.length > 0 && (
            <div className="space-y-4">
              {formData.options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                    option.is_correct
                      ? "border-green-200 bg-green-50 hover:bg-green-100"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      id={`option-${index}`}
                      type={
                        formData.question_type === "multiple_choice"
                          ? "radio"
                          : "checkbox"
                      }
                      name={
                        formData.question_type === "multiple_choice"
                          ? "correct_answer"
                          : `correct_${index}`
                      }
                      checked={option.is_correct}
                      onChange={(e) => {
                        if (formData.question_type === "multiple_choice") {
                          // For radio buttons, uncheck all others first
                          const updatedOptions =
                            formData.options?.map((opt, i) => ({
                              ...opt,
                              is_correct:
                                i === index ? e.target.checked : false,
                            })) || [];
                          setFormData((prev) => ({
                            ...prev,
                            options: updatedOptions,
                          }));
                        } else {
                          handleOptionChange(
                            index,
                            "is_correct",
                            e.target.checked
                          );
                        }
                      }}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer"
                    />
                    <label
                      htmlFor={`option-${index}`}
                      className="text-xs text-gray-500 cursor-pointer select-none"
                    >
                      {option.is_correct ? "Correct" : "Mark as correct"}
                    </label>
                  </div>
                  <div className="flex-1 flex items-center space-x-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <FormInput
                      value={option.option_text}
                      onChange={(e) =>
                        handleOptionChange(index, "option_text", e.target.value)
                      }
                      placeholder={`Enter option ${String.fromCharCode(
                        65 + index
                      )}`}
                    />
                  </div>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      icon={TrashIcon}
                      iconOnly
                      onClick={() => handleRemoveOption(index)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {errors.options && (
            <p className="mt-2 text-sm text-red-600">{errors.options}</p>
          )}
        </div>
      )}

      {/* Fill in the Blank Answers */}
      {formData.question_type === "fill_in_blank" && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Blank Answers *
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Use ____ (four underscores) in your question text to mark where
                blanks should appear
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={PlusIcon}
              onClick={handleAddBlankAnswer}
            >
              Add Answer
            </Button>
          </div>

          {formData.blank_answers && formData.blank_answers.length > 0 && (
            <div className="space-y-4">
              {formData.blank_answers.map((answer, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-600">
                      Blank {index + 1}:
                    </span>
                  </div>
                  <div className="flex-1">
                    <FormInput
                      value={answer}
                      onChange={(e) =>
                        handleBlankAnswerChange(index, e.target.value)
                      }
                      placeholder={`Enter correct answer for blank ${
                        index + 1
                      }`}
                    />
                  </div>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      icon={TrashIcon}
                      iconOnly
                      onClick={() => handleRemoveBlankAnswer(index)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800">
                  How to create fill-in-the-blank questions:
                </h4>
                <ul className="mt-1 text-xs text-blue-700 space-y-1">
                  <li>
                    • Use ____ (four underscores) in your question text to mark
                    where blanks should appear
                  </li>
                  <li>
                    • Add the correct answers below in the order they appear in
                    the question
                  </li>
                  <li>
                    • Example: &quot;The ____ is the largest planet in our
                    ____&quot; (answers: &quot;Jupiter&quot;, &quot;solar
                    system&quot;)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {errors.blank_answers && (
            <p className="mt-2 text-sm text-red-600">{errors.blank_answers}</p>
          )}
        </div>
      )}

      {/* Numeric Answer */}
      {formData.question_type === "numeric" && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700">
              Numeric Answer *
            </label>
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            {/* Correct Value */}
            <div>
              <label
                htmlFor="correct_value"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Correct Value *
              </label>
              <FormInput
                id="correct_value"
                type="number"
                step="any"
                value={formData.numeric_answer?.correct_value?.toString() || ""}
                onChange={(e) =>
                  handleInputChange("numeric_answer", {
                    ...(formData.numeric_answer || {}),
                    correct_value: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Enter the correct numeric answer"
                required
              />
            </div>

            {/* Tolerance (Optional) */}
            <div>
              <label
                htmlFor="tolerance"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tolerance (Optional)
              </label>
              <FormInput
                id="tolerance"
                type="number"
                step="any"
                min="0"
                value={formData.numeric_answer?.tolerance?.toString() || ""}
                onChange={(e) =>
                  handleInputChange("numeric_answer", {
                    ...(formData.numeric_answer || {}),
                    tolerance: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder="e.g., 0.1 (allows ±0.1 variance)"
              />
              <p className="mt-1 text-xs text-gray-500">
                If specified, answers within ±tolerance of the correct value
                will be accepted
              </p>
            </div>

            {/* Unit (Optional) */}
            <div>
              <label
                htmlFor="unit"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Unit (Optional)
              </label>
              <FormInput
                id="unit"
                value={formData.numeric_answer?.unit || ""}
                onChange={(e) =>
                  handleInputChange("numeric_answer", {
                    ...(formData.numeric_answer || {}),
                    unit: e.target.value || undefined,
                  })
                }
                placeholder="e.g., €, kg, %, etc."
              />
              <p className="mt-1 text-xs text-gray-500">
                Unit will be displayed with the question for context
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-800">
                  How to create numeric questions:
                </h4>
                <ul className="mt-1 text-xs text-green-700 space-y-1">
                  <li>
                    • Set the correct numeric value that students should
                    calculate
                  </li>
                  <li>
                    • Optionally add tolerance for slight variations (e.g.,
                    rounding differences)
                  </li>
                  <li>
                    • Add a unit if applicable (€, kg, %, etc.) for clarity
                  </li>
                  <li>
                    • Example: &quot;Calculate the total cost&quot; → Correct
                    Value: 85000, Unit: €
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {errors.numeric_answer && (
            <p className="mt-2 text-sm text-red-600">{errors.numeric_answer}</p>
          )}
        </div>
      )}

      {/* True/False Answer */}
      {formData.question_type === "true_false" && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700">
              Correct Answer *
            </label>
          </div>

          <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
            <div className="flex space-x-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="true_false_answer"
                  value="true"
                  checked={formData.true_false_answer === true}
                  onChange={() => handleInputChange("true_false_answer", true)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span className="ml-2 text-sm font-medium text-gray-900">
                  True
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="true_false_answer"
                  value="false"
                  checked={formData.true_false_answer === false}
                  onChange={() => handleInputChange("true_false_answer", false)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <span className="ml-2 text-sm font-medium text-gray-900">
                  False
                </span>
              </label>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-purple-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-purple-800">
                  How to create true/false questions:
                </h4>
                <ul className="mt-1 text-xs text-purple-700 space-y-1">
                  <li>
                    • Select whether the statement in your question is True or
                    False
                  </li>
                  <li>
                    • Write clear, unambiguous statements that are definitively
                    true or false
                  </li>
                  <li>
                    • Example: &quot;The EU ETS is currently in Phase 4&quot; →
                    True
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {errors.true_false_answer && (
            <p className="mt-2 text-sm text-red-600">
              {errors.true_false_answer}
            </p>
          )}
        </div>
      )}

      {/* Points */}
      <div>
        <label
          htmlFor="points"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Points *
        </label>
        <FormInput
          id="points"
          type="number"
          value={formData.points}
          onChange={(e) =>
            handleInputChange("points", parseInt(e.target.value) || 1)
          }
          min={1}
          required
          error={errors.points}
        />
        {errors.points && (
          <p className="mt-1 text-sm text-red-600">{errors.points}</p>
        )}
      </div>

      {/* Difficulty Level */}
      <div>
        <label
          htmlFor="difficulty_level"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Difficulty Level *
        </label>
        <FormSelect
          id="difficulty_level"
          value={formData.difficulty_level}
          onChange={(e) =>
            handleInputChange(
              "difficulty_level",
              e.target.value as QuestionDifficulty
            )
          }
          required
        >
          {DIFFICULTY_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </FormSelect>
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Category *
        </label>
        <QuestionCategorySelect
          value={formData.category}
          onChange={(value) => handleInputChange("category", value)}
          includeAll={false}
          required={true}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button type="button" variant="secondary" onClick={handleAddTag}>
            Add
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-blue-400 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Explanation (Optional)
        </label>
        <RichTextEditor
          value={formData.explanation || ""}
          onChange={(value) => handleInputChange("explanation", value)}
          placeholder="Provide an explanation for the correct answer..."
          height="120px"
        />
      </div>

      {/* Active Status */}
      <div>
        <div className="flex items-center">
          <input
            id="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => handleInputChange("is_active", e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
            Active (question can be used in assessments)
          </label>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
