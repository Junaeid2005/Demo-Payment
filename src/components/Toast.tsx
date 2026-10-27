import React from 'react';
import { CheckCircle2, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Toast: React.FC = () => {
  const { lastAddedItem, clearLastAddedItem, setIsCartOpen } = useCart();

  if (!lastAddedItem) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-bounce-in bg-stone-900 text-stone-100 rounded-2xl shadow-2xl p-4 border border-stone-700/60 flex items-center gap-3.5 backdrop-blur-md">
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-stone-800">
        <img
          src={lastAddedItem.imageUrl}
          alt={lastAddedItem.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Added to Order</span>
        </div>
        <p className="font-medium text-sm text-stone-100 truncate mt-0.5">
          {lastAddedItem.name}
        </p>
        <p className="text-xs text-stone-400">
          £{lastAddedItem.price.toFixed(2)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            clearLastAddedItem();
            setIsCartOpen(true);
          }}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          View
        </button>
        <button
          onClick={clearLastAddedItem}
          className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
