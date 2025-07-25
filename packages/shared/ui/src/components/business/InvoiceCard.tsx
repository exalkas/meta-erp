"use client";

import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  FileText,
  Calendar,
  DollarSign,
  User,
  Building,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Send,
  Edit,
  Eye,
  MoreHorizontal,
  CreditCard,
  Truck,
  Ship,
  ExternalLink,
  Euro,
  Receipt,
} from "lucide-react";

export interface InvoiceData {
  id: string;
  number: string;
  type: "invoice" | "credit_note" | "debit_note" | "receipt" | "proforma";
  status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";
  customer: {
    id: string;
    name: string;
    afm?: string;
    email?: string;
    type: "individual" | "company";
  };
  amounts: {
    subtotal: number;
    vatAmount: number;
    total: number;
    currency: string;
    paid?: number;
    remaining?: number;
  };
  dates: {
    issued: Date;
    due: Date;
    paid?: Date;
  };
  aade?: {
    mark?: string; // AADE digital signature mark
    uid?: string; // Unique ID from AADE
    qrCode?: string;
    transmissionFailure?: boolean;
    cancellationMark?: string;
  };
  maritime?: {
    vesselName?: string;
    vesselIMO?: string;
    portOfLoading?: string;
    portOfDischarge?: string;
    voyageNumber?: string;
    billOfLading?: string;
  };
  paymentMethod?: "cash" | "transfer" | "card" | "check" | "other";
  paymentTerms?: number; // days
  notes?: string;
  items?: Array<{
    description: string;
    quantity: number;
    price: number;
    vatRate: number;
  }>;
  tags?: string[];
}

