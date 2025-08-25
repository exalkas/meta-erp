"use client";

import { useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrophyIcon,
  AcademicCapIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface QuestionOption {
  id?: number;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
  explanation?: string;
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
  explanation?: string;
  points: number;
  difficulty_level: "EASY" | "MEDIUM" | "HARD";
  category: string;
  options?: QuestionOption[];
}

interface UserQuestionResponse {
  id: number;
  question_id: number;
  response_data: any;
  points_earned: number;
  is_correct: boolean;
  time_spent?: number;
}

interface UserAssessmentAttempt {
  id: number;
  user_id: number;
  assessment_id: number;
  started_at: string;
  completed_at?: string;
  score?: number;
  total_points?: number;
  points_earned?: number;
  status: "in_progress" | "completed" | "abandoned";
  time_spent?: number;
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  passing_score: number;
  time_limit?: number;
}

interface AssessmentResults {
  attempt: UserAssessmentAttempt;
  responses: UserQuestionResponse[];
  assessment: Assessment;
  questions: Question[];
  total_questions: number;
  correct_answers: number;
  percentage_score: number;
  passed: boolean;
}

interface AssessmentResultsProps {
  results: AssessmentResults;
  onRetake?: () => void;
  onBackToAssessments: () => void;
  showDetailedReview?: boolean;
}

export default function AssessmentResults({
  results,
  onRetake,
  onBackToAssessments,
  showDetailedReview = true,
}: AssessmentResultsProps) {
  const [showQuestionReview, setShowQuestionReview] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  const {
    attempt,
    responses,
    assessment,
    questions,
    total_questions,
    correct_answers,
    percentage_score,
    passed,
  } = results;

  const formatTime = (seconds?: number): string => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case "EASY":
        return "text-green-600 bg-green-100";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-100";
      case "HARD":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const renderQuestionResponse = (
    question: Question,
    response: UserQuestionResponse
  ) => {
    const userAnswer = response.response_data;

    switch (question.question_type) {
      case "multiple_choice":
      case "true_false":
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const isUserChoice = userAnswer === option.option_text;
              const isCorrect = option.is_correct;

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    isUserChoice && isCorrect
                      ? "bg-green-50 border-green-200"
                      : isUserChoice && !isCorrect
                      ? "bg-red-50 border-red-200"
                      : isCorrect
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{option.option_text}</span>
                    <div className="flex items-center gap-2">
                      {isUserChoice && (
                        <span className="text-xs font-medium text-gray-600">
                          Your answer
                        </span>
                      )}
                      {isCorrect && (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      )}
                      {isUserChoice && !isCorrect && (
                        <XCircleIcon className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                  {option.explanation && (isUserChoice || isCorrect) && (
                    <p className="mt-2 text-sm text-gray-600">
                      {option.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        );

      case "multiple_select":
        const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const isUserChoice = userAnswers.includes(option.option_text);
              const isCorrect = option.is_correct;

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    isUserChoice && isCorrect
                      ? "bg-green-50 border-green-200"
                      : isUserChoice && !isCorrect
                      ? "bg-red-50 border-red-200"
                      : isCorrect
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{option.option_text}</span>
                    <div className="flex items-center gap-2">
                      {isUserChoice && (
                        <span className="text-xs font-medium text-gray-600">
                          Selected
                        </span>
                      )}
                      {isCorrect && (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      )}
                      {isUserChoice && !isCorrect && (
                        <XCircleIcon className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case "fill_blank":
      case "numeric":
        return (
          <div className="space-y-3">
            <div
              className={`p-3 rounded-lg border ${
                response.is_correct
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-900">
                  Your answer:{" "}
                  <strong>{userAnswer || "No answer provided"}</strong>
                </span>
                {response.is_correct ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
          </div>
        );

      case "essay":
        return (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Essay Response (Manual Grading Required)</strong>
              </p>
              <div className="text-gray-900 whitespace-pre-wrap">
                {userAnswer || "No response provided"}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Points earned: {response.points_earned} / {question.points}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-gray-500 italic">
            Response type not supported for review.
          </div>
        );
    }
  };

  if (showQuestionReview) {
    const currentQuestion = questions[selectedQuestionIndex];
    const currentResponse = responses.find(
      (r) => r.question_id === currentQuestion.id
    );

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => setShowQuestionReview(false)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Results
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Question Review
              </h1>
              <p className="text-gray-600">
                Question {selectedQuestionIndex + 1} of {total_questions}
              </p>
            </div>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Questions
          </h3>
          <div className="flex flex-wrap gap-2">
            {questions.map((_, index) => {
              const response = responses.find(
                (r) => r.question_id === questions[index].id
              );
              return (
                <button
                  key={index}
                  onClick={() => setSelectedQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    index === selectedQuestionIndex
                      ? "bg-blue-600 text-white"
                      : response?.is_correct
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentQuestion.title}
            </h3>
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                  currentQuestion.difficulty_level
                )}`}
              >
                {currentQuestion.difficulty_level}
              </span>
              <span className="text-sm text-gray-600">
                {currentResponse?.points_earned || 0} / {currentQuestion.points}{" "}
                points
              </span>
              {currentResponse?.is_correct ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>

          <div
            className="prose max-w-none text-gray-700 mb-6"
            dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }}
          />

          {currentResponse &&
            renderQuestionResponse(currentQuestion, currentResponse)}

          {currentQuestion.explanation && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
              <p className="text-blue-800">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Results Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {passed ? (
              <TrophyIcon className="h-16 w-16 text-yellow-500" />
            ) : (
              <XCircleIcon className="h-16 w-16 text-red-500" />
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {passed ? "Congratulations!" : "Assessment Complete"}
          </h1>

          <p className="text-xl text-gray-600 mb-4">
            {passed
              ? "You have successfully passed the assessment!"
              : `You scored ${percentage_score}%. You need ${assessment.passing_score}% to pass.`}
          </p>

          <div
            className={`text-4xl font-bold mb-2 ${getScoreColor(
              percentage_score
            )}`}
          >
            {percentage_score}%
          </div>

          <p className="text-gray-600">
            {attempt.points_earned} out of {attempt.total_points} points
          </p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <AcademicCapIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {correct_answers}
          </div>
          <div className="text-sm text-gray-600">Correct Answers</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <ChartBarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {total_questions}
          </div>
          <div className="text-sm text-gray-600">Total Questions</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <ClockIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {formatTime(attempt.time_spent)}
          </div>
          <div className="text-sm text-gray-600">Time Spent</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <TrophyIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {assessment.passing_score}%
          </div>
          <div className="text-sm text-gray-600">Passing Score</div>
        </div>
      </div>

      {/* Assessment Details */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Assessment Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {assessment.title}
            </h4>
            <p className="text-gray-600 mb-4">{assessment.description}</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Started:</span>
                <span className="text-gray-900">
                  {formatDate(attempt.started_at)}
                </span>
              </div>
              {attempt.completed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="text-gray-900">
                    {formatDate(attempt.completed_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Performance Breakdown
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Correct Answers:</span>
                <span className="text-green-600 font-medium">
                  {correct_answers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Incorrect Answers:</span>
                <span className="text-red-600 font-medium">
                  {total_questions - correct_answers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Accuracy:</span>
                <span className="font-medium">
                  {Math.round((correct_answers / total_questions) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {showDetailedReview && (
          <button
            onClick={() => setShowQuestionReview(true)}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <EyeIcon className="h-5 w-5 mr-2" />
            Review Questions
          </button>
        )}

        {onRetake && !passed && (
          <button
            onClick={onRetake}
            className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retake Assessment
          </button>
        )}

        <button
          onClick={onBackToAssessments}
          className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Assessments
        </button>
      </div>
    </div>
  );
}
