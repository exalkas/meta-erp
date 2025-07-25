"use client";

import React, { useState, useCallback } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  Plus,
  MoreHorizontal,
  User,
  Calendar,
  Flag,
  Archive,
  Edit3,
  Trash2,
} from "lucide-react";

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  assignee?: {
    name: string;
    avatar?: string;
  };
  dueDate?: Date;
  priority?: "low" | "medium" | "high" | "urgent";
  tags?: string[];
  comments?: number;
  attachments?: number;
  status: string;
  color?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  limit?: number;
  cards: KanbanCard[];
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  onCardMove?: (cardId: string, fromColumn: string, toColumn: string) => void;
  onCardCreate?: (columnId: string, card: Omit<KanbanCard, "id">) => void;
  onCardEdit?: (cardId: string, card: Partial<KanbanCard>) => void;
  onCardDelete?: (cardId: string) => void;
  onColumnCreate?: (column: Omit<KanbanColumn, "id" | "cards">) => void;
  onColumnEdit?: (columnId: string, column: Partial<KanbanColumn>) => void;
  onColumnDelete?: (columnId: string) => void;
  className?: string;
  editable?: boolean;
  showColumnLimits?: boolean;
  enableDragAndDrop?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onCardMove,
  onCardCreate,
  onCardEdit,
  onCardDelete,
  onColumnCreate,
  onColumnEdit,
  onColumnDelete,
  className = "",
  editable = true,
  showColumnLimits = true,
  enableDragAndDrop = true,
}) => {
  const { t } = useTranslation();
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, card: KanbanCard) => {
      if (!enableDragAndDrop) return;
      setDraggedCard(card);
      e.dataTransfer.effectAllowed = "move";
    },
    [enableDragAndDrop]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, columnId: string) => {
      if (!enableDragAndDrop || !draggedCard) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDraggedOver(columnId);
    },
    [enableDragAndDrop, draggedCard]
  );

  const handleDragLeave = useCallback(() => {
    setDraggedOver(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, columnId: string) => {
      if (!enableDragAndDrop || !draggedCard) return;
      e.preventDefault();

      if (draggedCard.status !== columnId) {
        onCardMove?.(draggedCard.id, draggedCard.status, columnId);
      }

      setDraggedCard(null);
      setDraggedOver(null);
    },
    [enableDragAndDrop, draggedCard, onCardMove]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedCard(null);
    setDraggedOver(null);
  }, []);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return <Flag className="w-3 h-3 text-red-500" />;
      case "high":
        return <Flag className="w-3 h-3 text-orange-500" />;
      case "medium":
        return <Flag className="w-3 h-3 text-yellow-500" />;
      case "low":
        return <Flag className="w-3 h-3 text-green-500" />;
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (date: Date) => {
    return date < new Date();
  };

  const renderCard = (card: KanbanCard) => {
    const isDragging = draggedCard?.id === card.id;

    return (
      <div
        key={card.id}
        draggable={enableDragAndDrop}
        onDragStart={(e) => handleDragStart(e, card)}
        onDragEnd={handleDragEnd}
        className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
          isDragging ? "opacity-50 scale-95" : ""
        } ${card.color ? `border-l-4 border-l-${card.color}` : ""}`}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
            {card.title}
          </h4>
          {editable && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onCardEdit?.(card.id, card)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={() => onCardDelete?.(card.id)}
                className="text-gray-400 hover:text-red-600 p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {card.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {card.description}
          </p>
        )}

        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            {card.assignee && (
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>{card.assignee.name}</span>
              </div>
            )}
            {card.priority && (
              <div className="flex items-center space-x-1">
                {getPriorityIcon(card.priority)}
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(
                    card.priority
                  )}`}
                >
                  {card.priority}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {card.dueDate && (
              <div
                className={`flex items-center space-x-1 ${
                  isOverdue(card.dueDate) ? "text-red-500" : ""
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>{formatDate(card.dueDate)}</span>
              </div>
            )}
            {card.comments && card.comments > 0 && (
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {card.comments}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderColumn = (column: KanbanColumn) => {
    const isOverLimit = column.limit && column.cards.length > column.limit;
    const isDraggedOver = draggedOver === column.id;

    return (
      <div
        key={column.id}
        className={`bg-gray-50 rounded-lg p-4 min-h-[600px] w-80 flex-shrink-0 ${
          isDraggedOver
            ? "bg-blue-50 border-2 border-blue-200 border-dashed"
            : ""
        }`}
        onDragOver={(e) => handleDragOver(e, column.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, column.id)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {column.color && (
              <div className={`w-3 h-3 rounded-full bg-${column.color}-500`} />
            )}
            <h3 className="font-semibold text-gray-900">{column.title}</h3>
            <span
              className={`text-sm px-2 py-1 rounded-full ${
                isOverLimit
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {column.cards.length}
              {showColumnLimits && column.limit && `/${column.limit}`}
            </span>
          </div>

          {editable && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() =>
                  onCardCreate?.(column.id, {
                    title: "",
                    status: column.id,
                  })
                }
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => onColumnEdit?.(column.id, column)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 group">{column.cards.map(renderCard)}</div>

        {column.cards.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("kanban.noCards")}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`kanban-board ${className}`}>
      <div className="flex space-x-6 overflow-x-auto pb-4">
        {columns.map(renderColumn)}

        {editable && (
          <div className="bg-gray-100 rounded-lg p-4 min-h-[600px] w-80 flex-shrink-0 border-2 border-dashed border-gray-300">
            <button
              onClick={() => onColumnCreate?.({ title: "", color: undefined })}
              className="w-full h-full flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Plus className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">
                {t("kanban.addColumn")}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanBoard;
