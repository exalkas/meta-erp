"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  HomeIcon,
  ChartBarSquareIcon,
  NewspaperIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  ArrowUpCircleIcon,
  Bars3Icon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  XMarkIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Market", href: "/market", icon: ChartBarSquareIcon },
  { name: "News", href: "/news", icon: NewspaperIcon },
  { name: "Orders", href: "/orders", icon: ClipboardDocumentListIcon },
  { name: "KYC Verification", href: "/kyc", icon: ShieldCheckIcon },
  { name: "Payments", href: "/payments/history", icon: CreditCardIcon },
];

// Education navigation items
const educationNavigation = [
  { name: "Education", href: "/education", icon: AcademicCapIcon },
  { name: "Search", href: "/education/search", icon: MagnifyingGlassIcon },
  { name: "Progress", href: "/education/progress", icon: ChartBarIcon },
  {
    name: "Certificates",
    href: "/education/certificates",
    icon: ShieldCheckIcon,
  },
];

interface DashboardNavigationProps {
  isMobile?: boolean;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

// Helper function to get KYC status styling
const getKYCStatusStyle = (status?: string) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "submitted":
    case "under_review":
      return "bg-yellow-100 text-yellow-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "not_started":
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Helper function to get KYC status text
const getKYCStatusText = (status?: string) => {
  switch (status) {
    case "approved":
      return "KYC ✓";
    case "submitted":
      return "KYC Pending";
    case "under_review":
      return "Under Review";
    case "rejected":
      return "KYC Rejected";
    case "in_progress":
      return "KYC In Progress";
    case "not_started":
    default:
      return "KYC Required";
  }
};

export default function DashboardNavigation({
  isMobile = false,
  mobileMenuOpen = false,
  setMobileMenuOpen,
}: DashboardNavigationProps) {
  const pathname = usePathname();
  const { user, kycStatus, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  // Load drawer state from localStorage on mount (only for desktop)
  useEffect(() => {
    if (!isMobile) {
      const savedState = localStorage.getItem("client-navigation-expanded");
      if (savedState !== null) {
        setIsExpanded(JSON.parse(savedState));
      }
    }
  }, [isMobile]);

  const handleLogout = () => {
    logout();
  };

  const toggleDrawer = () => {
    if (isMobile && setMobileMenuOpen) {
      setMobileMenuOpen(false);
    } else {
      const newState = !isExpanded;
      setIsExpanded(newState);
      localStorage.setItem(
        "client-navigation-expanded",
        JSON.stringify(newState)
      );
    }
  };

  const handleNavItemClick = () => {
    // Auto-close drawer on mobile when navigating
    if (isMobile && setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  // On mobile, only show navigation when menu is open
  if (isMobile && !mobileMenuOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen?.(false)}
        />
      )}

      {/* Navigation Drawer */}
      <div
        className={`sidebar-navigation ${
          isMobile ? "fixed inset-y-0 left-0 z-50" : "relative"
        } bg-gray-800 text-white min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
          isMobile ? "w-80" : isExpanded ? "w-64" : "w-16"
        }`}
      >
        {/* Header with title and toggle button */}
        <div className="p-4 flex items-center justify-between">
          {isMobile || isExpanded ? (
            <>
              <div className="min-w-0 flex-1">
                <div className="flex items-center">
                  <div className="bg-green-600 text-white p-2 rounded-lg mr-3 flex-shrink-0">
                    <ChartBarSquareIcon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold truncate">GreenTrade</h2>
                    <p className="text-xs text-gray-400 truncate">
                      Trading Platform
                    </p>
                  </div>
                </div>
                {user && (
                  <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                    <p className="text-sm font-medium truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center mt-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          user.subscription_type === "trial"
                            ? "bg-blue-100 text-blue-800"
                            : user.subscription_type === "standard"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.subscription_type || "Free"}
                      </span>
                      <span
                        className={`ml-2 inline-flex px-2 py-1 text-xs rounded-full ${getKYCStatusStyle(
                          kycStatus?.status
                        )}`}
                      >
                        {getKYCStatusText(kycStatus?.status)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={toggleDrawer}
                className="ml-2 p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex-shrink-0"
                title={isMobile ? "Close navigation" : "Collapse navigation"}
              >
                {isMobile ? (
                  <XMarkIcon className="h-5 w-5" />
                ) : (
                  <ChevronLeftIcon className="h-5 w-5" />
                )}
              </button>
            </>
          ) : (
            <button
              onClick={toggleDrawer}
              className="w-full p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              title="Expand navigation"
            >
              <Bars3Icon className="h-5 w-5 mx-auto" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;

              if (isMobile || isExpanded) {
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={handleNavItemClick}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </li>
                );
              } else {
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-center p-2 rounded-md transition-colors group relative ${
                        isActive
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                      title={item.name}
                    >
                      <item.icon className="h-5 w-5" />
                      {/* Tooltip for collapsed state */}
                      <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                      </span>
                    </Link>
                  </li>
                );
              }
            })}

            {/* Education Section */}
            <li className="mt-6">
              {(isMobile || isExpanded) && (
                <div className="text-xs font-semibold leading-6 text-gray-400 uppercase px-3 mb-2">
                  Education
                </div>
              )}
              <ul
                className={`space-y-1 ${
                  !isMobile && !isExpanded
                    ? "border-t border-gray-700 pt-2"
                    : ""
                }`}
              >
                {educationNavigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href === "/education" &&
                      pathname.startsWith("/education") &&
                      pathname !== "/education/search" &&
                      pathname !== "/education/progress" &&
                      pathname !== "/education/certificates") ||
                    (item.href === "/education/search" &&
                      pathname === "/education/search") ||
                    (item.href === "/education/progress" &&
                      pathname === "/education/progress") ||
                    (item.href === "/education/certificates" &&
                      pathname === "/education/certificates");

                  if (isMobile || isExpanded) {
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={handleNavItemClick}
                          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-gray-900 text-white"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white"
                          }`}
                        >
                          <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      </li>
                    );
                  } else {
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center justify-center p-2 rounded-md transition-colors group relative ${
                            isActive
                              ? "bg-gray-900 text-white"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white"
                          }`}
                          title={item.name}
                        >
                          <item.icon className="h-5 w-5" />
                          {/* Tooltip for collapsed state */}
                          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            {item.name}
                          </span>
                        </Link>
                      </li>
                    );
                  }
                })}
              </ul>
            </li>
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-2 border-t border-gray-700">
          {isMobile || isExpanded ? (
            <>
              <Link
                href="/upgrade"
                className="flex items-center w-full px-3 py-2 mb-2 text-sm font-medium text-green-300 rounded-md hover:bg-gray-700 hover:text-green-200 transition-colors"
              >
                <ArrowUpCircleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="truncate">Upgrade Plan</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="truncate">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/upgrade"
                className="flex items-center justify-center w-full p-2 mb-2 text-green-300 rounded-md hover:bg-gray-700 hover:text-green-200 transition-colors group relative"
                title="Upgrade Plan"
              >
                <ArrowUpCircleIcon className="h-5 w-5" />
                {/* Tooltip for collapsed state */}
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Upgrade Plan
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full p-2 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors group relative"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                {/* Tooltip for collapsed state */}
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Logout
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
