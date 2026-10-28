import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User as UserIcon,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  Loader2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../firebase/orders';
import { StripePaymentForm } from './StripePaymentForm';
import { Order, OrderItem } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { user, profile, login } = useAuth();
  const { cart, subtotal, deliveryFee, total, clearCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>('stripe');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Embedded Stripe Payment Element state
  const [publishableKey, setPublishableKey] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initializingElement, setInitializingElement] = useState<boolean>(false);

  const stripePromise: Promise<Stripe | null> | null = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, [publishableKey]);

  // Fetch publishable key on open
  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setErrorMessage(null);
      return;
    }

    fetch('/api/payment-config')
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg.publishableKey) {
          setPublishableKey(cfg.publishableKey);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Sync profile details
  useEffect(() => {
    if (user) {
      setCustomerName(profile?.displayName || user.displayName || '');
      setCustomerPhone(profile?.phone || '');
      setDeliveryAddress(profile?.address || '');
    }
  }, [user, profile, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    if (!user) {
      setErrorMessage('Please sign in with Google to place your order.');
      return false;
    }
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return false;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Please enter your phone number.');
      return false;
    }
    if (!deliveryAddress.trim()) {
      setErrorMessage('Please enter your delivery address.');
      return false;
    }
    if (cart.length === 0) {
      setErrorMessage('Your cart is empty.');
      return false;
    }
    return true;
  };

  // Initialize Embedded Stripe PaymentElement (works smoothly in both preview iframe and standalone tab)
  const handleInitEmbeddedStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setInitializingElement(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'gbp',
          customerEmail: user?.email || '',
          customerName: customerName.trim(),
          metadata: {
            userId: user?.uid || '',
            customerPhone: customerPhone.trim(),
            deliveryAddress: deliveryAddress.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error || 'Failed to initialize Stripe payment.');
      }

      setClientSecret(data.clientSecret);
    } catch (err: any) {
      console.error('PaymentIntent init error:', err);
      setErrorMessage(err?.message || 'Could not initialize payment form. Please try again.');
    } finally {
      setInitializingElement(false);
    }
  };

  // Complete order in Firestore once embedded Stripe payment succeeds
  const handleEmbeddedStripeSuccess = async (paymentIntentId: string) => {
    if (!user) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const orderItems: OrderItem[] = cart.map((item) => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        quantity: item.quantity,
        imageUrl: item.menuItem.imageUrl,
        notes: item.notes || '',
      }));

      const placedOrder = await createOrder({
        userId: user.uid,
        customerName: customerName.trim(),
        customerEmail: user.email || '',
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        items: orderItems,
        subtotal,
        deliveryFee,
        tax: 0,
        total,
        paymentMethod: 'stripe',
        paymentStatus: 'paid',
        paymentIntentId,
      });

      clearCart();
      setIsSubmitting(false);
      setClientSecret(null);
      onClose();
      onOrderSuccess(placedOrder);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Payment succeeded, but saving order failed.');
    }
  };

  // Optional Hosted Stripe Checkout (for standalone full-tab redirect)
  const handleHostedStripeRedirect = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const orderItems: OrderItem[] = cart.map((item) => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        quantity: item.quantity,
        imageUrl: item.menuItem.imageUrl,
        notes: item.notes || '',
      }));

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          deliveryFee,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: user?.email || '',
          deliveryAddress: deliveryAddress.trim(),
          userId: user?.uid || 'guest',
        }),
      });

      const data = await res.json();
      if (res.ok && data.url) {
        if (window.top && window.top !== window.self) {
          // Inside iframe: top-level redirect or inform user to use embedded card form
          window.top.location.href = data.url;
        } else {
          window.location.href = data.url;
        }
      } else {
        setIsSubmitting(false);
        setErrorMessage(data.error || 'Failed to initialize Stripe Checkout.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Could not redirect to Stripe. Please use the instant card form above.');
    }
  };

  // Cash on Delivery
  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const orderItems: OrderItem[] = cart.map((item) => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        quantity: item.quantity,
        imageUrl: item.menuItem.imageUrl,
        notes: item.notes || '',
      }));

      const placedOrder = await createOrder({
        userId: user!.uid,
        customerName: customerName.trim(),
        customerEmail: user!.email || '',
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        items: orderItems,
        subtotal,
        deliveryFee,
        tax: 0,
        total,
        paymentMethod: 'stripe' === paymentMethod ? 'stripe' : 'cash',
        paymentStatus: 'pending',
      });

      clearCart();
      setIsSubmitting(false);
      onClose();
      onOrderSuccess(placedOrder);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Failed to place order. Please try again.');
    }
  };

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            {clientSecret && (
              <button
                type="button"
                onClick={() => {
                  setClientSecret(null);
                  setErrorMessage(null);
                }}
                className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 transition cursor-pointer"
                title="Back to delivery details"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-lg font-bold text-stone-900 font-display">
              {clientSecret ? 'Complete Card Payment' : 'Checkout'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {!user ? (
            <div className="p-6 text-center space-y-4">
              <p className="text-sm text-stone-600">
                Please sign in with your Google account to proceed with your order.
              </p>
              <button
                onClick={login}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                Sign In with Google
              </button>
            </div>
          ) : clientSecret && stripePromise ? (
            /* Step 2: Embedded Stripe Card / Apple Pay / Google Pay Form */
            <div className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-stone-900">{customerName}</p>
                  <p className="text-stone-500 truncate max-w-[260px]">{deliveryAddress}</p>
                </div>
                <span className="text-sm font-bold text-amber-700">£{total.toFixed(2)}</span>
              </div>

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#d97706',
                      borderRadius: '12px',
                    },
                  },
                }}
              >
                <StripePaymentForm
                  amount={total}
                  currencySymbol="£"
                  isProcessing={isSubmitting}
                  onPaymentSuccess={handleEmbeddedStripeSuccess}
                  onError={(msg) => setErrorMessage(msg)}
                />
              </Elements>

              <p className="text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-bit SSL encrypted payment powered by Stripe</span>
              </p>
            </div>
          ) : (
            /* Step 1: Delivery Details & Payment Selection */
            <div className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Contact Fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={128}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      maxLength={32}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Contact Phone"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <textarea
                      required
                      rows={2}
                      maxLength={512}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Street address, city, postcode"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                      paymentMethod === 'stripe'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-500/30'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span>Card / Online (Stripe)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-500/30'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-stone-700" />
                    <span>Pay on Delivery</span>
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Delivery</span>
                  <span className="font-semibold text-stone-900">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      `£${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total Amount</span>
                  <span className="text-amber-700 font-bold">£{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              {paymentMethod === 'stripe' ? (
                <div className="space-y-2.5">
                  <form onSubmit={handleInitEmbeddedStripe}>
                    <button
                      type="submit"
                      disabled={initializingElement || isSubmitting}
                      className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm shadow-md shadow-amber-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                    >
                      {initializingElement ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Loading Secure Card Form...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Proceed to Pay £{total.toFixed(2)}</span>
                        </>
                      )}
                    </button>
                  </form>

                  {!isInIframe && (
                    <button
                      type="button"
                      onClick={handleHostedStripeRedirect}
                      disabled={initializingElement || isSubmitting}
                      className="w-full py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <span>Or pay on Stripe Hosted Checkout page</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </button>
                  )}

                  <p className="text-center text-[11px] text-stone-500">
                    Supports Credit/Debit Cards, Apple Pay & Google Pay via Stripe UK
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCashSubmit}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <span>Place Order • £{total.toFixed(2)}</span>
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
