import React, { useState } from "react";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: string | number;
  children?: SidebarItem[];
  expanded?: boolean;
}

export interface SidebarProps {
  items: SidebarItem[];
  variant?: "default" | "minimal" | "compact";
  width?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showToggleButton?: boolean;
  className?: string;
  headerClassName?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onItemClick?: (item: SidebarItem) => void;
  collapsible?: boolean;
  overlayOnMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  variant = "default",
  width = "w-64",
  collapsed = false,
  onToggleCollapse,
  showToggleButton = true,
  className = "",
  headerClassName = "",
  itemClassName = "",
  activeItemClassName = "",
  header,
  footer,
  onItemClick,
  collapsible = true,
  overlayOnMobile = false,
  isOpen = true,
  onClose,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = (item: SidebarItem) => {
    if (item.disabled) return;

    if (item.children && item.children.length > 0) {
      toggleItemExpansion(item.id);
    } else {
      if (item.onClick) {
        item.onClick();
      }
      if (onItemClick) {
        onItemClick(item);
      }
      if (overlayOnMobile) {
        setIsMobileOpen(false);
      }
    }
  };

  const getItemClasses = (item: SidebarItem, depth: number = 0) => {
    const baseClasses = `
      group flex items-center w-full text-sm font-medium rounded-lg transition-colors duration-200
      ${collapsed ? "justify-center px-2 py-3" : "justify-between px-3 py-2"}
      ${depth > 0 && !collapsed ? "ml-4" : ""}
      ${itemClassName}
    `;

    if (item.active) {
      return `${baseClasses} bg-[#0066CC] text-white ${activeItemClassName}`;
    }

    if (item.disabled) {
      return `${baseClasses} text-gray-400 dark:text-gray-600 cursor-not-allowed`;
    }

    return `${baseClasses} text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white`;
  };

  const renderItem = (item: SidebarItem, depth: number = 0) => {
    const isExpanded = expandedItems.has(item.id) || item.expanded;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="mb-1">
        <button
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          className={getItemClasses(item, depth)}
          title={collapsed ? item.label : undefined}
        >
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "min-w-0"
            }`}
          >
            {item.icon && (
              <span
                className={`flex-shrink-0 ${
                  !collapsed && item.label ? "mr-3" : ""
                }`}
              >
                {item.icon}
              </span>
            )}

            {!collapsed && item.label && (
              <span className="truncate">{item.label}</span>
            )}
          </div>

          {!collapsed && (
            <div className="flex items-center space-x-2">
              {item.badge && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  {item.badge}
                </span>
              )}

              {hasChildren && (
                <span className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </span>
              )}
            </div>
          )}
        </button>

        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div
      className={`
        ${collapsed ? "w-16" : width}
        ${
          overlayOnMobile
            ? "fixed inset-y-0 left-0 z-50 lg:static lg:inset-0"
            : ""
        }
        ${
          overlayOnMobile && !isMobileOpen
            ? "transform -translate-x-full lg:translate-x-0"
            : ""
        }
        h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300
        ${className}
      `}
    >
      {/* Header */}
      <div
        className={`p-4 border-b border-gray-200 dark:border-gray-700 ${headerClassName}`}
      >
        {/* Toggle Button - Visible when collapsed */}
        {showToggleButton && collapsible && (
          <div
            className={`mb-3 ${
              collapsed ? "flex justify-center" : "flex justify-end"
            }`}
          >
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-md hover:bg-gray-600 dark:hover:bg-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-700 dark:bg-gray-600 text-white shadow-sm"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu size={16} />
            </button>
          </div>
        )}

        {/* Header Content */}
        {!collapsed && header && <div>{header}</div>}

        {/* Mobile Close Button */}
        {overlayOnMobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2 absolute top-4 right-4"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">{items.map((item) => renderItem(item))}</div>
      </nav>

      {/* Footer */}
      {footer && !collapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );

  if (overlayOnMobile) {
    return (
      <>
        {/* Mobile overlay */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Mobile toggle button */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        {sidebarContent}
      </>
    );
  }

  return sidebarContent;
};

export default Sidebar;
