import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  currencySymbol?: string;
  isProcessing: boolean;
  onPaymentSuccess: (paymentIntentId: string) => Promise<void>;
  onError: (errorMessage: string) => void;
  disabled?: boolean;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  currencySymbol = '£',
  isProcessing,
  onPaymentSuccess,
  onError,
  disabled = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elementReady, setElementReady] = useState(false);

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Payment gateway is initializing. Please wait a moment.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setIsSubmitting(false);
        onError(submitError.message || 'Please check your card details.');
        return;
      }

      const returnUrl = `${window.location.origin}/?payment_return=true`;
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setIsSubmitting(false);
        onError(result.error.message || 'Payment failed. Please verify your card details.');
        return;
      }

      if (
        result.paymentIntent &&
        (result.paymentIntent.status === 'succeeded' ||
          result.paymentIntent.status === 'processing' ||
          result.paymentIntent.status === 'requires_capture')
      ) {
        await onPaymentSuccess(result.paymentIntent.id);
      } else {
        setIsSubmitting(false);
        onError('Payment was not completed. Please try again.');
      }
    } catch (err: any) {
      console.error('Stripe submit error:', err);
      setIsSubmitting(false);
      onError(err?.message || 'Payment failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="rounded-xl border border-stone-200 bg-white p-3">
        <PaymentElement
          onReady={() => setElementReady(true)}
          options={{
            layout: 'tabs',
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
          }}
        />
      </div>

      {isInIframe && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-center">
          Tip: Use direct Card entry inside preview, or open the app in a new tab for bank-redirect methods (Klarna/Revolut).
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || isProcessing || !stripe || !elementReady || disabled}
        className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
      >
        {isSubmitting || isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <span>
            Pay {currencySymbol}{amount.toFixed(2)}
          </span>
        )}
      </button>
    </form>
  );
};
