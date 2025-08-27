"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  BookmarkIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface MobileLearningInterfaceProps {
  lesson: {
    id: number;
    title: string;
    content: string;
    lesson_type: "TEXT" | "VIDEO" | "INTERACTIVE" | "QUIZ";
    estimated_duration: number;
    video_url?: string;
    quiz_questions?: any[];
  };
  navigation: {
    previous_lesson?: { id: number; title: string };
    next_lesson?: { id: number; title: string };
  };
  onComplete: () => void;
  onNavigate: (lessonId: number) => void;
}

export default function MobileLearningInterface({
  lesson,
  navigation,
  onComplete,
  onNavigate,
}: MobileLearningInterfaceProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] =
    useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSpeechSynthesis(window.speechSynthesis);
    }

    // Check for saved preferences
    const savedFontSize = localStorage.getItem("mobile-learning-font-size");
    const savedDarkMode = localStorage.getItem("mobile-learning-dark-mode");

    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    if (savedDarkMode) setIsDarkMode(savedDarkMode === "true");

    // Track reading progress
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(progress, 100));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Touch handling for swipe gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && navigation.next_lesson) {
      onNavigate(navigation.next_lesson.id);
    }
    if (isRightSwipe && navigation.previous_lesson) {
      onNavigate(navigation.previous_lesson.id);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const adjustFontSize = (delta: number) => {
    const newSize = Math.max(12, Math.min(24, fontSize + delta));
    setFontSize(newSize);
    localStorage.setItem("mobile-learning-font-size", newSize.toString());
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("mobile-learning-dark-mode", newMode.toString());
  };

  const toggleSpeech = () => {
    if (!speechSynthesis) return;

    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(lesson.content);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // Here you would typically save to backend
  };

  const formatDuration = (minutes: number) => {
    return minutes < 60
      ? `${minutes}m`
      : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const themeClasses = isDarkMode
    ? "bg-gray-900 text-white"
    : "bg-white text-gray-900";

  const cardClasses = isDarkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${themeClasses}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Mobile Header */}
      <div
        className={`sticky top-0 z-40 border-b transition-colors duration-300 ${cardClasses}`}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-medium truncate">{lesson.title}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDuration(lesson.estimated_duration)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-full ${
                  isBookmarked ? "text-blue-500" : "text-gray-400"
                }`}
              >
                <BookmarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="px-4 py-6">
        {lesson.lesson_type === "VIDEO" && lesson.video_url && (
          <div className="mb-6">
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              {/* Video player would go here */}
              <div className="w-full h-full flex items-center justify-center text-white">
                <PlayIcon className="h-16 w-16" />
              </div>
            </div>
          </div>
        )}

        <div
          className="prose max-w-none"
          style={{ fontSize: `${fontSize}px`, lineHeight: "1.6" }}
        >
          <div className="whitespace-pre-wrap">{lesson.content}</div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div
        className={`fixed bottom-0 left-0 right-0 border-t transition-colors duration-300 ${cardClasses}`}
      >
        <div className="px-4 py-3">
          {/* Reading Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => adjustFontSize(-2)}
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                A-
              </button>
              <button
                onClick={() => adjustFontSize(2)}
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                A+
              </button>
              <button
                onClick={toggleDarkMode}
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {isDarkMode ? "☀️" : "🌙"}
              </button>
            </div>

            <div className="flex items-center space-x-3">
              {lesson.lesson_type === "TEXT" && speechSynthesis && (
                <button
                  onClick={toggleSpeech}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {isPlaying ? (
                    <SpeakerXMarkIcon className="h-5 w-5" />
                  ) : (
                    <SpeakerWaveIcon className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() =>
                navigation.previous_lesson &&
                onNavigate(navigation.previous_lesson.id)
              }
              disabled={!navigation.previous_lesson}
              className="flex items-center px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </button>

            <button
              onClick={onComplete}
              className="flex items-center px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Complete
            </button>

            <button
              onClick={() =>
                navigation.next_lesson && onNavigate(navigation.next_lesson.id)
              }
              disabled={!navigation.next_lesson}
              className="flex items-center px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>

          {/* Swipe Hint */}
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Swipe left/right to navigate between lessons
            </p>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Fullscreen */}
      <button
        onClick={toggleFullscreen}
        className="fixed bottom-20 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 z-30"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
      </button>

      {/* Offline Indicator */}
      <div className="fixed top-4 left-4 z-50">
        <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Online</span>
        </div>
      </div>
    </div>
  );
}
