import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../contexts/TranslationContext";
import { LanguageSelector } from "../multilingual/LanguageSelector";
import { ThemeSelector } from "../multilingual/ThemeSelector";
import { ThemeChooser } from "../multilingual/ThemeChooser";
import { LocalizedText } from "../multilingual/LocalizedText";
import { Button } from "../ui/Button";
import { Language } from "../../types";
import { renderIcon } from "../../utils/iconMapper";

export interface NavigationItem {
  id: string;
  label: Record<Language, string> | string;
  href?: string;
  icon?: React.ReactNode | string;
  children?: NavigationItem[];
  active?: boolean;
  disabled?: boolean;
  action?: string; // For logout and other actions
  badge?: {
    text: string;
    variant?: "primary" | "secondary" | "success" | "warning" | "error";
  };
}

export interface NavigationProps {
  /** Navigation items */
  items: NavigationItem[];
  /** Logo component or logo config */
  logo?:
    | React.ReactNode
    | {
        text: string;
        subtitle?: string;
        icon?: string;
      };
  /** Show language selector */
  showLanguageSelector?: boolean;
  /** Show theme selector */
  showThemeSelector?: boolean;
  /** Show theme chooser (base theme selection) */
  showThemeChooser?: boolean;
  /** Show user menu */
  showUserMenu?: boolean;
  /** User menu items */
  userMenu?: NavigationItem[];
  /** User menu style - metadata-driven */
  userMenuStyle?: "dropdown" | "inline" | "buttons";
  /** Current user info */
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
    role?: string;
    showProfile?: boolean;
    showAvatar?: boolean;
  };
  /** Mobile breakpoint */
  mobileBreakpoint?: "sm" | "md" | "lg";
  /** Variant */
  variant?: "horizontal" | "sidebar";
  /** Background color - DEPRECATED: Now uses theme CSS variables */
  background?: "white" | "gray" | "blue" | "professional";
  /** Sticky navigation */
  sticky?: boolean;
  /** Additional actions */
  actions?: React.ReactNode;
  /** Action handlers */
  onAction?: (action: string, item: NavigationItem) => void;
  /** Mobile menu toggle - for sidebar integration */
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
  /** Sidebar sections for mobile menu */
  sidebarSections?: Array<{
    title?: string;
    title_key?: string;
    items: Array<{
      label?: string;
      label_key?: string;
      route?: string;
      icon?: string;
      id?: string;
    }>;
  }>;
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  items,
  logo,
  showLanguageSelector = true,
  showThemeSelector = true,
  showThemeChooser = false,
  showUserMenu = false,
  userMenu,
  userMenuStyle = "dropdown",
  user,
  mobileBreakpoint = "md",
  variant = "horizontal",
  background = "professional",
  sticky = true,
  actions,
  onAction,
  onMobileMenuToggle,
  mobileMenuOpen,
  sidebarSections = [],
  className = "",
}) => {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  const toggleMobileMenu = () => {
    if (onMobileMenuToggle) {
      // Use external toggle for sidebar integration
      onMobileMenuToggle();
    } else {
      // Use internal state for standalone navigation
      setIsMobileMenuOpen(!isMobileMenuOpen);
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

  const handleItemAction = (item: NavigationItem) => {
    if (item.action && onAction) {
      onAction(item.action, item);
    } else if (item.href) {
      router.push(item.href);
    }
  };

  // All colors now use CSS variables - no hardcoded values
  const navigationClasses = {
    background: "bg-card border-b border-border",
    link: "text-foreground hover:text-foreground hover:bg-accent",
    active: "text-primary-foreground bg-primary",
    dropdown: "bg-card border border-border shadow-lg",
    userMenu: "text-foreground hover:bg-accent",
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openDropdowns.has(item.id);

    // Render icon - support both string and ReactNode
    const renderItemIcon = (icon: React.ReactNode | string | undefined) => {
      if (!icon) return null;
      if (typeof icon === "string") {
        return renderIcon(icon, "w-4 h-4 flex-shrink-0");
      }
      return <span className="flex-shrink-0">{icon}</span>;
    };

    // Render label - support both localized and translation keys
    const renderItemLabel = (label: Record<Language, string> | string) => {
      if (typeof label === "string") {
        // Try to translate the string (in case it's a translation key)
        const translated = t(label, { defaultValue: label });
        return <span className="flex-1 text-left">{translated}</span>;
      }
      return <LocalizedText text={label} className="flex-1 text-left" />;
    };

    const itemContent = (
      <div className="flex items-center space-x-2 w-full">
        {renderItemIcon(item.icon)}
        {renderItemLabel(item.label)}
        {item.badge && (
          <span
            className={`
            px-2 py-1 text-xs rounded-full
            ${
              item.badge.variant === "error"
                ? "bg-destructive text-destructive-foreground"
                : item.badge.variant === "warning"
                  ? "bg-accent text-accent-foreground"
                  : item.badge.variant === "success"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
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
              ${item.active ? navigationClasses.active : navigationClasses.link}
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
                  ? `absolute top-full left-0 mt-1 w-48 ${navigationClasses.dropdown} rounded-md z-50`
                  : "ml-4 mt-1"
              }`}
            >
              {item.children?.map((child) => (
                <React.Fragment key={child.id}>
                  {renderNavigationItem(child, level + 1)}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => handleItemAction(item)}
        disabled={item.disabled}
        className={`
          flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors
          ${item.active ? navigationClasses.active : navigationClasses.link}
          ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {itemContent}
      </button>
    );
  };

  const UserMenu: React.FC = () => {
    if (!showUserMenu && !user && !userMenu) return null;

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const hasUserMenu = userMenu && userMenu.length > 0;

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => hasUserMenu && setIsUserMenuOpen(!isUserMenuOpen)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${navigationClasses.userMenu}`}
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-accent-foreground">
                {user?.name?.[0]?.toUpperCase() || "U"}
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
          {hasUserMenu && (
            <svg
              className={`w-4 h-4 transition-transform ${
                isUserMenuOpen ? "rotate-180" : ""
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
        </button>

        {/* User Menu Dropdown */}
        {hasUserMenu && isUserMenuOpen && (
          <div
            className={`absolute right-0 mt-2 w-48 ${navigationClasses.dropdown} rounded-md z-50`}
          >
            <div className="py-1">
              {userMenu?.map((menuItem) => (
                <button
                  key={menuItem.id}
                  onClick={() => {
                    handleItemAction(menuItem);
                    setIsUserMenuOpen(false);
                  }}
                  disabled={menuItem.disabled}
                  className={`
                    flex items-center w-full px-4 py-2 text-sm transition-colors
                    ${navigationClasses.userMenu}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {typeof menuItem.icon === "string" &&
                    renderIcon(menuItem.icon, "w-4 h-4 mr-3")}
                  {typeof menuItem.label === "string" ? (
                    t(menuItem.label, { defaultValue: menuItem.label })
                  ) : (
                    <LocalizedText text={menuItem.label} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (variant === "horizontal") {
    return (
      <nav
        className={`
        w-full
        ${navigationClasses.background}
        ${sticky ? "sticky top-0 z-40" : ""}
        ${className}
      `}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Side - Logo or Spacer */}
            <div className="flex-shrink-0">
              {logo ? (
                React.isValidElement(logo) ? (
                  logo
                ) : typeof logo === "object" && "text" in logo ? (
                  <div className="flex items-center">
                    <div className="bg-blue-600 text-white p-2 rounded-lg mr-3 flex-shrink-0">
                      {logo.icon ? (
                        logo.icon.startsWith("/") ? (
                          <img src={logo.icon} alt="Logo" className="w-6 h-6" />
                        ) : (
                          renderIcon(logo.icon, "w-6 h-6")
                        )
                      ) : (
                        <div className="w-6 h-6 flex items-center justify-center font-bold text-sm">
                          {logo.text.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 hidden sm:block">
                      <h2 className="text-lg font-bold text-foreground truncate">
                        {logo.text}
                      </h2>
                      {logo.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {logo.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  logo
                )
              ) : (
                <div></div>
              )}
            </div>

            {/* Right Side - All Actions Right-Aligned */}
            <div className="flex items-center space-x-2">
              {actions}

              {showThemeSelector && (
                <ThemeSelector
                  variant="toggle"
                  size="sm"
                  className="hidden sm:block"
                />
              )}

              {showThemeChooser && (
                <ThemeChooser
                  variant="dropdown"
                  size="sm"
                  className="hidden sm:block"
                />
              )}

              {showLanguageSelector && (
                <LanguageSelector
                  variant="dropdown"
                  size="sm"
                  className="hidden sm:block"
                />
              )}

              {/* Simple icon-only user menu */}
              {showUserMenu &&
                userMenu &&
                userMenu.map((menuItem) => (
                  <button
                    key={menuItem.id}
                    type="button"
                    onClick={() => handleItemAction(menuItem)}
                    className={`p-2 rounded-md transition-colors ${navigationClasses.userMenu}`}
                    title={
                      typeof menuItem.label === "string"
                        ? t(menuItem.label, { defaultValue: menuItem.label })
                        : menuItem.label.en || menuItem.label.el
                    }
                  >
                    {typeof menuItem.icon === "string" &&
                      renderIcon(menuItem.icon, "w-5 h-5")}
                  </button>
                ))}

              {/* Mobile Menu Button - Show based on mobileBreakpoint */}
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md transition-colors hover:bg-accent order-last"
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
                      (
                        mobileMenuOpen !== undefined
                          ? mobileMenuOpen
                          : isMobileMenuOpen
                      )
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu - Show sidebar sections */}
          {(mobileMenuOpen !== undefined
            ? mobileMenuOpen
            : isMobileMenuOpen) && (
            <div className="md:hidden pb-4">
              {/* Logo and branding at top */}
              {logo && typeof logo === "object" && "text" in logo && (
                <div className="px-4 py-4 border-b border-border">
                  <div className="flex items-center">
                    <div className="bg-blue-600 text-white p-2 rounded-lg mr-3 flex-shrink-0">
                      {logo.icon ? (
                        logo.icon.startsWith("/") ? (
                          <img src={logo.icon} alt="Logo" className="w-6 h-6" />
                        ) : (
                          renderIcon(logo.icon, "w-6 h-6")
                        )
                      ) : (
                        <div className="w-6 h-6 flex items-center justify-center font-bold text-sm">
                          {logo.text.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-foreground truncate">
                        {logo.text}
                      </h2>
                      {logo.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {logo.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Controls at top of mobile menu */}
              <div className="px-4 py-3 border-b border-border space-y-3">
                {showLanguageSelector && (
                  <LanguageSelector variant="buttons" size="sm" />
                )}
                {showThemeSelector && (
                  <ThemeSelector variant="toggle" size="sm" />
                )}
              </div>

              {/* Navigation menu items */}
              <div className="space-y-1 px-2 py-2">
                {/* Show sidebar sections in mobile menu */}
                {sidebarSections && sidebarSections.length > 0 ? (
                  sidebarSections.map((section, sectionIndex) => (
                    <div key={`section-${sectionIndex}`}>
                      {/* Section header */}
                      {(section.title || section.title_key) && (
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {section.title_key
                            ? t(section.title_key)
                            : section.title}
                        </div>
                      )}
                      {/* Section items */}
                      {section.items.map((item, itemIndex) => (
                        <a
                          key={`${sectionIndex}-${itemIndex}`}
                          href={item.route}
                          className="flex items-center px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                        >
                          {item.icon && (
                            <span className="mr-3">
                              {renderIcon(item.icon, "w-4 h-4")}
                            </span>
                          )}
                          {item.label_key ? t(item.label_key) : item.label}
                        </a>
                      ))}
                    </div>
                  ))
                ) : items && items.length > 0 ? (
                  /* Fallback to navigation items if no sidebar sections */
                  items.map((item) => (
                    <React.Fragment key={item.id}>
                      {renderNavigationItem(item)}
                    </React.Fragment>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground px-3 py-2">
                    No menu items available
                  </div>
                )}
              </div>
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
  separator = <span className="text-muted-foreground">/</span>,
  className = "",
}) => {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {items?.map((item, index) => (
        <React.Fragment key={item.id}>
          {item.href ? (
            <a
              href={item.href}
              className="flex items-center space-x-1 text-primary hover:text-primary/80 transition-colors"
            >
              {item.icon && <span>{item.icon}</span>}
              <LocalizedText text={item.label} />
            </a>
          ) : (
            <span className="flex items-center space-x-1 text-muted-foreground">
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
