import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Loader2, ShieldCheck, Lock } from 'lucide-react';

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

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe is still initializing. Please wait a moment.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Trigger validation on the payment element
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setIsSubmitting(false);
        onError(submitError.message || 'Please check your payment details.');
        return;
      }

      // Confirm the payment with Stripe without redirecting if not strictly needed
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (result.error) {
        setIsSubmitting(false);
        onError(result.error.message || 'Payment failed. Please verify your card details.');
        return;
      }

      if (result.paymentIntent && (result.paymentIntent.status === 'succeeded' || result.paymentIntent.status === 'processing')) {
        await onPaymentSuccess(result.paymentIntent.id);
      } else {
        setIsSubmitting(false);
        onError('Payment was not completed. Please try again or use another payment method.');
      }
    } catch (err: any) {
      console.error('Stripe submit error:', err);
      setIsSubmitting(false);
      onError(err?.message || 'An error occurred during payment processing.');
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Card & Mobile Pay</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit SSL Secured</span>
          </div>
        </div>

        <PaymentElement
          onReady={() => setElementReady(true)}
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isProcessing || !stripe || !elementReady || disabled}
        className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-xl shadow-amber-600/30 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting || isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Authorizing Live Payment...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>
              Pay {currencySymbol}{amount.toFixed(2)} & Place Order
            </span>
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-stone-500">
        Payments processed securely via Stripe UK. Bank 3D Secure verification supported.
      </p>
    </form>
  );
};
