import React, { useState } from "react";
import { ChevronDown, Globe } from "lucide-react";

export interface MultilingualNavItem {
  id: string;
  label: Record<string, string>; // { en: 'Home', el: 'Αρχική' }
  href?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children?: MultilingualNavItem[];
  icon?: React.ReactNode;
  badge?: string | number;
  showOnlyInLanguages?: string[]; // Show only in specific languages
}

export interface MultilingualNavigationProps {
  items: MultilingualNavItem[];
  currentLanguage: string;
  availableLanguages: { code: string; name: string; flag?: string }[];
  onLanguageChange?: (language: string) => void;
  onItemClick?: (item: MultilingualNavItem) => void;
  className?: string;
  navClassName?: string;
  languageSelectorClassName?: string;
  showLanguageSelector?: boolean;
  variant?: "horizontal" | "vertical";
  fallbackLanguage?: string;
}

export const MultilingualNavigation: React.FC<MultilingualNavigationProps> = ({
  items,
  currentLanguage,
  availableLanguages,
  onLanguageChange,
  onItemClick,
  className = "",
  navClassName = "",
  languageSelectorClassName = "",
  showLanguageSelector = true,
  variant = "horizontal",
  fallbackLanguage = "en",
}) => {
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const getLocalizedLabel = (labelObject: Record<string, string>) => {
    return (
      labelObject[currentLanguage] ||
      labelObject[fallbackLanguage] ||
      Object.values(labelObject)[0] ||
      ""
    );
  };

  const shouldShowItem = (item: MultilingualNavItem) => {
    if (!item.showOnlyInLanguages) return true;
    return item.showOnlyInLanguages.includes(currentLanguage);
  };

  const handleItemClick = (item: MultilingualNavItem) => {
    if (item.disabled) return;

    if (item.onClick) {
      item.onClick();
    }
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
    setIsLanguageDropdownOpen(false);
  };

  const getCurrentLanguage = () => {
    return availableLanguages.find((lang) => lang.code === currentLanguage);
  };

  const renderNavItem = (item: MultilingualNavItem, depth: number = 0) => {
    if (!shouldShowItem(item)) return null;

    const hasChildren = item.children && item.children.length > 0;
    const localizedLabel = getLocalizedLabel(item.label);

    return (
      <div key={item.id} className={`relative ${depth > 0 ? "ml-4" : ""}`}>
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
            ${variant === "vertical" ? "w-full text-left" : ""}
          `}
        >
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}

          <span>{localizedLabel}</span>

          {item.badge && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {item.badge}
            </span>
          )}

          {hasChildren && <ChevronDown size={16} />}
        </button>

        {hasChildren && (
          <div
            className={`
            ${
              variant === "vertical"
                ? "mt-2 space-y-1"
                : "absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50"
            }
          `}
          >
            {item.children!.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderLanguageSelector = () => {
    if (!showLanguageSelector) return null;

    const currentLang = getCurrentLanguage();

    return (
      <div className={`relative ${languageSelectorClassName}`}>
        <button
          onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
          className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-[#0066CC] hover:bg-gray-100 transition-colors duration-200"
          aria-label="Select language"
        >
          <Globe size={16} />
          <span>{currentLang?.name || currentLanguage.toUpperCase()}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              isLanguageDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isLanguageDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`
                  flex items-center space-x-3 w-full px-3 py-2 text-sm text-left transition-colors duration-200
                  ${
                    language.code === currentLanguage
                      ? "bg-[#0066CC] text-white"
                      : "text-gray-700 hover:text-[#0066CC] hover:bg-gray-100"
                  }
                `}
              >
                {language.flag && (
                  <span className="text-lg">{language.flag}</span>
                )}
                <span>{language.name}</span>
                {language.code === currentLanguage && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`
      ${
        variant === "horizontal"
          ? "flex items-center space-x-4"
          : "flex flex-col space-y-2"
      }
      ${className}
    `}
    >
      {/* Navigation Items */}
      <nav
        className={`
        ${
          variant === "horizontal"
            ? "flex items-center space-x-4"
            : "flex flex-col space-y-1"
        }
        ${navClassName}
      `}
      >
        {items.map((item) => renderNavItem(item))}
      </nav>

      {/* Language Selector */}
      {renderLanguageSelector()}
    </div>
  );
};

export default MultilingualNavigation;
