import React, { useState } from "react";
import { ChevronDown, Menu, X, Search, Bell, User } from "lucide-react";

export interface HeaderNavItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children?: HeaderNavItem[];
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface HeaderProps {
  logo?: React.ReactNode;
  title?: string;
  navigationItems?: HeaderNavItem[];
  userActions?: React.ReactNode;
  searchBar?: React.ReactNode;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
  className?: string;
  containerClassName?: string;
  logoClassName?: string;
  navClassName?: string;
  actionsClassName?: string;
  sticky?: boolean;
  height?: string;
  variant?: "default" | "minimal" | "compact";
  showBorder?: boolean;
  backgroundColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  logo,
  title,
  navigationItems = [],
  userActions,
  searchBar,
  showMobileMenu = true,
  onMobileMenuToggle,
  className = "",
  containerClassName = "",
  logoClassName = "",
  navClassName = "",
  actionsClassName = "",
  sticky = false,
  height = "h-16",
  variant = "default",
  showBorder = true,
  backgroundColor = "bg-white",
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (onMobileMenuToggle) {
      onMobileMenuToggle();
    }
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

  const handleItemClick = (item: HeaderNavItem) => {
    if (item.disabled) return;

    if (item.children && item.children.length > 0) {
      toggleDropdown(item.id);
    } else {
      if (item.onClick) {
        item.onClick();
      }
      // Close mobile menu when item is clicked
      setMobileMenuOpen(false);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "minimal":
        return {
          container: "px-4 sm:px-6",
          spacing: "space-x-4",
          padding: "py-2",
        };
      case "compact":
        return {
          container: "px-4 sm:px-6",
          spacing: "space-x-3",
          padding: "py-1",
        };
      default:
        return {
          container: "px-4 sm:px-6 lg:px-8",
          spacing: "space-x-6",
          padding: "py-4",
        };
    }
  };

  const variantClasses = getVariantClasses();

  const renderNavItem = (item: HeaderNavItem, isMobile: boolean = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isDropdownOpen = openDropdowns.has(item.id);

    return (
      <div
        key={item.id}
        className={`relative ${isMobile ? "block" : "inline-block"}`}
      >
        <button
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
            ${
              item.active
                ? "bg-[#0066CC] text-white"
                : item.disabled
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:text-[#0066CC] hover:bg-gray-100"
            }
            ${isMobile ? "w-full text-left" : ""}
          `}
        >
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}

          <span>{item.label}</span>

          {item.badge && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {item.badge}
            </span>
          )}

          {hasChildren && (
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>

        {hasChildren && isDropdownOpen && (
          <div
            className={`
            ${
              isMobile
                ? "mt-2 ml-4 space-y-1"
                : "absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50"
            }
          `}
          >
            {item.children!.map((child) => (
              <button
                key={child.id}
                onClick={() => handleItemClick(child)}
                disabled={child.disabled}
                className={`
                  flex items-center space-x-2 w-full px-3 py-2 text-sm text-left transition-colors duration-200
                  ${
                    child.active
                      ? "bg-[#0066CC] text-white"
                      : child.disabled
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:text-[#0066CC] hover:bg-gray-100"
                  }
                  ${isMobile ? "rounded-md" : ""}
                `}
              >
                {child.icon && (
                  <span className="flex-shrink-0">{child.icon}</span>
                )}

                <span>{child.label}</span>

                {child.badge && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {child.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <header
      className={`
        ${backgroundColor}
        ${showBorder ? "border-b border-gray-200" : ""}
        ${sticky ? "sticky top-0 z-40" : ""}
        ${className}
      `}
    >
      <div
        className={`${height} ${variantClasses.container} ${containerClassName}`}
      >
        <div className="flex items-center justify-between h-full">
          {/* Logo and Title */}
          <div className={`flex items-center space-x-4 ${logoClassName}`}>
            {logo && <div className="flex-shrink-0">{logo}</div>}

            {title && (
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {title}
              </h1>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav
            className={`hidden md:flex items-center ${variantClasses.spacing} ${navClassName}`}
          >
            {navigationItems.map((item) => renderNavItem(item))}
          </nav>

          {/* Search Bar */}
          {searchBar && (
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              {searchBar}
            </div>
          )}

          {/* User Actions */}
          <div
            className={`flex items-center ${variantClasses.spacing} ${actionsClassName}`}
          >
            {userActions}

            {/* Mobile Menu Button */}
            {showMobileMenu && (
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md text-gray-700 hover:text-[#0066CC] hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-2">
            {/* Mobile Search */}
            {searchBar && <div className="mb-4">{searchBar}</div>}

            {/* Mobile Navigation */}
            <nav className="space-y-1">
              {navigationItems.map((item) => renderNavItem(item, true))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
