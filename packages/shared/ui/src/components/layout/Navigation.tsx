import React, { useState } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { LanguageSelector } from "../multilingual/LanguageSelector";
import { LocalizedText } from "../multilingual/LocalizedText";
import { Button } from "../ui/Button";
import { Language } from "../../types";

export interface NavigationItem {
  id: string;
  label: Record<Language, string>;
  href?: string;
  icon?: React.ReactNode;
  children?: NavigationItem[];
  active?: boolean;
  disabled?: boolean;
  badge?: {
    text: string;
    variant?: "primary" | "secondary" | "success" | "warning" | "error";
  };
}

export interface NavigationProps {
  /** Navigation items */
  items: NavigationItem[];
  /** Logo component */
  logo?: React.ReactNode;
  /** Show language selector */
  showLanguageSelector?: boolean;
  /** User menu items */
  userMenu?: NavigationItem[];
  /** Current user info */
  user?: {
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  };
  /** Mobile breakpoint */
  mobileBreakpoint?: "sm" | "md" | "lg";
  /** Variant */
  variant?: "horizontal" | "sidebar";
  /** Background color */
  background?: "white" | "gray" | "blue" | "maritime";
  /** Sticky navigation */
  sticky?: boolean;
  /** Additional actions */
  actions?: React.ReactNode;
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  items,
  logo,
  showLanguageSelector = true,
  userMenu,
  user,
  mobileBreakpoint = "md",
  variant = "horizontal",
  background = "maritime",
  sticky = true,
  actions,
  className = "",
}) => {
  const { t, language } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = (itemId: string) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(itemId)) {
      newOpenDropdowns.delete(itemId);
    } else {
      newOpenDropdowns.add(itemId);
    }
    setOpenDropdowns(newOpenDropdowns);
  };

  const backgroundClasses = {
    white: "bg-white border-b border-gray-200",
    gray: "bg-gray-50 border-b border-gray-200",
    blue: "bg-blue-600 text-white",
    maritime: "bg-[#0066CC] text-white",
  };

  const linkClasses = {
    white: "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
    gray: "text-gray-700 hover:text-gray-900 hover:bg-white",
    blue: "text-blue-100 hover:text-white hover:bg-blue-700",
    maritime: "text-blue-100 hover:text-white hover:bg-blue-700",
  };

  const activeClasses = {
    white: "text-blue-600 bg-blue-50",
    gray: "text-blue-600 bg-white",
    blue: "text-white bg-blue-700",
    maritime: "text-white bg-blue-700",
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openDropdowns.has(item.id);

    const itemContent = (
      <div className="flex items-center space-x-2 w-full">
        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
        <LocalizedText text={item.label} className="flex-1 text-left" />
        {item.badge && (
          <span
            className={`
            px-2 py-1 text-xs rounded-full
            ${
              item.badge.variant === "error"
                ? "bg-red-100 text-red-800"
                : item.badge.variant === "warning"
                ? "bg-yellow-100 text-yellow-800"
                : item.badge.variant === "success"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }
          `}
          >
            {item.badge.text}
          </span>
        )}
        {hasChildren && (
          <svg
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </div>
    );

    if (hasChildren) {
      return (
        <div key={item.id} className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown(item.id)}
            disabled={item.disabled}
            className={`
              flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${
                item.active
                  ? activeClasses[background]
                  : linkClasses[background]
              }
              ${
                item.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }
            `}
          >
            {itemContent}
          </button>

          {isOpen && (
            <div
              className={`${
                level === 0
                  ? "absolute top-full left-0 mt-1 w-48 bg-white shadow-lg rounded-md z-50"
                  : "ml-4 mt-1"
              }`}
            >
              {item.children?.map((child) =>
                renderNavigationItem(child, level + 1)
              )}
            </div>
          )}
        </div>
      );
    }

    const LinkComponent = item.href ? "a" : "button";

    return (
      <LinkComponent
        key={item.id}
        href={item.href}
        onClick={item.href ? undefined : () => {}}
        disabled={item.disabled}
        className={`
          flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors
          ${item.active ? activeClasses[background] : linkClasses[background]}
          ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {itemContent}
      </LinkComponent>
    );
  };

  const UserMenu: React.FC = () => {
    if (!user && !userMenu) return null;

    return (
      <div className="relative">
        <button
          type="button"
          className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm hover:bg-opacity-20 hover:bg-white transition-colors"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.name?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          {user && (
            <div className="hidden md:block text-left">
              <div className="font-medium">{user.name}</div>
              {user.role && (
                <div className="text-xs opacity-75">{user.role}</div>
              )}
            </div>
          )}
        </button>
      </div>
    );
  };

  if (variant === "horizontal") {
    return (
      <nav
        className={`
        ${backgroundClasses[background]}
        ${sticky ? "sticky top-0 z-40" : ""}
        ${className}
      `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            {logo && <div className="flex-shrink-0">{logo}</div>}

            {/* Desktop Navigation */}
            <div
              className={`hidden ${mobileBreakpoint}:flex items-center space-x-1`}
            >
              {items.map((item) => renderNavigationItem(item))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {actions}

              {showLanguageSelector && (
                <LanguageSelector
                  variant="dropdown"
                  size="sm"
                  className="hidden sm:block"
                />
              )}

              <UserMenu />

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={toggleMobileMenu}
                className={`${mobileBreakpoint}:hidden p-2 rounded-md hover:bg-opacity-20 hover:bg-white transition-colors`}
              >
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
                    d={
                      isMobileMenuOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className={`${mobileBreakpoint}:hidden pb-4`}>
              <div className="space-y-1">
                {items.map((item) => renderNavigationItem(item))}
              </div>

              {showLanguageSelector && (
                <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                  <LanguageSelector variant="buttons" size="sm" />
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Sidebar variant would be implemented here
  return null;
};

// Breadcrumb navigation component
export interface BreadcrumbItem {
  id: string;
  label: Record<Language, string>;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <span className="text-gray-400">/</span>,
  className = "",
}) => {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {item.href ? (
            <a
              href={item.href}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
            >
              {item.icon && <span>{item.icon}</span>}
              <LocalizedText text={item.label} />
            </a>
          ) : (
            <span className="flex items-center space-x-1 text-gray-500">
              {item.icon && <span>{item.icon}</span>}
              <LocalizedText text={item.label} />
            </span>
          )}

          {index < items.length - 1 && (
            <span className="flex-shrink-0">{separator}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Navigation;
