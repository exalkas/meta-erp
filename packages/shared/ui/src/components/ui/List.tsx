import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

interface ListItem {
  id: string;
  primary: string;
  secondary?: string;
  tertiary?: string;
  avatar?: React.ReactNode;
  icon?: React.ReactNode;
  image?: string;
  action?: React.ReactNode;
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  metadata?: Record<string, any>;
}

interface ListProps {
  items: ListItem[];
  variant?: "default" | "filled" | "outlined";
  size?: "sm" | "md" | "lg";
  orientation?: "vertical" | "horizontal";
  selectable?: boolean;
  multiSelect?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (selectedItems: string[]) => void;
  onItemClick?: (item: ListItem) => void;
  onItemDoubleClick?: (item: ListItem) => void;
  className?: string;
  itemClassName?: string;
  dense?: boolean;
  dividers?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  maxHeight?: number;
  virtualized?: boolean;
  loading?: boolean;
  loadingCount?: number;
  empty?: React.ReactNode;
  emptyText?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  sortable?: boolean;
  sortOptions?: Array<{
    key: string;
    label: string;
    direction?: "asc" | "desc";
  }>;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  renderItem?: (item: ListItem, index: number) => React.ReactNode;
  renderAction?: (item: ListItem) => React.ReactNode;
  showCheckbox?: boolean;
  dragAndDrop?: boolean;
  onDragEnd?: (result: { source: number; destination: number }) => void;
}

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 15l7-7 7 7"
    />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
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
);

