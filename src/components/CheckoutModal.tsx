import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  MapPin,
  Phone,
  User as UserIcon,
  MessageSquare,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
  CreditCard,
  Banknote,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../firebase/orders';
import { updateUserProfile } from '../firebase/auth';
import { Order, OrderItem } from '../types';
import { StripePaymentForm } from './StripePaymentForm';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { user, profile, login, refreshProfile } = useAuth();
  const { cart, subtotal, deliveryFee, tax, total, clearCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [saveInfoForFuture, setSaveInfoForFuture] = useState(true);
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery');

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>('stripe');

  // Stripe integration states
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState<boolean>(false);
  const [loadingPaymentIntent, setLoadingPaymentIntent] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync with user profile when opened or user changes
  useEffect(() => {
    if (user) {
      setCustomerName(profile?.displayName || user.displayName || '');
      setCustomerEmail(user.email || '');
      setCustomerPhone(profile?.phone || '');
      setDeliveryAddress(profile?.address || '');
    }
  }, [user, profile, isOpen]);

  // Compute final charges
  const finalDeliveryFee = fulfillmentType === 'pickup' ? 0 : deliveryFee;
  const finalTotal = subtotal + finalDeliveryFee + tax;

  // Initialize Stripe and check backend configuration
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function initStripe() {
      try {
        const res = await fetch('/api/payment-config');
        if (!res.ok) throw new Error('Could not fetch payment config');
        const data = await res.json();

        if (isMounted) {
          const pubKey = data.publishableKey || (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY;
          if (pubKey && pubKey.startsWith('pk_')) {
            setStripePromise(loadStripe(pubKey));
            setStripeConfigured(true);
          } else {
            setStripeConfigured(false);
          }
        }
      } catch (e) {
        console.warn('Payment configuration check:', e);
        if (isMounted) setStripeConfigured(false);
      }
    }

    initStripe();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Create payment intent whenever user selects Stripe and has items
  useEffect(() => {
    if (!isOpen || paymentMethod !== 'stripe' || finalTotal <= 0) return;

    let isMounted = true;
    setLoadingPaymentIntent(true);
    setErrorMessage(null);

    async function createIntent() {
      try {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: finalTotal,
            currency: 'gbp',
            customerEmail: user?.email || customerEmail,
            customerName: customerName || 'Valued Guest',
            metadata: {
              userId: user?.uid || 'guest',
              itemCount: cart.length,
            },
          }),
        });

        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            setClientSecret(null);
            if (data.configured === false) {
              setStripeConfigured(false);
            } else if (data.error) {
              setErrorMessage(data.error);
            }
          }
        }
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        if (isMounted) {
          setClientSecret(null);
        }
      } finally {
        if (isMounted) setLoadingPaymentIntent(false);
      }
    }

    createIntent();

    return () => {
      isMounted = false;
    };
  }, [isOpen, paymentMethod, finalTotal, user?.uid, cart.length]);

  if (!isOpen) return null;

  // Validation function
  const validateForm = (): boolean => {
    if (!user) {
      setErrorMessage('Please sign in with your Google account to complete your order.');
      return false;
    }
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return false;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Please provide a valid contact phone number.');
      return false;
    }
    if (fulfillmentType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMessage('Please provide your complete delivery address.');
      return false;
    }
    if (cart.length === 0) {
      setErrorMessage('Your cart is empty. Please add items to proceed.');
      return false;
    }
    return true;
  };

  // Helper to commit order to Firestore
  const saveOrderToFirestore = async (paymentDetails: {
    method: 'stripe' | 'cash';
    status: 'paid' | 'pending';
    intentId?: string;
  }): Promise<Order> => {
    const orderItems: OrderItem[] = cart.map((item) => ({
      menuItemId: item.menuItem.id,
      name: item.menuItem.name,
      price: item.menuItem.price,
      quantity: item.quantity,
      imageUrl: item.menuItem.imageUrl,
      notes: item.notes || '',
    }));

    const finalAddress = fulfillmentType === 'pickup'
      ? 'In-Restaurant Pickup (Savoria Bistro Front Counter)'
      : deliveryAddress;

    const placedOrder = await createOrder({
      userId: user!.uid,
      customerName,
      customerEmail: user!.email || customerEmail,
      customerPhone,
      deliveryAddress: finalAddress,
      specialInstructions,
      items: orderItems,
      subtotal,
      deliveryFee: finalDeliveryFee,
      tax,
      total: finalTotal,
      paymentMethod: paymentDetails.method,
      paymentStatus: paymentDetails.status,
      paymentIntentId: paymentDetails.intentId,
    });

    if (saveInfoForFuture && user?.uid) {
      try {
        await updateUserProfile(user.uid, {
          phone: customerPhone,
          address: fulfillmentType === 'delivery' ? deliveryAddress : profile?.address || '',
        });
        refreshProfile();
      } catch (e) {
        console.warn('Could not save profile details:', e);
      }
    }

    clearCart();
    return placedOrder;
  };

  // Cash / Pay on delivery submit
  const handleCashOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const placedOrder = await saveOrderToFirestore({
        method: 'cash',
        status: 'pending',
      });

      setIsSubmitting(false);
      onClose();
      onOrderSuccess(placedOrder);
    } catch (error: any) {
      console.error('Failed to submit cash order:', error);
      setIsSubmitting(false);
      setErrorMessage(
        error?.message ? `Failed to place order: ${error.message}` : 'An unexpected error occurred. Please try again.'
      );
    }
  };

  // Stripe payment success callback
  const handleStripeSuccess = async (paymentIntentId: string) => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const placedOrder = await saveOrderToFirestore({
        method: 'stripe',
        status: 'paid',
        intentId: paymentIntentId,
      });

      setIsSubmitting(false);
      onClose();
      onOrderSuccess(placedOrder);
    } catch (error: any) {
      console.error('Error recording paid order:', error);
      setIsSubmitting(false);
      setErrorMessage(
        'Payment was approved by Stripe, but saving the order record encountered an issue. Please contact the restaurant immediately.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-150 flex items-center justify-between bg-stone-50">
          <div>
            <h2 className="text-xl font-bold font-display text-stone-900">
              Complete Your Order
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Instant live payment via Stripe UK & Firebase Cloud
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
          {/* Auth check */}
          {!user ? (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  Google Sign-In Required
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                  Sign in with your Google account to place this order, view your receipts, and receive live delivery tracking updates.
                </p>
              </div>
              <button
                onClick={login}
                className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 mx-auto shadow-md transition cursor-pointer"
              >
                <span>Continue with Google</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Delivery / Pickup Choice */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                  Fulfillment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('delivery')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      fulfillmentType === 'delivery'
                        ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <p className="font-bold text-sm text-stone-900">Doorstep Delivery</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Hot & fresh in 30-45 mins ({deliveryFee === 0 ? 'FREE' : `£${deliveryFee.toFixed(2)}`})
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('pickup')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      fulfillmentType === 'pickup'
                        ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <p className="font-bold text-sm text-stone-900">Restaurant Pickup</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Ready in 20 mins at front counter (Free)
                    </p>
                  </button>
                </div>
              </div>

              {/* Customer Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Your Full Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Eleanor Vance"
                      className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Phone Number <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. +44 7911 123456"
                      className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {fulfillmentType === 'delivery' && (
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Delivery Address <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <textarea
                      required
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Street address, flat/apt number, postal code..."
                      className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Special Delivery or Kitchen Notes (Optional)
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Ring doorbell, no extra spicy, leave at door..."
                    className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 resize-none"
                  />
                </div>
              </div>

              {/* Save info checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={saveInfoForFuture}
                  onChange={(e) => setSaveInfoForFuture(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Save phone and address to my profile for faster future orders</span>
              </label>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      paymentMethod === 'stripe'
                        ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm text-stone-900">Card & Digital Pay</p>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">Live</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Stripe UK (Visa, Mastercard, Apple Pay, Google Pay)
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-stone-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-stone-900">Pay on Delivery / Counter</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Pay in cash or card machine upon receipt
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Order Summary Snapshot */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Items Subtotal ({cart.length} types)</span>
                  <span className="font-semibold text-stone-900">£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-stone-900">
                    {fulfillmentType === 'pickup' ? (
                      <span className="text-emerald-700 font-bold uppercase text-[10px]">Free (Pickup)</span>
                    ) : deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase text-[10px]">Free</span>
                    ) : (
                      `£${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Sales Tax</span>
                  <span className="font-semibold text-stone-900">£{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total Due</span>
                  <span className="text-amber-700 font-display text-base">
                    £{finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Section based on selected method */}
              {paymentMethod === 'stripe' ? (
                <div>
                  {!stripeConfigured ? (
                    <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-300/80 space-y-3">
                      <div className="flex items-start gap-3">
                        <KeyRound className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-stone-900 text-sm">
                            Stripe Keys Awaiting Configuration
                          </h4>
                          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                            Your Stripe backend is ready! To accept live UK payments, add your Stripe credentials into your project's <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono font-bold text-[11px]">.env</code> file:
                          </p>
                          <div className="bg-stone-900 text-amber-300 font-mono text-[11px] p-3 rounded-xl mt-2.5 space-y-1 select-all">
                            <p>VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)</p>
                            <p>STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)</p>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-2">
                            Tip: You can still place test orders right now by selecting <strong>"Pay on Delivery / Counter"</strong> above.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : loadingPaymentIntent ? (
                    <div className="p-8 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center gap-2 text-stone-600">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                      <span className="text-xs font-medium">Opening secure Stripe payment session...</span>
                    </div>
                  ) : stripePromise && clientSecret ? (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: 'stripe',
                          variables: {
                            colorPrimary: '#d97706',
                            colorBackground: '#ffffff',
                            colorText: '#1c1917',
                            colorDanger: '#e11d48',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            borderRadius: '12px',
                          },
                        },
                      }}
                    >
                      <StripePaymentForm
                        amount={finalTotal}
                        currencySymbol="£"
                        isProcessing={isSubmitting}
                        onPaymentSuccess={handleStripeSuccess}
                        onError={(err) => setErrorMessage(err)}
                        disabled={!customerName.trim() || !customerPhone.trim() || (fulfillmentType === 'delivery' && !deliveryAddress.trim())}
                      />
                    </Elements>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      Could not establish secure connection to Stripe. Please verify your Stripe API keys or choose Pay on Delivery.
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCashOrderSubmit}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending Order to Kitchen...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>
                          Confirm Order (Pay on Receipt) • £{finalTotal.toFixed(2)}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
