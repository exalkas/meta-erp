"use client";

import React, { useState, useCallback } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Move,
  Copy,
} from "lucide-react";

export interface FolderNode {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  children?: FolderNode[];
  isExpanded?: boolean;
  fileCount?: number;
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    create: boolean;
  };
}

export interface FolderTreeProps {
  folders: FolderNode[];
  selectedFolderId?: string;
  expandedFolders?: Set<string>;
  showFileCount?: boolean;
  allowDragDrop?: boolean;
  allowContextMenu?: boolean;
  maxDepth?: number;
  className?: string;
  onFolderSelect?: (folder: FolderNode) => void;
  onFolderExpand?: (folder: FolderNode, expanded: boolean) => void;
  onFolderCreate?: (parentFolder: FolderNode, name: string) => void;
  onFolderRename?: (folder: FolderNode, newName: string) => void;
  onFolderDelete?: (folder: FolderNode) => void;
  onFolderMove?: (folder: FolderNode, newParent: FolderNode) => void;
  onFolderDrop?: (files: File[], folder: FolderNode) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolderId,
  expandedFolders = new Set(),
  showFileCount = true,
  allowDragDrop = false,
  allowContextMenu = true,
  maxDepth = 10,
  className = "",
  onFolderSelect,
  onFolderExpand,
  onFolderCreate,
  onFolderRename,
  onFolderDelete,
  onFolderMove,
  onFolderDrop,
}) => {
  const { t } = useTranslation();
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    folder: FolderNode;
    x: number;
    y: number;
  } | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleFolderClick = useCallback(
    (folder: FolderNode, event: React.MouseEvent) => {
      event.stopPropagation();
      onFolderSelect?.(folder);
    },
    [onFolderSelect]
  );

  const handleExpandClick = useCallback(
    (folder: FolderNode, event: React.MouseEvent) => {
      event.stopPropagation();
      const isExpanded = expandedFolders.has(folder.id);
      onFolderExpand?.(folder, !isExpanded);
    },
    [expandedFolders, onFolderExpand]
  );

  const handleContextMenu = useCallback(
    (folder: FolderNode, event: React.MouseEvent) => {
      if (!allowContextMenu) return;

      event.preventDefault();
      event.stopPropagation();

      setContextMenu({
        folder,
        x: event.clientX,
        y: event.clientY,
      });
    },
    [allowContextMenu]
  );

  const handleDragOver = useCallback(
    (folder: FolderNode, event: React.DragEvent) => {
      if (!allowDragDrop) return;

      event.preventDefault();
      event.stopPropagation();
      setDragOverFolder(folder.id);
    },
    [allowDragDrop]
  );

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverFolder(null);
  }, []);

  const handleDrop = useCallback(
    (folder: FolderNode, event: React.DragEvent) => {
      if (!allowDragDrop) return;

      event.preventDefault();
      event.stopPropagation();
      setDragOverFolder(null);

      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) {
        onFolderDrop?.(files, folder);
      }
    },
    [allowDragDrop, onFolderDrop]
  );

  const startRename = useCallback((folder: FolderNode) => {
    setEditingFolder(folder.id);
    setEditingName(folder.name);
    setContextMenu(null);
  }, []);

  const finishRename = useCallback(() => {
    if (editingFolder && editingName.trim()) {
      const folder = findFolderById(folders, editingFolder);
      if (folder) {
        onFolderRename?.(folder, editingName.trim());
      }
    }
    setEditingFolder(null);
    setEditingName("");
  }, [editingFolder, editingName, folders, onFolderRename]);

  const cancelRename = useCallback(() => {
    setEditingFolder(null);
    setEditingName("");
  }, []);

  const findFolderById = (
    folderList: FolderNode[],
    id: string
  ): FolderNode | null => {
    for (const folder of folderList) {
      if (folder.id === id) return folder;
      if (folder.children) {
        const found = findFolderById(folder.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const renderFolder = (folder: FolderNode, depth = 0) => {
    if (depth > maxDepth) return null;

    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isDragOver = dragOverFolder === folder.id;
    const isEditing = editingFolder === folder.id;

    return (
      <div key={folder.id} className="folder-tree-node">
        <div
          className={`
            flex items-center py-1 px-2 rounded cursor-pointer group transition-colors
            ${isSelected ? "bg-blue-100 text-blue-900" : "hover:bg-gray-100"}
            ${isDragOver ? "bg-blue-50 ring-2 ring-blue-200" : ""}
          `}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={(e) => handleFolderClick(folder, e)}
          onContextMenu={(e) => handleContextMenu(folder, e)}
          onDragOver={(e) => handleDragOver(folder, e)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(folder, e)}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={(e) => handleExpandClick(folder, e)}
            className={`
              flex-shrink-0 w-4 h-4 flex items-center justify-center rounded
              ${hasChildren ? "hover:bg-gray-200" : "invisible"}
            `}
          >
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              ))}
          </button>

          {/* Folder Icon */}
          <div className="flex-shrink-0 ml-1 mr-2">
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500" />
            )}
          </div>

          {/* Folder Name */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={finishRename}
                onKeyPress={(e) => {
                  if (e.key === "Enter") finishRename();
                  if (e.key === "Escape") cancelRename();
                }}
                className="w-full px-1 py-0 text-sm border border-blue-300 rounded focus:outline-none focus:border-blue-500"
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium truncate">
                {folder.name}
                {showFileCount && folder.fileCount !== undefined && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({folder.fileCount})
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Actions */}
          {allowContextMenu && !isEditing && (
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(folder, e);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="folder-children">
            {folder.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [contextMenu]);

  return (
    <div className={`folder-tree ${className}`}>
      {folders.map((folder) => renderFolder(folder))}

      {folders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">{t("folderTree.noFolders")}</div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-48"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          {contextMenu.folder.permissions.create && onFolderCreate && (
            <button
              onClick={() => {
                const name = prompt(t("folderTree.newFolderName"));
                if (name?.trim()) {
                  onFolderCreate(contextMenu.folder, name.trim());
                }
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("folderTree.createFolder")}
            </button>
          )}

          {contextMenu.folder.permissions.write && onFolderRename && (
            <button
              onClick={() => startRename(contextMenu.folder)}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              {t("folderTree.rename")}
            </button>
          )}

          <button
            onClick={() => {
              // Handle copy
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <Copy className="w-4 h-4 mr-2" />
            {t("folderTree.copy")}
          </button>

          <button
            onClick={() => {
              // Handle move
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <Move className="w-4 h-4 mr-2" />
            {t("folderTree.move")}
          </button>

          {contextMenu.folder.permissions.delete && onFolderDelete && (
            <>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={() => {
                  if (
                    confirm(
                      t("folderTree.confirmDelete", {
                        variables: {
                          name: contextMenu.folder.name,
                        },
                      })
                    )
                  ) {
                    onFolderDelete(contextMenu.folder);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("folderTree.delete")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FolderTree;