const LoadingItem: React.FC<{ size: "sm" | "md" | "lg"; dense: boolean }> = ({
  size,
  dense,
}) => {
  const sizeClasses = {
    sm: dense ? "py-1 px-2" : "py-2 px-3",
    md: dense ? "py-2 px-3" : "py-3 px-4",
    lg: dense ? "py-3 px-4" : "py-4 px-5",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-b border-gray-200 animate-pulse`}
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
};

const ListItemComponent: React.FC<{
  item: ListItem;
  index: number;
  size: "sm" | "md" | "lg";
  variant: "default" | "filled" | "outlined";
  dense: boolean;
  dividers: boolean;
  selectable: boolean;
  multiSelect: boolean;
  selectedItems: string[];
  onSelectionChange: (selectedItems: string[]) => void;
  onItemClick?: (item: ListItem) => void;
  onItemDoubleClick?: (item: ListItem) => void;
  className?: string;
  renderItem?: (item: ListItem, index: number) => React.ReactNode;
  renderAction?: (item: ListItem) => React.ReactNode;
  showCheckbox: boolean;
  dragAndDrop: boolean;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
}> = ({
  item,
  index,
  size,
  variant,
  dense,
  dividers,
  selectable,
  multiSelect,
  selectedItems,
  onSelectionChange,
  onItemClick,
  onItemDoubleClick,
  className,
  renderItem,
  renderAction,
  showCheckbox,
  dragAndDrop,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const isSelected = selectedItems.includes(item.id);

  const sizeClasses = {
    sm: dense ? "py-1 px-2" : "py-2 px-3",
    md: dense ? "py-2 px-3" : "py-3 px-4",
    lg: dense ? "py-3 px-4" : "py-4 px-5",
  };

  const variantClasses = {
    default: "bg-white hover:bg-gray-50",
    filled: "bg-gray-50 hover:bg-gray-100",
    outlined: "border border-gray-200 hover:border-gray-300",
  };

  const handleClick = () => {
    if (item.disabled) return;

    if (selectable) {
      let newSelectedItems: string[];
      if (multiSelect) {
        newSelectedItems = isSelected
          ? selectedItems.filter((id) => id !== item.id)
          : [...selectedItems, item.id];
      } else {
        newSelectedItems = isSelected ? [] : [item.id];
      }
      onSelectionChange(newSelectedItems);
    }

    item.onClick?.();
    onItemClick?.(item);
  };

  const handleDoubleClick = () => {
    if (item.disabled) return;
    item.onDoubleClick?.();
    onItemDoubleClick?.(item);
  };

  if (renderItem) {
    return (
      <div
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${dividers ? "border-b border-gray-200" : ""}
          ${isSelected ? "bg-blue-50 border-blue-200" : ""}
          ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${selectable && !item.disabled ? "hover:bg-blue-50" : ""}
          ${className || ""}
          transition-colors duration-200
        `}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        draggable={dragAndDrop && !item.disabled}
        onDragStart={(e) => onDragStart?.(e, index)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop?.(e, index)}
      >
        {renderItem(item, index)}
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${dividers ? "border-b border-gray-200" : ""}
        ${isSelected ? "bg-blue-50 border-blue-200" : ""}
        ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${selectable && !item.disabled ? "hover:bg-blue-50" : ""}
        ${className || ""}
        transition-colors duration-200
      `}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      draggable={dragAndDrop && !item.disabled}
      onDragStart={(e) => onDragStart?.(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, index)}
    >
      <div className="flex items-center space-x-3">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleClick}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={item.disabled}
          />
        )}

        {item.avatar && <div className="flex-shrink-0">{item.avatar}</div>}

        {item.icon && <div className="flex-shrink-0">{item.icon}</div>}

        {item.image && (
          <div className="flex-shrink-0">
            <img
              src={item.image}
              alt={item.primary}
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {item.primary}
          </div>
          {item.secondary && (
            <div className="text-sm text-gray-500 truncate">
              {item.secondary}
            </div>
          )}
          {item.tertiary && (
            <div className="text-xs text-gray-400 truncate">
              {item.tertiary}
            </div>
          )}
        </div>

        {(item.action || renderAction) && (
          <div className="flex-shrink-0">
            {renderAction ? renderAction(item) : item.action}
          </div>
        )}
      </div>
    </div>
  );
};

export const List: React.FC<ListProps> = ({
  items,
  variant = "default",
  size = "md",
  orientation = "vertical",
  selectable = false,
  multiSelect = false,
  selectedItems = [],
  onSelectionChange,
  onItemClick,
  onItemDoubleClick,
  className = "",
  itemClassName = "",
  dense = false,
  dividers = false,
  padding = "none",
  maxHeight,
  virtualized = false,
  loading = false,
  loadingCount = 5,
  empty,
  emptyText,
  header,
  footer,
  searchable = false,
  searchPlaceholder,
  onSearch,
  sortable = false,
  sortOptions = [],
  onSort,
  renderItem,
  renderAction,
  showCheckbox = false,
  dragAndDrop = false,
  onDragEnd,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const paddingClasses = {
    none: "",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  };

  const handleSelectionChange = useCallback(
    (newSelectedItems: string[]) => {
      onSelectionChange?.(newSelectedItems);
    },
    [onSelectionChange]
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      onSearch?.(query);
    },
    [onSearch]
  );

  const handleSort = useCallback(
    (key: string) => {
      const newDirection =
        sortKey === key && sortDirection === "asc" ? "desc" : "asc";
      setSortKey(key);
      setSortDirection(newDirection);
      onSort?.(key, newDirection);
    },
    [sortKey, sortDirection, onSort]
  );

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();

      if (draggedIndex !== null && draggedIndex !== index) {
        onDragEnd?.({ source: draggedIndex, destination: index });
      }

      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [draggedIndex, onDragEnd]
  );

  const renderContent = () => {
    if (loading) {
      return Array.from({ length: loadingCount }).map((_, index) => (
        <LoadingItem key={index} size={size} dense={dense} />
      ));
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {empty || (
            <div>
              <p className="text-sm">{emptyText || t("no_items_found")}</p>
            </div>
          )}
        </div>
      );
    }

    return items.map((item, index) => (
      <ListItemComponent
        key={item.id}
        item={item}
        index={index}
        size={size}
        variant={variant}
        dense={dense}
        dividers={dividers}
        selectable={selectable}
        multiSelect={multiSelect}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onItemClick={onItemClick}
        onItemDoubleClick={onItemDoubleClick}
        className={itemClassName}
        renderItem={renderItem}
        renderAction={renderAction}
        showCheckbox={showCheckbox}
        dragAndDrop={dragAndDrop}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
    ));
  };

  return (
    <div className={`${paddingClasses[padding]} ${className}`}>
      {(header || searchable || sortable) && (
        <div className="mb-4 space-y-4">
          {header && <div>{header}</div>}

          {searchable && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={searchPlaceholder || t("search_items")}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {sortable && sortOptions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleSort(option.key)}
                  className={`
                    flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors
                    ${
                      sortKey === option.key
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }
                  `}
                >
                  <span>{option.label}</span>
                  {sortKey === option.key &&
                    (sortDirection === "asc" ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    ))}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        className={`
          ${
            orientation === "horizontal"
              ? "flex space-x-4 overflow-x-auto"
              : "space-y-0"
          }
          ${maxHeight ? "overflow-y-auto" : ""}
          bg-white rounded-lg border border-gray-200
        `}
        style={{ maxHeight: maxHeight ? `${maxHeight}px` : undefined }}
      >
        {renderContent()}
      </div>

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
};

export default List;
