import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  closable?: boolean;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  defaultActiveTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "pills" | "underlined" | "enclosed";
  size?: "sm" | "md" | "lg";
  scrollable?: boolean;
  centered?: boolean;
  className?: string;
  tabListClassName?: string;
  tabClassName?: string;
  tabPanelClassName?: string;
  showScrollButtons?: boolean;
  allowTabClose?: boolean;
  maxTabWidth?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultActiveTab,
  activeTab,
  onTabChange,
  onTabClose,
  orientation = "horizontal",
  variant = "default",
  size = "md",
  scrollable = false,
  centered = false,
  className = "",
  tabListClassName = "",
  tabClassName = "",
  tabPanelClassName = "",
  showScrollButtons = true,
  allowTabClose = false,
  maxTabWidth = "max-w-xs",
}) => {
  const [currentActiveTab, setCurrentActiveTab] = useState(
    activeTab || defaultActiveTab || items[0]?.id
  );
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabListRef = useRef<HTMLDivElement>(null);

  const isControlled = activeTab !== undefined;
  const actualActiveTab = isControlled ? activeTab : currentActiveTab;

  useEffect(() => {
    if (scrollable) {
      checkScrollability();
    }
  }, [items, scrollable]);

  const checkScrollability = () => {
    if (tabListRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabListRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  const handleTabClick = (tabId: string) => {
    if (!isControlled) {
      setCurrentActiveTab(tabId);
    }
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const handleTabClose = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTabClose) {
      onTabClose(tabId);
    }
  };

  const scrollTabs = (direction: "left" | "right") => {
    if (tabListRef.current) {
      const scrollAmount = 200;
      const newScrollLeft =
        tabListRef.current.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount);
      tabListRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          tab: "px-3 py-1.5 text-sm",
          badge: "text-xs px-1.5 py-0.5",
        };
      case "lg":
        return {
          tab: "px-6 py-3 text-base",
          badge: "text-sm px-2 py-1",
        };
      default: // md
        return {
          tab: "px-4 py-2 text-sm",
          badge: "text-xs px-2 py-0.5",
        };
    }
  };

  const getVariantClasses = () => {
    const baseClasses = "transition-all duration-200 ease-in-out";

    switch (variant) {
      case "pills":
        return {
          tabList: orientation === "horizontal" ? "space-x-2" : "space-y-2",
          tab: `${baseClasses} rounded-full font-medium`,
          activeTab: "bg-[#0066CC] text-white",
          inactiveTab: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
          disabledTab: "text-gray-400 cursor-not-allowed",
        };
      case "underlined":
        return {
          tabList:
            orientation === "horizontal"
              ? "border-b border-gray-200"
              : "border-r border-gray-200",
          tab: `${baseClasses} border-b-2 border-transparent font-medium`,
          activeTab: "text-[#0066CC] border-[#0066CC]",
          inactiveTab:
            "text-gray-600 hover:text-gray-900 hover:border-gray-300",
          disabledTab: "text-gray-400 cursor-not-allowed",
        };
      case "enclosed":
        return {
          tabList:
            orientation === "horizontal"
              ? "border-b border-gray-200"
              : "border-r border-gray-200",
          tab: `${baseClasses} border border-transparent rounded-t-lg font-medium`,
          activeTab: "bg-white text-[#0066CC] border-gray-200 border-b-white",
          inactiveTab: "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
          disabledTab: "text-gray-400 cursor-not-allowed",
        };
      default: // default
        return {
          tabList: orientation === "horizontal" ? "space-x-1" : "space-y-1",
          tab: `${baseClasses} rounded-md font-medium`,
          activeTab: "bg-[#0066CC] text-white",
          inactiveTab: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
          disabledTab: "text-gray-400 cursor-not-allowed",
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const variantClasses = getVariantClasses();
  const activeTabItem = items.find((item) => item.id === actualActiveTab);

  return (
    <div className={`${orientation === "vertical" ? "flex" : ""} ${className}`}>
      {/* Tab List */}
      <div
        className={`relative ${
          orientation === "vertical" ? "flex-shrink-0" : ""
        }`}
      >
        {/* Scroll Buttons */}
        {scrollable && showScrollButtons && orientation === "horizontal" && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center z-10">
            <button
              onClick={() => scrollTabs("left")}
              disabled={!canScrollLeft}
              className="p-1 bg-white shadow-sm border border-gray-200 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        )}

        <div
          ref={tabListRef}
          className={`
            ${orientation === "horizontal" ? "flex" : "flex flex-col"}
            ${variantClasses.tabList}
            ${
              scrollable && orientation === "horizontal"
                ? "overflow-x-auto scrollbar-hide"
                : ""
            }
            ${centered && orientation === "horizontal" ? "justify-center" : ""}
            ${scrollable && showScrollButtons ? "px-8" : ""}
            ${tabListClassName}
          `}
          onScroll={checkScrollability}
          role="tablist"
          aria-orientation={orientation}
        >
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.disabled && handleTabClick(item.id)}
              disabled={item.disabled}
              className={`
                relative inline-flex items-center justify-center whitespace-nowrap
                ${sizeClasses.tab}
                ${variantClasses.tab}
                ${actualActiveTab === item.id ? variantClasses.activeTab : ""}
                ${
                  item.disabled
                    ? variantClasses.disabledTab
                    : variantClasses.inactiveTab
                }
                ${maxTabWidth}
                ${tabClassName}
              `}
              role="tab"
              aria-selected={actualActiveTab === item.id}
              aria-controls={`tabpanel-${item.id}`}
              id={`tab-${item.id}`}
            >
              {item.icon && (
                <span className={`${item.label ? "mr-2" : ""}`}>
                  {item.icon}
                </span>
              )}

              <span className="truncate">{item.label}</span>

              {item.badge && (
                <span
                  className={`ml-2 inline-flex items-center rounded-full bg-gray-100 text-gray-800 font-medium ${sizeClasses.badge}`}
                >
                  {item.badge}
                </span>
              )}

              {(item.closable || allowTabClose) && (
                <button
                  onClick={(e) => handleTabClose(item.id, e)}
                  className="ml-2 p-0.5 rounded-full hover:bg-black hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                  aria-label={`Close ${item.label}`}
                >
                  <X size={14} />
                </button>
              )}
            </button>
          ))}
        </div>

        {/* Right Scroll Button */}
        {scrollable && showScrollButtons && orientation === "horizontal" && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center z-10">
            <button
              onClick={() => scrollTabs("right")}
              disabled={!canScrollRight}
              className="p-1 bg-white shadow-sm border border-gray-200 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Tab Panel */}
      <div
        className={`${
          orientation === "vertical" ? "flex-1 ml-6" : "mt-4"
        } ${tabPanelClassName}`}
        role="tabpanel"
        aria-labelledby={`tab-${actualActiveTab}`}
        id={`tabpanel-${actualActiveTab}`}
      >
        {activeTabItem?.content}
      </div>
    </div>
  );
};

