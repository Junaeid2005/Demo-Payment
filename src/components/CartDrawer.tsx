import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, UtensilsCrossed, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
  onExploreMenu: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout, onExploreMenu }) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItemsCount,
    subtotal,
    deliveryFee,
    tax,
    total,
  } = useCart();

  if (!isCartOpen) return null;

  const freeDeliveryThreshold = 50;
  const amountToFreeDelivery = freeDeliveryThreshold - subtotal;
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-stone-150 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-600/10 text-amber-700 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-stone-900 leading-none">
                  Your Order Cart
                </h2>
                <span className="text-xs text-stone-500 font-medium">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} selected
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs font-semibold text-stone-500 hover:text-rose-600 transition p-1.5"
                  title="Clear all items"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Delivery Promo Progress Bar */}
          {cart.length > 0 && (
            <div className="px-5 py-3 bg-amber-50/70 border-b border-amber-200/50">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-1.5">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  {amountToFreeDelivery > 0
                    ? `Add $${amountToFreeDelivery.toFixed(2)} more for FREE Delivery`
                    : '🎉 You have unlocked FREE Delivery!'}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-amber-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-3xl bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
                  <UtensilsCrossed className="w-10 h-10 stroke-[1.5]" />
                </div>
                <h3 className="font-display font-bold text-lg text-stone-800">Your cart is empty</h3>
                <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-xs">
                  Browse our chef-curated menu of artisan burgers, pizzas, and pastas to get started.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onExploreMenu();
                  }}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
                >
                  Explore Food Menu
                </button>
              </div>
            ) : (
              cart.map(({ menuItem, quantity, notes }) => (
                <div
                  key={menuItem.id}
                  className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex gap-3.5 group hover:border-stone-300 transition"
                >
                  {/* Thumbnail */}
                  <img
                    src={menuItem.imageUrl}
                    alt={menuItem.name}
                    className="w-18 h-18 rounded-xl object-cover shrink-0 bg-stone-200"
                  />

                  {/* Info & Modifiers */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-stone-900 text-sm truncate leading-snug">
                          {menuItem.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(menuItem.id)}
                          className="text-stone-400 hover:text-rose-600 p-1 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {notes && (
                        <p className="text-[11px] text-amber-800 bg-amber-100/60 rounded px-1.5 py-0.5 mt-1 inline-block truncate max-w-[200px]">
                          Note: {notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/50">
                      <span className="font-bold text-stone-900 text-sm">
                        ${(menuItem.price * quantity).toFixed(2)}
                      </span>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-stone-200 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(menuItem.id, quantity - 1)}
                          className="text-stone-600 hover:text-stone-900 p-0.5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center text-stone-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(menuItem.id, quantity + 1)}
                          className="text-stone-600 hover:text-stone-900 p-0.5"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-stone-200 bg-stone-50/90 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-stone-900">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase text-[10px]">Free</span>
                    ) : (
                      `$${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8.25%)</span>
                  <span className="font-semibold text-stone-900">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-950 pt-2 border-t border-stone-200">
                  <span className="font-display">Estimated Total</span>
                  <span className="font-display text-amber-700">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-xl shadow-amber-600/25 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