export interface InvoiceCardProps {
  invoice: InvoiceData;
  variant?: "default" | "compact" | "detailed";
  showActions?: boolean;
  showAADE?: boolean;
  showMaritime?: boolean;
  className?: string;
  onClick?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  onSend?: () => void;
  onMarkPaid?: () => void;
  onViewDetails?: () => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  variant = "default",
  showActions = true,
  showAADE = true,
  showMaritime = false,
  className = "",
  onClick,
  onEdit,
  onDownload,
  onSend,
  onMarkPaid,
  onViewDetails,
}) => {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "viewed":
        return "bg-purple-100 text-purple-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      case "overdue":
        return <AlertTriangle className="w-4 h-4" />;
      case "draft":
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "credit_note":
        return <Receipt className="w-4 h-4 text-green-600" />;
      case "debit_note":
        return <Receipt className="w-4 h-4 text-red-600" />;
      case "receipt":
        return <Receipt className="w-4 h-4 text-blue-600" />;
      case "proforma":
        return <FileText className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: invoice.amounts.currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("el-GR").format(date);
  };

  const getDaysOverdue = () => {
    if (invoice.status !== "overdue") return 0;
    const today = new Date();
    const dueDate = invoice.dates.due;
    return Math.floor(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const getPaymentProgress = () => {
    if (!invoice.amounts.paid) return 0;
    return (invoice.amounts.paid / invoice.amounts.total) * 100;
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
            <div className="flex-shrink-0">{getTypeIcon(invoice.type)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {invoice.number}
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {getStatusIcon(invoice.status)}
                  <span className="ml-1">
                    {t(`invoiceCard.status.${invoice.status}`)}
                  </span>
                </span>
              </div>

              <div className="text-sm text-gray-600">
                {t(`invoiceCard.type.${invoice.type}`)}
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onDownload && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                  title={t("invoiceCard.actions.download")}
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              {onSend && invoice.status === "draft" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSend();
                  }}
                  className="p-1 text-gray-400 hover:text-green-600 rounded"
                  title={t("invoiceCard.actions.send")}
                >
                  <Send className="w-4 h-4" />
                </button>
              )}

              {onViewDetails && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails();
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title={t("invoiceCard.actions.view")}
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
                  title={t("invoiceCard.actions.edit")}
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}

              <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customer Information */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          {invoice.customer.type === "company" ? (
            <Building className="w-4 h-4 text-gray-400" />
          ) : (
            <User className="w-4 h-4 text-gray-400" />
          )}
          <span className="font-medium text-gray-900">
            {invoice.customer.name}
          </span>
        </div>

        {invoice.customer.afm && (
          <div className="text-sm text-gray-600">
            {t("invoiceCard.afm")}: {invoice.customer.afm}
          </div>
        )}
      </div>

      {/* Amount Information */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500">
              {t("invoiceCard.subtotal")}
            </div>
            <div className="font-semibold text-gray-900">
              {formatCurrency(invoice.amounts.subtotal)}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500">{t("invoiceCard.vat")}</div>
            <div className="font-semibold text-gray-900">
              {formatCurrency(invoice.amounts.vatAmount)}
            </div>
          </div>

          <div className="md:col-span-1 col-span-2">
            <div className="text-xs text-gray-500">
              {t("invoiceCard.total")}
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(invoice.amounts.total)}
            </div>
          </div>
        </div>

        {/* Payment Progress */}
        {invoice.amounts.paid && invoice.amounts.paid > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">{t("invoiceCard.paid")}</span>
              <span className="font-medium">
                {formatCurrency(invoice.amounts.paid)} /{" "}
                {formatCurrency(invoice.amounts.total)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getPaymentProgress()}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">
                {t("invoiceCard.issued")}
              </div>
              <div className="font-medium">
                {formatDate(invoice.dates.issued)}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">
                {t("invoiceCard.due")}
              </div>
              <div
                className={`font-medium ${
                  invoice.status === "overdue" ? "text-red-600" : ""
                }`}
              >
                {formatDate(invoice.dates.due)}
              </div>
              {invoice.status === "overdue" && (
                <div className="text-xs text-red-600">
                  {getDaysOverdue()} {t("invoiceCard.daysOverdue")}
                </div>
              )}
            </div>
          </div>

          {invoice.dates.paid && (
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <div>
                <div className="text-xs text-gray-500">
                  {t("invoiceCard.paidOn")}
                </div>
                <div className="font-medium">
                  {formatDate(invoice.dates.paid)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AADE Information */}
      {showAADE && invoice.aade && !isCompact && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <ExternalLink className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">
              {t("invoiceCard.aadeInfo")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {invoice.aade.mark && (
              <div>
                <span className="text-gray-500">
                  {t("invoiceCard.aadeMark")}:
                </span>
                <span className="ml-2 font-mono text-xs">
                  {invoice.aade.mark}
                </span>
              </div>
            )}

            {invoice.aade.uid && (
              <div>
                <span className="text-gray-500">
                  {t("invoiceCard.aadeUID")}:
                </span>
                <span className="ml-2 font-mono text-xs">
                  {invoice.aade.uid}
                </span>
              </div>
            )}
          </div>

          {invoice.aade.transmissionFailure && (
            <div className="mt-2 flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">
                {t("invoiceCard.transmissionFailure")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Maritime Information */}
      {showMaritime && invoice.maritime && !isCompact && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Ship className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">
              {t("invoiceCard.maritimeInfo")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {invoice.maritime.vesselName && (
              <div>
                <span className="text-gray-500">
                  {t("invoiceCard.vessel")}:
                </span>
                <span className="ml-2 font-medium">
                  {invoice.maritime.vesselName}
                </span>
              </div>
            )}

            {invoice.maritime.voyageNumber && (
              <div>
                <span className="text-gray-500">
                  {t("invoiceCard.voyage")}:
                </span>
                <span className="ml-2">{invoice.maritime.voyageNumber}</span>
              </div>
            )}

            {invoice.maritime.portOfLoading && (
              <div>
                <span className="text-gray-500">
                  {t("invoiceCard.portOfLoading")}:
                </span>
                <span className="ml-2">{invoice.maritime.portOfLoading}</span>
              </div>
            )}

            {invoice.maritime.portOfDischarge && (
              <div>
                <span className="text-gray-500">
                  {t("invoiceCard.portOfDischarge")}:
                </span>
                <span className="ml-2">{invoice.maritime.portOfDischarge}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {invoice.paymentMethod && (
              <div className="flex items-center space-x-1">
                <CreditCard className="w-4 h-4" />
                <span>{t(`invoiceCard.payment.${invoice.paymentMethod}`)}</span>
              </div>
            )}

            {invoice.paymentTerms && (
              <div>
                {invoice.paymentTerms} {t("invoiceCard.paymentTerms")}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {showActions && (
            <div className="flex space-x-2">
              {onMarkPaid &&
                invoice.status !== "paid" &&
                invoice.status !== "cancelled" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkPaid();
                    }}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    {t("invoiceCard.actions.markPaid")}
                  </button>
                )}
            </div>
          )}
        </div>

        {/* Tags */}
        {invoice.tags && invoice.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {invoice.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceCard;
