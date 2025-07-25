"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { Checkbox } from "../ui/Checkbox";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Tooltip } from "../ui/Tooltip";
import {
  File,
  Folder,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  Code,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Download,
  Share2,
  Trash2,
  Edit,
  Eye,
  Copy,
  Move,
  Star,
  Lock,
  Unlock,
  Calendar,
  User,
  HardDrive,
} from "lucide-react";

// Simple utility function for className concatenation
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

export interface FileTableItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  mimeType?: string;
  extension?: string;
  createdAt: Date;
  modifiedAt: Date;
  createdBy: string;
  modifiedBy: string;
  isShared?: boolean;
  isLocked?: boolean;
  isStarred?: boolean;
  permissions?: {
    read: boolean;
    write: boolean;
    delete: boolean;
    share: boolean;
  };
  version?: number;
  status?: "synced" | "syncing" | "error" | "offline";
  thumbnail?: string;
  downloadUrl?: string;
  shareUrl?: string;
  path?: string;
  parentId?: string;
  tags?: string[];
  description?: string;
}

export interface FileTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (item: FileTableItem) => React.ReactNode;
}

interface FileTableProps {
  items: FileTableItem[];
  columns?: FileTableColumn[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string, order: "asc" | "desc") => void;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onItemClick?: (item: FileTableItem) => void;
  onItemDoubleClick?: (item: FileTableItem) => void;
  onAction?: (action: string, item: FileTableItem) => void;
  onBulkAction?: (action: string, items: FileTableItem[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  showCheckboxes?: boolean;
  showActions?: boolean;
  showBulkActions?: boolean;
  actions?: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
    onClick: (item: FileTableItem) => void;
    disabled?: (item: FileTableItem) => boolean;
    hidden?: (item: FileTableItem) => boolean;
  }>;
  bulkActions?: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
    onClick: (items: FileTableItem[]) => void;
    disabled?: (items: FileTableItem[]) => boolean;
  }>;
  className?: string;
}