// Modern compound component API for our CRM components
export interface TabsContextValue {
  value: string;
  onValueChange?: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(
  undefined
);

export interface ModernTabsProps {
  value: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const ModernTabs: React.FC<ModernTabsProps> = ({
  value,
  onValueChange,
  children,
  className = "",
}) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export const TabsList: React.FC<TabsListProps> = ({
  className = "",
  children,
}) => {
  return (
    <div
      className={`flex border-b border-gray-200 dark:border-gray-700 ${className}`}
      role="tablist"
    >
      {children}
    </div>
  );
};

export interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  className = "",
  children,
  disabled = false,
}) => {
  const context = React.useContext(TabsContext);
  const isActive = context?.value === value;

  const handleClick = () => {
    if (!disabled && context?.onValueChange) {
      context.onValueChange(value);
    }
  };

  return (
    <button
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
        isActive
          ? "border-blue-500 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      } ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
      onClick={handleClick}
      disabled={disabled}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
    >
      {children}
    </button>
  );
};

export interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  className = "",
  children,
}) => {
  const context = React.useContext(TabsContext);
  const isActive = context?.value === value;

  if (!isActive) return null;

  return (
    <div
      className={`mt-4 ${className}`}
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      id={`tabpanel-${value}`}
    >
      {children}
    </div>
  );
};

export default Tabs;
