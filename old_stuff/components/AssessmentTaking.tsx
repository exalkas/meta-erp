"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface QuestionOption {
  id?: number;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
}

interface Question {
  id: number;
  title: string;
  question_text: string;
  question_type:
    | "multiple_choice"
    | "multiple_select"
    | "true_false"
    | "fill_blank"
    | "numeric"
    | "essay";
  points: number;
  options?: QuestionOption[];
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  time_limit?: number;
  passing_score: number;
}

interface AssessmentAttempt {
  attempt_id: number;
  assessment: Assessment;
  questions: Question[];
  time_limit?: number;
}

interface AssessmentTakingProps {
  assessmentAttempt: AssessmentAttempt;
  onSubmit: (responses: AssessmentResponse[]) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface AssessmentResponse {
  question_id: number;
  response_data: any;
  time_spent?: number;
}

export default function AssessmentTaking({
  assessmentAttempt,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AssessmentTakingProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now()
  );
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>(
    {}
  );
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const { assessment, questions } = assessmentAttempt;
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Initialize timer
  useEffect(() => {
    if (assessment.time_limit) {
      setTimeLeft(assessment.time_limit * 60); // Convert minutes to seconds
    }
  }, [assessment.time_limit]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          // Auto-submit when time runs out
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Track time spent on each question
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const recordQuestionTime = useCallback(() => {
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    setQuestionTimes((prev) => ({
      ...prev,
      [currentQuestion.id]: (prev[currentQuestion.id] || 0) + timeSpent,
    }));
  }, [currentQuestion.id, questionStartTime]);

  const handleResponseChange = (questionId: number, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNextQuestion = () => {
    recordQuestionTime();
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    recordQuestionTime();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleGoToQuestion = (index: number) => {
    recordQuestionTime();
    setCurrentQuestionIndex(index);
  };

  const handleAutoSubmit = () => {
    recordQuestionTime();
    const assessmentResponses: AssessmentResponse[] = questions.map(
      (question) => ({
        question_id: question.id,
        response_data: responses[question.id] || null,
        time_spent: questionTimes[question.id] || 0,
      })
    );
    onSubmit(assessmentResponses);
  };

  const handleSubmit = () => {
    recordQuestionTime();
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = () => {
    const assessmentResponses: AssessmentResponse[] = questions.map(
      (question) => ({
        question_id: question.id,
        response_data: responses[question.id] || null,
        time_spent: questionTimes[question.id] || 0,
      })
    );
    onSubmit(assessmentResponses);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = (): number => {
    return Object.values(responses).filter(
      (response) =>
        response !== null && response !== undefined && response !== ""
    ).length;
  };

  const renderQuestionContent = () => {
    switch (currentQuestion.question_type) {
      case "multiple_choice":
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <label
                key={index}
                className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name={`question_${currentQuestion.id}`}
                  value={option.option_text}
                  checked={responses[currentQuestion.id] === option.option_text}
                  onChange={(e) =>
                    handleResponseChange(currentQuestion.id, e.target.value)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-900">{option.option_text}</span>
              </label>
            ))}
          </div>
        );

      case "multiple_select":
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <label
                key={index}
                className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  value={option.option_text}
                  checked={
                    Array.isArray(responses[currentQuestion.id]) &&
                    responses[currentQuestion.id].includes(option.option_text)
                  }
                  onChange={(e) => {
                    const currentResponses =
                      responses[currentQuestion.id] || [];
                    if (e.target.checked) {
                      handleResponseChange(currentQuestion.id, [
                        ...currentResponses,
                        option.option_text,
                      ]);
                    } else {
                      handleResponseChange(
                        currentQuestion.id,
                        currentResponses.filter(
                          (r: string) => r !== option.option_text
                        )
                      );
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="ml-3 text-gray-900">{option.option_text}</span>
              </label>
            ))}
          </div>
        );

      case "true_false":
        return (
          <div className="space-y-3">
            {["True", "False"].map((option) => (
              <label
                key={option}
                className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name={`question_${currentQuestion.id}`}
                  value={option}
                  checked={responses[currentQuestion.id] === option}
                  onChange={(e) =>
                    handleResponseChange(currentQuestion.id, e.target.value)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        );

      case "fill_blank":
        return (
          <div>
            <input
              type="text"
              value={responses[currentQuestion.id] || ""}
              onChange={(e) =>
                handleResponseChange(currentQuestion.id, e.target.value)
              }
              placeholder="Enter your answer..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      case "numeric":
        return (
          <div>
            <input
              type="number"
              value={responses[currentQuestion.id] || ""}
              onChange={(e) =>
                handleResponseChange(
                  currentQuestion.id,
                  parseFloat(e.target.value) || ""
                )
              }
              placeholder="Enter a number..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      case "essay":
        return (
          <div>
            <textarea
              value={responses[currentQuestion.id] || ""}
              onChange={(e) =>
                handleResponseChange(currentQuestion.id, e.target.value)
              }
              placeholder="Write your essay answer here..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            />
            <p className="mt-2 text-sm text-gray-600">
              This question will be manually graded by an instructor.
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Question type not supported yet.
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {assessment.title}
            </h1>
            <p className="text-gray-600 mt-1">{assessment.description}</p>
          </div>
          <div className="text-right">
            {timeLeft !== null && (
              <div
                className={`flex items-center ${
                  timeLeft < 300 ? "text-red-600" : "text-gray-600"
                }`}
              >
                <ClockIcon className="h-5 w-5 mr-2" />
                <span className="font-mono text-lg">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </h2>
          <span className="text-sm text-gray-600">
            {getAnsweredCount()} of {totalQuestions} answered
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
            }}
          />
        </div>

        {/* Question Navigator */}
        <div className="flex flex-wrap gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => handleGoToQuestion(index)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                index === currentQuestionIndex
                  ? "bg-blue-600 text-white"
                  : responses[questions[index].id] !== undefined
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentQuestion.title}
            </h3>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {currentQuestion.points}{" "}
              {currentQuestion.points === 1 ? "point" : "points"}
            </span>
          </div>

          <div
            className="prose max-w-none text-gray-700 mb-6"
            dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }}
          />
        </div>

        {renderQuestionContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border p-6">
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </button>

          {currentQuestionIndex < totalQuestions - 1 ? (
            <button
              onClick={handleNextQuestion}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Submit Assessment
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Submit Assessment?
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to submit your assessment? You have answered{" "}
              <strong>{getAnsweredCount()}</strong> out of{" "}
              <strong>{totalQuestions}</strong> questions.
              {getAnsweredCount() < totalQuestions && (
                <span className="text-yellow-600">
                  {" "}
                  Unanswered questions will be marked as incorrect.
                </span>
              )}
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Continue Working
              </button>
              <button
                onClick={confirmSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Submit Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