const getFileIcon = (item: FileTableItem) => {
  if (item.type === "folder") return <Folder className="h-4 w-4" />;

  const extension = item.extension?.toLowerCase();
  const mimeType = item.mimeType?.toLowerCase();

  if (mimeType?.startsWith("image/")) return <Image className="h-4 w-4" />;
  if (mimeType?.startsWith("video/")) return <Video className="h-4 w-4" />;
  if (mimeType?.startsWith("audio/")) return <Music className="h-4 w-4" />;
  if (mimeType?.includes("text/") || extension === "txt")
    return <FileText className="h-4 w-4" />;
  if (mimeType?.includes("zip") || mimeType?.includes("rar"))
    return <Archive className="h-4 w-4" />;
  if (
    extension &&
    ["js", "ts", "jsx", "tsx", "html", "css", "json", "xml"].includes(extension)
  ) {
    return <Code className="h-4 w-4" />;
  }

  return <File className="h-4 w-4" />;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "-";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("el-GR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getStatusBadge = (status?: string) => {
  if (!status) return null;

  const statusConfig = {
    synced: { label: "Synced", variant: "default" as const },
    syncing: { label: "Syncing", variant: "secondary" as const },
    error: { label: "Error", variant: "error" as const },
    offline: { label: "Offline", variant: "outline" as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const FileTable = ({
  items,
  columns,
  sortBy,
  sortOrder = "asc",
  onSort,
  selectedItems = [],
  onSelectionChange,
  onItemClick,
  onItemDoubleClick,
  onAction,
  onBulkAction,
  loading = false,
  emptyMessage,
  showCheckboxes = true,
  showActions = true,
  showBulkActions = true,
  actions = [],
  bulkActions = [],
  className,
}: FileTableProps) => {
  const { t } = useTranslation();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const defaultColumns: FileTableColumn[] = [
    {
      key: "name",
      label: t("files.name"),
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2 min-w-0">
          {getFileIcon(item)}
          <span className="truncate font-medium">{item.name}</span>
          {item.isStarred && (
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
          )}
          {item.isLocked && <Lock className="h-3 w-3 text-gray-500" />}
          {item.isShared && <Share2 className="h-3 w-3 text-blue-500" />}
        </div>
      ),
    },
    {
      key: "size",
      label: t("files.size"),
      sortable: true,
      align: "right" as const,
      render: (item) => (
        <span className="text-sm text-gray-500">
          {formatFileSize(item.size)}
        </span>
      ),
    },
    {
      key: "modifiedAt",
      label: t("files.modified"),
      sortable: true,
      render: (item) => (
        <div className="text-sm text-gray-500">
          <div>{formatDate(item.modifiedAt)}</div>
          <div className="text-xs">by {item.modifiedBy}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: t("files.status"),
      sortable: true,
      render: (item) => getStatusBadge(item.status),
    },
  ];

  const displayColumns = columns || defaultColumns;

  const sortedItems = useMemo(() => {
    if (!sortBy) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortBy as keyof FileTableItem];
      const bValue = b[sortBy as keyof FileTableItem];

      if (aValue === bValue) return 0;
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      const result = aValue < bValue ? -1 : 1;
      return sortOrder === "asc" ? result : -result;
    });
  }, [items, sortBy, sortOrder]);

  const handleSort = (key: string) => {
    if (!onSort) return;

    const newOrder = sortBy === key && sortOrder === "asc" ? "desc" : "asc";
    onSort(key, newOrder);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange(items.map((item) => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange([...selectedItems, itemId]);
    } else {
      onSelectionChange(selectedItems.filter((id) => id !== itemId));
    }
  };

  const defaultActions = [
    {
      key: "download",
      label: t("files.download"),
      icon: <Download className="h-4 w-4" />,
      onClick: (item: FileTableItem) => onAction?.("download", item),
      hidden: (item: FileTableItem) => item.type === "folder",
    },
    {
      key: "share",
      label: t("files.share"),
      icon: <Share2 className="h-4 w-4" />,
      onClick: (item: FileTableItem) => onAction?.("share", item),
      disabled: (item: FileTableItem) => !item.permissions?.share,
    },
    {
      key: "rename",
      label: t("files.rename"),
      icon: <Edit className="h-4 w-4" />,
      onClick: (item: FileTableItem) => onAction?.("rename", item),
      disabled: (item: FileTableItem) => !item.permissions?.write,
    },
    {
      key: "copy",
      label: t("files.copy"),
      icon: <Copy className="h-4 w-4" />,
      onClick: (item: FileTableItem) => onAction?.("copy", item),
    },
    {
      key: "move",
      label: t("files.move"),
      icon: <Move className="h-4 w-4" />,
      onClick: (item: FileTableItem) => onAction?.("move", item),
      disabled: (item: FileTableItem) => !item.permissions?.write,
    },
    {
      key: "delete",
      label: t("files.delete"),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (item: FileTableItem) => onAction?.("delete", item),
      disabled: (item: FileTableItem) => !item.permissions?.delete,
    },
  ];

  const displayActions = actions.length > 0 ? actions : defaultActions;

  const selectedItemsData = items.filter((item) =>
    selectedItems.includes(item.id)
  );
  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const someSelected =
    selectedItems.length > 0 && selectedItems.length < items.length;

  if (loading) {
    return (
      <div className="w-full">
        <div className="border rounded-lg overflow-hidden">
          <div className="border-b bg-gray-50">
            <div className="flex">
              {showCheckboxes && <div className="w-12 p-3 border-r" />}
              {displayColumns.map((column) => (
                <div
                  key={column.key}
                  className={cn(
                    "p-3 border-r last:border-r-0 font-medium",
                    column.width && `w-${column.width}`
                  )}
                >
                  {column.label}
                </div>
              ))}
              {showActions && <div className="w-12 p-3" />}
            </div>
          </div>
          <div>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex border-b">
                {showCheckboxes && (
                  <div className="w-12 p-3 border-r">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                )}
                {displayColumns.map((column) => (
                  <div
                    key={column.key}
                    className={cn(
                      "p-3 border-r last:border-r-0",
                      column.width && `w-${column.width}`
                    )}
                  >
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
                {showActions && (
                  <div className="w-12 p-3">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Bulk Actions */}
      {showBulkActions && selectedItems.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <span className="text-sm text-blue-700">
            {t("files.selectedItems", {
              variables: { count: selectedItems.length },
            })}
          </span>
          <div className="flex items-center gap-1">
            {bulkActions.map((action) => (
              <Button
                key={action.key}
                variant="ghost"
                size="sm"
                onClick={() => action.onClick(selectedItemsData)}
                disabled={action.disabled?.(selectedItemsData)}
                className="h-8 px-2 text-blue-700 hover:bg-blue-100"
              >
                {action.icon}
                <span className="ml-1">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <div className="border-b bg-gray-50">
          <div className="flex">
            {showCheckboxes && (
              <div className="w-12 p-3 border-r">
                <Checkbox
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </div>
            )}
            {displayColumns.map((column) => (
              <div
                key={column.key}
                className={cn(
                  "p-3 border-r last:border-r-0 font-medium",
                  column.width && `w-${column.width}`,
                  column.align === "center" && "text-center",
                  column.align === "right" && "text-right",
                  column.sortable && "cursor-pointer hover:bg-gray-100"
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {column.sortable && (
                    <div className="flex flex-col">
                      {sortBy === column.key ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {showActions && <div className="w-12 p-3" />}
          </div>
        </div>

        <div>
          {sortedItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {emptyMessage || t("files.noFiles")}
            </div>
          ) : (
            sortedItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex border-b cursor-pointer",
                  hoveredRow === item.id && "bg-gray-50",
                  selectedItems.includes(item.id) && "bg-blue-50"
                )}
                onMouseEnter={() => setHoveredRow(item.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onItemClick?.(item)}
                onDoubleClick={() => onItemDoubleClick?.(item)}
              >
                {showCheckboxes && (
                  <div className="w-12 p-3 border-r">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) =>
                        handleSelectItem(item.id, e.target.checked)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                {displayColumns.map((column) => (
                  <div
                    key={column.key}
                    className={cn(
                      "p-3 border-r last:border-r-0",
                      column.width && `w-${column.width}`,
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right"
                    )}
                  >
                    {column.render
                      ? column.render(item)
                      : String(item[column.key as keyof FileTableItem] || "")}
                  </div>
                ))}
                {showActions && (
                  <div className="w-12 p-3">
                    <div className="flex items-center gap-1">
                      {displayActions.map((action) => {
                        if (action.hidden?.(item)) return null;

                        return (
                          <Tooltip key={action.key} content={action.label}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(item);
                              }}
                              disabled={action.disabled?.(item)}
                            >
                              {action.icon}
                            </Button>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
