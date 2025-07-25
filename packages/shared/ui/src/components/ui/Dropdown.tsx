"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { ChevronDown, Check, Minus } from "lucide-react";

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  onClick?: () => void;
  href?: string;
  target?: string;
  shortcut?: string;
}

export interface DropdownProps {
  items: DropdownItem[];
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  offset?: number;
  disabled?: boolean;
  closeOnSelect?: boolean;
  className?: string;
  menuClassName?: string;
  width?: number;
  maxHeight?: number;
  searchable?: boolean;
  placeholder?: string;
  onSelect?: (item: DropdownItem) => void;
  onOpenChange?: (open: boolean) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({
  items,
  children,
  trigger,
  placement = "bottom-start",
  offset = 4,
  disabled = false,
  closeOnSelect = true,
  className = "",
  menuClassName = "",
  width = 200,
  maxHeight = 300,
  searchable = false,
  placeholder,
  onSelect,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredItems = searchable
    ? items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  const selectableItems = filteredItems.filter(
    (item) => !item.disabled && !item.separator
  );

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled || item.separator) return;

    if (item.onClick) {
      item.onClick();
    }

    if (item.href) {
      window.open(item.href, item.target || "_self");
    }

    onSelect?.(item);

    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) =>
          prev < selectableItems.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : selectableItems.length - 1
        );
        break;
      case "Enter":
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < selectableItems.length) {
          handleSelect(selectableItems[focusedIndex]);
        }
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  const getMenuStyle = () => {
    if (!triggerRef.current) return {};

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const style: React.CSSProperties = {
      position: "fixed",
      zIndex: 9999,
      minWidth: `${width}px`,
      maxHeight: `${maxHeight}px`,
    };

    switch (placement) {
      case "bottom-start":
        style.top = triggerRect.bottom + offset;
        style.left = triggerRect.left;
        break;
      case "bottom-end":
        style.top = triggerRect.bottom + offset;
        style.right = window.innerWidth - triggerRect.right;
        break;
      case "top-start":
        style.bottom = window.innerHeight - triggerRect.top + offset;
        style.left = triggerRect.left;
        break;
      case "top-end":
        style.bottom = window.innerHeight - triggerRect.top + offset;
        style.right = window.innerWidth - triggerRect.right;
        break;
    }

    return style;
  };

  // Handle click outside
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          triggerRef.current &&
          menuRef.current &&
          !triggerRef.current.contains(event.target as Node) &&
          !menuRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const renderItem = (item: DropdownItem, index: number) => {
    if (item.separator) {
      return (
        <div key={item.id} className="my-1">
          <div className="border-t border-gray-200" />
        </div>
      );
    }

    const selectableIndex = selectableItems.indexOf(item);
    const isFocused = focusedIndex === selectableIndex;

    return (
      <div
        key={item.id}
        className={`
          px-3 py-2 text-sm cursor-pointer transition-colors
          ${
            item.disabled
              ? "text-gray-400 cursor-not-allowed"
              : item.danger
              ? "text-red-600 hover:bg-red-50 hover:text-red-700"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          }
          ${isFocused && !item.disabled ? "bg-blue-50 text-blue-700" : ""}
        `}
        onClick={() => handleSelect(item)}
        onMouseEnter={() => setFocusedIndex(selectableIndex)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {item.icon && (
              <div className="w-4 h-4 flex-shrink-0">{item.icon}</div>
            )}
            <span className="truncate">{item.label}</span>
          </div>
          {item.shortcut && (
            <span className="text-xs text-gray-400 ml-2">{item.shortcut}</span>
          )}
        </div>
      </div>
    );
  };

  const defaultTrigger = (
    <button
      className={`
        inline-flex items-center justify-center px-3 py-2 text-sm font-medium 
        text-gray-700 bg-white border border-gray-300 rounded-md
        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      disabled={disabled}
    >
      {placeholder || t("dropdown.select")}
      <ChevronDown
        className={`ml-2 w-4 h-4 transition-transform ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="outline-none"
      >
        {trigger || children || defaultTrigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          style={getMenuStyle()}
          className={`
            bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden
            transition-all duration-200 ease-in-out
            ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"}
            ${menuClassName}
          `}
          role="listbox"
          aria-orientation="vertical"
        >
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <input
                ref={searchRef}
                type="text"
                placeholder={t("dropdown.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {filteredItems.length > 0 ? (
              filteredItems.map(renderItem)
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchable && searchQuery
                  ? t("dropdown.noResults")
                  : t("dropdown.noItems")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
