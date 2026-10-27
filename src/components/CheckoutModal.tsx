import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, MapPin, Phone, User as UserIcon, MessageSquare, AlertCircle, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../firebase/orders';
import { updateUserProfile } from '../firebase/auth';
import { Order, OrderItem } from '../types';

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

  if (!isOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('Please sign in with your Google account to complete your order.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage('Please provide a valid contact phone number.');
      return;
    }

    if (fulfillmentType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMessage('Please provide your complete delivery address.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty. Please add items to proceed.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems: OrderItem[] = cart.map((item) => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        quantity: item.quantity,
        imageUrl: item.menuItem.imageUrl,
        notes: item.notes || '',
      }));

      const finalAddress = fulfillmentType === 'pickup' ? 'In-Restaurant Pickup (Savoria Bistro Front Counter)' : deliveryAddress;
      const finalDeliveryFee = fulfillmentType === 'pickup' ? 0 : deliveryFee;
      const finalTotal = subtotal + finalDeliveryFee + tax;

      const placedOrder = await createOrder({
        userId: user.uid,
        customerName,
        customerEmail: user.email || customerEmail,
        customerPhone,
        deliveryAddress: finalAddress,
        specialInstructions,
        items: orderItems,
        subtotal,
        deliveryFee: finalDeliveryFee,
        tax,
        total: finalTotal,
      });

      // Optionally update saved phone & address in user profile
      if (saveInfoForFuture && user.uid) {
        try {
          await updateUserProfile(user.uid, {
            phone: customerPhone,
            address: fulfillmentType === 'delivery' ? deliveryAddress : profile?.address || '',
          });
          refreshProfile();
        } catch (e) {
          console.warn('Could not save updated profile address:', e);
        }
      }

      clearCart();
      setIsSubmitting(false);
      onClose();
      onOrderSuccess(placedOrder);
    } catch (error: any) {
      console.error('Failed to submit order:', error);
      setIsSubmitting(false);
      setErrorMessage(
        error?.message ? `Failed to place order: ${error.message}` : 'An unexpected error occurred while placing your order. Please try again.'
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
              Secure checkout powered by Firebase Cloud Firestore
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
        <div className="p-6 sm:p-8">
          {/* Auth requirement reminder if not logged in */}
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
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-6">
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

              {/* Customer Info Form */}
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
                      placeholder="e.g. (555) 382-9912"
                      className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* Address (If Delivery) */}
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
                      placeholder="Street address, apt/suite, city, zip code..."
                      className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Special Instructions (Optional) */}
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
                    placeholder="e.g. Ring doorbell, leave at door, no plastic cutlery please..."
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
                  <span>Total Amount</span>
                  <span className="text-amber-700 font-display text-base">
                    £{(subtotal + (fulfillmentType === 'pickup' ? 0 : deliveryFee) + tax).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-xl shadow-amber-600/30 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Transmitting Order to Kitchen...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>
                      Place Order • £{(subtotal + (fulfillmentType === 'pickup' ? 0 : deliveryFee) + tax).toFixed(2)}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
