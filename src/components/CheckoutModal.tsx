import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  User as UserIcon,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../firebase/orders';
import { Order, OrderItem } from '../types';
import { StripePaymentForm } from './StripePaymentForm';

const LIVE_STRIPE_PK =
  (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51UVH6GEGjxbOgU28oUNUngQ9zVKJxOXHb6Vuiu8gb6cBalbeZCEW8sFsCGYWgdUWhluSflj0DZcoCNoSpFArRRwK00HmtrUXBk';

const staticStripePromise = LIVE_STRIPE_PK ? loadStripe(LIVE_STRIPE_PK) : null;

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

  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(() => staticStripePromise);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync profile details
  useEffect(() => {
    if (user) {
      setCustomerName(profile?.displayName || user.displayName || '');
      setCustomerPhone(profile?.phone || '');
      setDeliveryAddress(profile?.address || '');
    }
  }, [user, profile, isOpen]);

  // Ensure Stripe is ready
  useEffect(() => {
    if (!isOpen) return;

    if (!stripePromise) {
      fetch('/api/payment-config')
        .then((res) => res.json())
        .then((data) => {
          if (data.publishableKey) {
            setStripePromise(loadStripe(data.publishableKey));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, stripePromise]);

  // Initialize PaymentIntent
  const initPaymentIntent = useCallback(async (isRetry = false) => {
    if (total <= 0) return;

    setLoadingIntent(true);
    if (!isRetry) setErrorMessage(null);

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'gbp',
          customerName: customerName || user?.displayName || 'Valued Guest',
          customerEmail: user?.email || '',
          metadata: {
            itemCount: cart.length,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setErrorMessage(null);
      } else {
        setClientSecret(null);
        setErrorMessage(data.error || 'Failed to initialize payment gateway.');
      }
    } catch (err: any) {
      console.warn('Stripe intent error:', err);
      setClientSecret(null);
      setErrorMessage('Could not connect to payment gateway. Please click retry below.');
    } finally {
      setLoadingIntent(false);
    }
  }, [total, customerName, user?.displayName, user?.email, cart.length]);

  // Trigger PaymentIntent creation when modal is open and stripe is selected
  useEffect(() => {
    if (isOpen && paymentMethod === 'stripe' && total > 0 && !clientSecret) {
      initPaymentIntent();
    }
  }, [isOpen, paymentMethod, total, clientSecret, initPaymentIntent]);

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

  const saveOrder = async (payInfo: { method: 'stripe' | 'cash'; status: 'paid' | 'pending'; intentId?: string }) => {
    const orderItems: OrderItem[] = cart.map((item) => ({
      menuItemId: item.menuItem.id,
      name: item.menuItem.name,
      price: item.menuItem.price,
      quantity: item.quantity,
      imageUrl: item.menuItem.imageUrl,
      notes: '',
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
      paymentMethod: payInfo.method,
      paymentStatus: payInfo.status,
      paymentIntentId: payInfo.intentId || '',
    });

    clearCart();
    return placedOrder;
  };

  // Cash / Pay on delivery
  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const placedOrder = await saveOrder({ method: 'cash', status: 'pending' });
      setIsSubmitting(false);
      onClose();
      onOrderSuccess(placedOrder);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Failed to place order. Please try again.');
    }
  };

  // Stripe success
  const handleStripeSuccess = async (intentId: string) => {
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const placedOrder = await saveOrder({ method: 'stripe', status: 'paid', intentId });
      setIsSubmitting(false);
      onClose();
      onOrderSuccess(placedOrder);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage('Payment received, but saving order record failed. Please contact us.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <h2 className="text-lg font-bold text-stone-900 font-display">
            Checkout
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {!user ? (
            <div className="p-6 text-center space-y-4">
              <p className="text-sm text-stone-600">
                Please sign in with your Google account to proceed with your order.
              </p>
              <button
                onClick={login}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition"
              >
                Sign In with Google
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                  {paymentMethod === 'stripe' && !clientSecret && (
                    <button
                      type="button"
                      onClick={() => initPaymentIntent(true)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[11px] shrink-0 transition flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}
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
                    <span>Card / Online</span>
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
                  <span className="text-amber-700">£{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Action */}
              {paymentMethod === 'stripe' ? (
                <div>
                  {loadingIntent ? (
                    <div className="p-5 text-center text-xs text-stone-500 flex items-center justify-center gap-2 bg-stone-50 rounded-xl border border-stone-200">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                      <span>Connecting to secure card payment...</span>
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
                            borderRadius: '10px',
                          },
                        },
                      }}
                    >
                      <StripePaymentForm
                        amount={total}
                        currencySymbol="£"
                        isProcessing={isSubmitting}
                        onPaymentSuccess={handleStripeSuccess}
                        onError={(err) => setErrorMessage(err)}
                        disabled={!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()}
                      />
                    </Elements>
                  ) : (
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-center space-y-2.5">
                      <p className="text-xs text-stone-600">Click below to establish secure payment session:</p>
                      <button
                        type="button"
                        onClick={() => initPaymentIntent(true)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Connect to Card Payment</span>
                      </button>
                    </div>
                  )}
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
