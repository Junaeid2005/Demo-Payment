import React, { useState } from 'react';
import { X, Clock, Flame, ShieldAlert, Plus, Minus, ShoppingBag, Sparkles } from 'lucide-react';
import { MenuItem } from '../types';
import { useCart } from '../context/CartContext';

interface MenuItemModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const MenuItemModal: React.FC<MenuItemModalProps> = ({ item, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState('');

  if (!item) return null;

  const handleAdd = () => {
    addToCart(item, quantity, specialNotes);
    onClose();
  };

  const totalPrice = (item.price * quantity).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white flex items-center justify-center backdrop-blur-xs transition"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Image */}
        <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <span className="px-3 py-1 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider shadow">
              {item.category}
            </span>
            <span className="text-2xl font-bold font-display text-white drop-shadow-md">
              £{item.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-stone-900">
              {item.name}
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-2.5 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-150 text-center">
            <div>
              <span className="text-[11px] text-stone-400 font-semibold block uppercase">Prep Time</span>
              <span className="text-xs sm:text-sm font-bold text-stone-800 flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {item.prepTime || '15 mins'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-400 font-semibold block uppercase">Calories</span>
              <span className="text-xs sm:text-sm font-bold text-stone-800 flex items-center justify-center gap-1 mt-0.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                {item.calories ? `${item.calories} kcal` : 'Chef special'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-400 font-semibold block uppercase">Availability</span>
              <span className={`text-xs sm:text-sm font-bold mt-0.5 block ${item.isAvailable ? 'text-emerald-700' : 'text-rose-600'}`}>
                {item.isAvailable ? 'Fresh & Ready' : 'Sold Out'}
              </span>
            </div>
          </div>

          {/* Dietary tags */}
          {item.dietary && item.dietary.length > 0 && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Dietary & Characteristics
              </label>
              <div className="flex flex-wrap gap-2">
                {item.dietary.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-amber-50 border border-amber-200/60 text-amber-800 rounded-xl text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1.5">
              Special Kitchen Requests (Optional)
            </label>
            <input
              type="text"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="e.g. Extra sauce, no onions, gluten-friendly preparation..."
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              maxLength={200}
            />
          </div>

          {/* Footer Controls: Quantity & Add Button */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-4">
            {/* Quantity */}
            <div className="flex items-center gap-3 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-xl bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center font-bold transition shadow-xs disabled:opacity-40"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-bold text-stone-900 text-sm">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 rounded-xl bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center font-bold transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to order button */}
            <button
              disabled={!item.isAvailable}
              onClick={handleAdd}
              className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98 ${
                item.isAvailable
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25 cursor-pointer'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Order • £{totalPrice}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
