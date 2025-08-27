"use client";

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  CreditCardIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_..."
);

interface StripePaymentFormProps {
  amount: number;
  currency: string;
  clientSecret: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  loading?: boolean;
}

interface PaymentFormProps extends StripePaymentFormProps {}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency,
  clientSecret,
  onSuccess,
  onError,
  loading = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!cardholderName.trim()) {
      newErrors.cardholderName = "Cardholder name is required";
    }

    if (!elements?.getElement(CardElement)) {
      newErrors.card = "Card information is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError("Stripe has not loaded properly. Please refresh and try again.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setProcessing(true);
    setErrors({});

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Confirm the payment intent with the card element
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardholderName,
            },
          },
        }
      );

      if (error) {
        console.error("Payment failed:", error);
        onError(error.message || "Payment failed. Please try again.");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent);
      } else {
        onError("Payment was not completed. Please try again.");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      onError(
        error.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
    hidePostalCode: false,
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-blue-100 rounded-lg mr-3">
          <CreditCardIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Card Payment</h3>
          <p className="text-sm text-gray-500">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Total Amount
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(amount, currency)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cardholder Name */}
        <div>
          <label
            htmlFor="cardholderName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Cardholder Name
          </label>
          <input
            type="text"
            id="cardholderName"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.cardholderName ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="John Doe"
            disabled={processing || loading}
          />
          {errors.cardholderName && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <ExclamationCircleIcon className="h-4 w-4 mr-1" />
              {errors.cardholderName}
            </p>
          )}
        </div>

        {/* Card Element */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Information
          </label>
          <div
            className={`w-full px-3 py-3 border rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 ${
              errors.card ? "border-red-300" : "border-gray-300"
            }`}
          >
            <CardElement options={cardElementOptions} />
          </div>
          {errors.card && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <ExclamationCircleIcon className="h-4 w-4 mr-1" />
              {errors.card}
            </p>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
            <p className="text-sm text-blue-800">
              Your payment information is encrypted and secure. We never store
              your card details.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={processing || loading || !stripe}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            processing || loading || !stripe
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          }`}
        >
          {processing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </div>
          ) : (
            `Pay ${formatCurrency(amount, currency)}`
          )}
        </button>
      </form>

      {/* Powered by Stripe */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Powered by <span className="font-medium text-blue-600">Stripe</span>
        </p>
      </div>
    </div>
  );
};

export default function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}
