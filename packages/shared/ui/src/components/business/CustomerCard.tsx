"use client";

import React, { useState } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  MessageCircle,
  FileText,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";

export interface CustomerData {
  id: string;
  name: string;
  type: "individual" | "company";
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  businessInfo?: {
    afm?: string; // Greek VAT number
    doy?: string; // Greek tax office
    legalForm?: "AE" | "EPE" | "IKE" | "OE" | "EE" | "AT";
    industry?: string;
  };
  avatar?: string;
  status: "active" | "inactive" | "prospect" | "blocked";
  priority: "low" | "medium" | "high" | "vip";
  totalOrders?: number;
  totalValue?: number;
  lastOrderDate?: Date;
  registrationDate: Date;
  tags?: string[];
  notes?: string;
  assignedTo?: {
    id: string;
    name: string;
    avatar?: string;
  };
  metrics?: {
    lifetimeValue: number;
    averageOrderValue: number;
    orderFrequency: number;
    paymentTerms: number;
    creditLimit?: number;
  };
}

export interface CustomerCardProps {
  customer: CustomerData;
  variant?: "default" | "compact" | "detailed";
  showActions?: boolean;
  showMetrics?: boolean;
  className?: string;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onContact?: (method: "email" | "phone" | "message") => void;
  onViewDetails?: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  variant = "default",
  showActions = true,
  showMetrics = true,
  className = "",
  onClick,
  onEdit,
  onDelete,
  onContact,
  onViewDetails,
}) => {
  const { t } = useTranslation();
  const [showFullNotes, setShowFullNotes] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "prospect":
        return "bg-blue-100 text-blue-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "vip":
        return "bg-purple-100 text-purple-800";
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "vip":
        return <Star className="w-3 h-3" />;
      case "high":
        return <AlertTriangle className="w-3 h-3" />;
      case "medium":
        return <Clock className="w-3 h-3" />;
      case "low":
        return <CheckCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("el-GR").format(date);
  };

  const isCompact = variant === "compact";
  const isDetailed = variant === "detailed";

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {customer.avatar ? (
                <img
                  src={customer.avatar}
                  alt={customer.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {customer.type === "company" ? (
                    <Building className="w-6 h-6 text-gray-500" />
                  ) : (
                    <User className="w-6 h-6 text-gray-500" />
                  )}
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {customer.name}
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                    customer.priority
                  )}`}
                >
                  {getPriorityIcon(customer.priority)}
                  <span className="ml-1">
                    {t(`customerCard.priority.${customer.priority}`)}
                  </span>
                </span>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    customer.status
                  )}`}
                >
                  {t(`customerCard.status.${customer.status}`)}
                </span>

                {customer.type === "company" &&
                  customer.businessInfo?.legalForm && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium rounded-full">
                      {customer.businessInfo.legalForm}
                    </span>
                  )}

                {customer.assignedTo && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span className="text-xs">{customer.assignedTo.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onContact && customer.email && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContact("email");
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                  title={t("customerCard.actions.email")}
                >
                  <Mail className="w-4 h-4" />
                </button>
              )}

              {onContact && customer.phone && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContact("phone");
                  }}
                  className="p-1 text-gray-400 hover:text-green-600 rounded"
                  title={t("customerCard.actions.call")}
                >
                  <Phone className="w-4 h-4" />
                </button>
              )}

              {onViewDetails && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails();
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title={t("customerCard.actions.view")}
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}

              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                  title={t("customerCard.actions.edit")}
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}

              <div className="relative group">
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onContact?.("message");
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {t("customerCard.actions.message")}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle view orders
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {t("customerCard.actions.viewOrders")}
                    </button>

                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t("customerCard.actions.delete")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      {!isCompact && (
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {customer.email && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}

            {customer.phone && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{customer.phone}</span>
              </div>
            )}

            {customer.address && (
              <div className="flex items-center space-x-2 text-gray-600 md:col-span-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {customer.address.street}, {customer.address.city}{" "}
                  {customer.address.postalCode}
                </span>
              </div>
            )}
          </div>

          {/* Greek Business Info */}
          {customer.type === "company" && customer.businessInfo && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {customer.businessInfo.afm && (
                  <div>
                    <span className="text-gray-500">
                      {t("customerCard.afm")}:
                    </span>
                    <span className="ml-1 font-medium">
                      {customer.businessInfo.afm}
                    </span>
                  </div>
                )}

                {customer.businessInfo.doy && (
                  <div>
                    <span className="text-gray-500">
                      {t("customerCard.doy")}:
                    </span>
                    <span className="ml-1">{customer.businessInfo.doy}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics */}
      {showMetrics && customer.metrics && !isCompact && (
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(customer.metrics.lifetimeValue)}
              </div>
              <div className="text-xs text-gray-500">
                {t("customerCard.lifetimeValue")}
              </div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {customer.totalOrders || 0}
              </div>
              <div className="text-xs text-gray-500">
                {t("customerCard.totalOrders")}
              </div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(customer.metrics.averageOrderValue)}
              </div>
              <div className="text-xs text-gray-500">
                {t("customerCard.avgOrderValue")}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-lg font-semibold text-gray-900">
                  {customer.metrics.orderFrequency}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {t("customerCard.orderFrequency")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>
                {t("customerCard.registered")}:{" "}
                {formatDate(customer.registrationDate)}
              </span>
            </div>

            {customer.lastOrderDate && (
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span>
                  {t("customerCard.lastOrder")}:{" "}
                  {formatDate(customer.lastOrderDate)}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {customer.tags && customer.tags.length > 0 && (
            <div className="flex space-x-1">
              {customer.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {customer.tags.length > 2 && (
                <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                  +{customer.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        {customer.notes && isDetailed && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">
                {t("customerCard.notes")}:
              </span>
              <p className={`mt-1 ${showFullNotes ? "" : "line-clamp-2"}`}>
                {customer.notes}
              </p>
              {customer.notes.length > 100 && (
                <button
                  onClick={() => setShowFullNotes(!showFullNotes)}
                  className="text-blue-600 hover:text-blue-800 text-xs mt-1"
                >
                  {showFullNotes
                    ? t("customerCard.showLess")
                    : t("customerCard.showMore")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerCard;
