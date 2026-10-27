import React from 'react';
import { Star, Plus, Eye, Flame, Sparkles } from 'lucide-react';
import { MenuItem } from '../types';
import { useCart } from '../context/CartContext';

interface PopularDishesProps {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  onViewMenu: () => void;
}

export const PopularDishes: React.FC<PopularDishesProps> = ({ items, onSelectItem, onViewMenu }) => {
  const { addToCart } = useCart();
  const popularItems = items.filter((i) => i.isPopular && i.isAvailable).slice(0, 4);
  const displayList = popularItems.length > 0 ? popularItems : items.slice(0, 4);

  return (
    <section id="popular-section" className="py-16 sm:py-24 bg-stone-100/70 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full mb-3">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>Patron Favorites</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-stone-900 tracking-tight">
              Most Loved Delicacies
            </h2>
            <p className="text-stone-600 mt-2 text-sm sm:text-base max-w-xl">
              Hand-picked by our master chefs and overwhelmingly adored by our guests. Each recipe reflects years of culinary refinement.
            </p>
          </div>
          <button
            onClick={onViewMenu}
            className="text-amber-700 hover:text-amber-800 font-bold text-sm flex items-center gap-1.5 self-start md:self-auto group transition"
          >
            <span>Explore All Dishes</span>
            <span className="group-hover:translate-x-1 transition">→</span>
          </button>
        </div>

        {displayList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-stone-200">
            <p className="text-stone-500">Popular dishes are being prepared in the kitchen...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayList.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="bg-stone-900/85 backdrop-blur-xs text-amber-400 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      Popular
                    </span>
                    {item.category && (
                      <span className="bg-white/90 backdrop-blur-xs text-stone-800 font-semibold text-[11px] px-2.5 py-1 rounded-lg">
                        {item.category}
                      </span>
                    )}
                  </div>
                  {item.prepTime && (
                    <span className="absolute bottom-3 right-3 bg-stone-950/75 backdrop-blur-xs text-stone-300 text-[10px] font-medium px-2 py-0.5 rounded-md">
                      {item.prepTime}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => onSelectItem(item)}
                      className="font-display font-bold text-lg text-stone-900 hover:text-amber-700 transition cursor-pointer line-clamp-1"
                    >
                      {item.name}
                    </h3>
                    <p className="text-stone-500 text-xs sm:text-sm mt-1.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-stone-400 block">Price</span>
                      <span className="text-lg font-bold text-stone-900">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectItem(item)}
                        className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition"
                        title="View dish details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => addToCart(item, 1)}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
