"use client";

import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./shared";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const scrollToPlans = () => {
    if (window.location.pathname === "/") {
      // If on homepage, scroll to plans section
      const plansSection = document.querySelector("#plans-section");
      if (plansSection) {
        plansSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // If not on homepage, navigate to homepage and then scroll
      router.push("/#plans");
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="bg-green-600 text-white p-2 rounded-lg mr-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">
                GreenTrade
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={scrollToPlans}
              className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Plans
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/market"
                  className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/news"
                  className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  News
                </Link>
                <Link
                  href="/orders"
                  className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Orders
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    {user.full_name || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-600 text-sm transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Button href="/signup" variant="success" size="sm">
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-green-600 focus:outline-none focus:text-green-600"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button
                onClick={() => {
                  scrollToPlans();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left text-gray-700 hover:text-green-600 px-3 py-2 text-base font-medium transition-colors"
              >
                Plans
              </button>

              {user ? (
                <>
                  <Link
                    href="/market"
                    className="block text-gray-700 hover:text-green-600 px-3 py-2 text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/news"
                    className="block text-gray-700 hover:text-green-600 px-3 py-2 text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    News
                  </Link>
                  <Link
                    href="/orders"
                    className="block text-gray-700 hover:text-green-600 px-3 py-2 text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  <div className="px-3 py-2 text-sm text-gray-700">
                    {user.full_name || user.email}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left text-red-600 hover:text-red-700 px-3 py-2 text-base font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block text-gray-700 hover:text-green-600 px-3 py-2 text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Button
                    href="/signup"
                    variant="success"
                    size="md"
                    onClick={() => setIsMenuOpen(false)}
                    fullWidth
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
