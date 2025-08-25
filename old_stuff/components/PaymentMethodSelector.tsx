"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCardIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
  PaymentMethod,
  fetchAvailablePaymentMethods,
} from "@/lib/api/payments";

interface PaymentMethodSelectorProps {
  selectedMethodId?: number;
  onMethodSelect: (method: PaymentMethod) => void;
  amount?: number;
  currency?: string;
  className?: string;
}

export default function PaymentMethodSelector({
  selectedMethodId,
  onMethodSelect,
  amount = 0,
  currency = "EUR",
  className = "",
}: PaymentMethodSelectorProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const data = await fetchAvailablePaymentMethods();
      setMethods(data.sort((a, b) => a.display_order - b.display_order));
    } catch (err) {
      setError("Failed to load payment methods");
      console.error("Error loading payment methods:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const calculateFees = (method: PaymentMethod, amount: number) => {
    const percentageFee = (amount * method.fee_percentage) / 100;
    const totalFee = percentageFee + method.fee_fixed;
    return {
      percentage: percentageFee,
      fixed: method.fee_fixed,
      total: totalFee,
      finalAmount: amount + totalFee,
    };
  };

  const getMethodIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "credit_card":
      case "debit_card":
        return <CreditCardIcon className="h-6 w-6" />;
      case "bank_transfer":
      case "sepa_debit":
        return <BanknotesIcon className="h-6 w-6" />;
      default:
        return <CreditCardIcon className="h-6 w-6" />;
    }
  };

  const getGatewayIcon = (gatewayType: string) => {
    switch (gatewayType.toLowerCase()) {
      case "stripe":
        return (
          <div className="flex items-center text-xs text-gray-500">
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
              Stripe
            </span>
          </div>
        );
      case "paypal":
        return (
          <div className="flex items-center text-xs text-gray-500">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
              PayPal
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadPaymentMethods}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Choose Payment Method
      </h3>

      <div className="space-y-3">
        {methods.map((method) => {
          const fees = calculateFees(method, amount);
          const isSelected = selectedMethodId === method.id;

          return (
            <div
              key={method.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => onMethodSelect(method)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {getMethodIcon(method.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {method.name}
                      </h4>
                      {method.gateway && getGatewayIcon(method.gateway.type)}
                    </div>

                    <div className="flex items-center space-x-4 mt-1">
                      {/* Processing Time */}
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {method.is_instant
                          ? "Instant"
                          : method.processing_time || "1-3 days"}
                      </div>

                      {/* Fee Information */}
                      {amount > 0 && (
                        <div className="text-sm text-gray-500">
                          Fee: {formatCurrency(fees.total, currency)}
                          {method.fee_percentage > 0 && (
                            <span className="text-xs ml-1">
                              ({method.fee_percentage}%
                              {method.fee_fixed > 0 &&
                                ` + ${formatCurrency(
                                  method.fee_fixed,
                                  currency
                                )}`}
                              )
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {method.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {method.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Selection Indicator */}
                <div className="flex items-center space-x-3">
                  {amount > 0 && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        Total: {formatCurrency(fees.finalAmount, currency)}
                      </div>
                    </div>
                  )}

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <CheckCircleIcon className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {methods.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No payment methods available at the moment.</p>
        </div>
      )}
    </div>
  );
}
