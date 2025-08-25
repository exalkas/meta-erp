"use client";

import React, { useState, useEffect } from "react";
import {
  BanknotesIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  fetchBankTransferDetails,
  notifyBankTransfer,
} from "@/lib/api/payments";

interface BankTransferPaymentProps {
  amount: number;
  currency: string;
  subscriptionId?: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function BankTransferPayment({
  amount,
  currency,
  subscriptionId,
  onSuccess,
  onError,
}: BankTransferPaymentProps) {
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [reference, setReference] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadBankDetails();
    generateReference();
  }, []);

  const loadBankDetails = async () => {
    try {
      const details = await fetchBankTransferDetails();
      setBankDetails(details);
    } catch (error) {
      onError("Failed to load bank transfer details");
    } finally {
      setLoading(false);
    }
  };

  const generateReference = () => {
    // Generate a unique reference for this payment
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.random().toString().slice(-4);
    setReference(`PAY-${timestamp}${randomNum}`);
  };

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleNotifyTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reference || !transferDate) {
      onError("Please fill in all required fields");
      return;
    }

    setNotifying(true);

    try {
      await notifyBankTransfer({
        amount,
        reference,
        transfer_date: transferDate,
        subscription_id: subscriptionId,
      });

      onSuccess();
    } catch (error) {
      onError("Failed to notify transfer. Please try again.");
    } finally {
      setNotifying(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!bankDetails) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load bank transfer details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-green-100 rounded-lg mr-3">
          <BanknotesIcon className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Bank Transfer</h3>
          <p className="text-sm text-gray-500">
            Transfer funds directly to our bank account
          </p>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Amount to Transfer
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(amount, currency)}
          </span>
        </div>
      </div>

      {/* Bank Details */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900">Bank Account Details</h4>

        <div className="grid grid-cols-1 gap-4">
          {/* Bank Name */}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Bank Name
              </label>
              <p className="text-sm text-gray-900">{bankDetails.bank_name}</p>
            </div>
            <button
              onClick={() =>
                copyToClipboard(bankDetails.bank_name, "bank_name")
              }
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              {copiedField === "bank_name" ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <ClipboardDocumentIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Account Name */}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Account Name
              </label>
              <p className="text-sm text-gray-900">
                {bankDetails.account_name}
              </p>
            </div>
            <button
              onClick={() =>
                copyToClipboard(bankDetails.account_name, "account_name")
              }
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              {copiedField === "account_name" ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <ClipboardDocumentIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* IBAN */}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">IBAN</label>
              <p className="text-sm text-gray-900 font-mono">
                {bankDetails.iban}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(bankDetails.iban, "iban")}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              {copiedField === "iban" ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <ClipboardDocumentIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* SWIFT Code */}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">
                SWIFT Code
              </label>
              <p className="text-sm text-gray-900 font-mono">
                {bankDetails.swift_code}
              </p>
            </div>
            <button
              onClick={() =>
                copyToClipboard(bankDetails.swift_code, "swift_code")
              }
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              {copiedField === "swift_code" ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <ClipboardDocumentIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Payment Reference */}
          <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div>
              <label className="text-sm font-medium text-yellow-800">
                Payment Reference (Required)
              </label>
              <p className="text-sm text-yellow-900 font-mono">{reference}</p>
            </div>
            <button
              onClick={() => copyToClipboard(reference, "reference")}
              className="p-2 text-yellow-600 hover:text-yellow-800"
            >
              {copiedField === "reference" ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <ClipboardDocumentIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h5 className="font-medium text-blue-900 mb-2">
          Transfer Instructions
        </h5>
        <div className="text-sm text-blue-800 space-y-1">
          <p>
            1. Use the exact amount:{" "}
            <strong>{formatCurrency(amount, currency)}</strong>
          </p>
          <p>
            2. Include the payment reference: <strong>{reference}</strong>
          </p>
          <p>3. Processing time: 1-3 business days</p>
          <p>4. Notify us after making the transfer using the form below</p>
        </div>
      </div>

      {/* Notify Transfer Form */}
      {!showNotifyForm ? (
        <button
          onClick={() => setShowNotifyForm(true)}
          className="w-full py-3 px-4 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          I&apos;ve Made the Transfer - Notify Us
        </button>
      ) : (
        <form onSubmit={handleNotifyTransfer} className="space-y-4">
          <h5 className="font-medium text-gray-900">Transfer Notification</h5>

          <div>
            <label
              htmlFor="reference"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Payment Reference
            </label>
            <input
              type="text"
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="transferDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Transfer Date
            </label>
            <input
              type="date"
              id="transferDate"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowNotifyForm(false)}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={notifying}
              className={`flex-1 py-2 px-4 rounded-md font-medium ${
                notifying
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              }`}
            >
              {notifying ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Notifying...
                </div>
              ) : (
                "Notify Transfer"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
