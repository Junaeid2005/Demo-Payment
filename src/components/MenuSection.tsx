import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Eye, Check, Flame, Sparkles, Utensils } from 'lucide-react';
import { MenuItem, FoodCategory } from '../types';
import { useCart } from '../context/CartContext';

interface MenuSectionProps {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
}

const CATEGORIES: { label: string; value: string; icon: string }[] = [
  { label: 'All Dishes', value: 'all', icon: '🍽️' },
  { label: 'Burgers', value: 'Burgers', icon: '🍔' },
  { label: 'Pizza', value: 'Pizza', icon: '🍕' },
  { label: 'Pasta', value: 'Pasta', icon: '🍝' },
  { label: 'Starters', value: 'Starters', icon: '🥗' },
  { label: 'Drinks', value: 'Drinks', icon: '🍹' },
  { label: 'Desserts', value: 'Desserts', icon: '🍰' },
];

const DIETARY_FILTERS = ['All Dietary', 'Vegetarian', 'Gluten-Free', 'Chef Special'];

export const MenuSection: React.FC<MenuSectionProps> = ({ items, onSelectItem }) => {
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDietary, setSelectedDietary] = useState<string>('All Dietary');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category match
      if (selectedCategory !== 'all' && item.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Dietary match
      if (selectedDietary !== 'All Dietary') {
        if (!item.dietary || !item.dietary.includes(selectedDietary)) {
          return false;
        }
      }
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [items, selectedCategory, selectedDietary, searchQuery]);

  return (
    <section id="menu-section" className="py-16 sm:py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3.5 py-1 rounded-full mb-3">
            <Utensils className="w-3.5 h-3.5" />
            <span>Artisanal Cuisine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-stone-900 tracking-tight">
            Our Culinary Menu
          </h2>
          <p className="text-stone-600 mt-3 text-sm sm:text-base leading-relaxed">
            Crafted with passion, fired to perfection. Explore our master creations or filter by your favorite flavors.
          </p>
        </div>

        {/* Controls: Categories Bar */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 gap-2.5 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-2 cursor-pointer shadow-2xs ${
                selectedCategory === cat.value
                  ? 'bg-stone-900 text-amber-400 shadow-md scale-105'
                  : 'bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/80'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Search & Dietary Filter Row */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs max-w-4xl mx-auto">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search burgers, pizzas, pastas, desserts..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 rounded-xl border-none focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 text-stone-900 placeholder:text-stone-400"
            />
          </div>

          {/* Dietary filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
            {DIETARY_FILTERS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedDietary(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 cursor-pointer ${
                  selectedDietary === tag
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results summary & Active filters */}
        <div className="mt-6 flex items-center justify-between text-xs text-stone-500 max-w-4xl mx-auto px-1">
          <span>
            Showing <strong className="text-stone-800">{filteredItems.length}</strong> items
          </span>
          {(searchQuery || selectedCategory !== 'all' || selectedDietary !== 'All Dietary') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedDietary('All Dietary');
              }}
              className="text-amber-700 hover:underline font-semibold cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Menu Items Grid */}
        <div className="mt-8">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-300 max-w-2xl mx-auto p-8">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Utensils className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-stone-800">No dishes match your selection</h3>
              <p className="text-stone-500 text-sm mt-1 max-w-md mx-auto">
                Try searching for something else, or clear your filters to view our full artisanal menu.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedDietary('All Dietary');
                }}
                className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition"
              >
                View Full Menu
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group ${
                    !item.isAvailable ? 'opacity-70 grayscale-[25%]' : ''
                  }`}
                >
                  {/* Food Image */}
                  <div
                    onClick={() => onSelectItem(item)}
                    className="relative aspect-[16/10] overflow-hidden bg-stone-100 cursor-pointer"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4">
                      <span className="text-white text-xs font-medium flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Click for details & ingredients
                      </span>
                    </div>

                    {/* Category & Dietary Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                        {item.category}
                      </span>
                      {item.isPopular && (
                        <span className="bg-amber-500 text-stone-950 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-0.5">
                          <Flame className="w-3 h-3" /> Popular
                        </span>
                      )}
                    </div>

                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="px-3.5 py-1.5 bg-red-600 text-white font-bold text-xs rounded-xl shadow-lg uppercase tracking-wider">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {item.dietary && item.dietary.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {item.dietary.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <h3
                        onClick={() => onSelectItem(item)}
                        className="font-display font-bold text-xl text-stone-900 hover:text-amber-700 transition cursor-pointer"
                      >
                        {item.name}
                      </h3>

                      <p className="text-stone-500 text-xs sm:text-sm mt-2 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-stone-400 block font-medium">Price</span>
                        <span className="text-xl font-extrabold text-stone-900">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectItem(item)}
                          className="px-3 py-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium text-xs transition"
                        >
                          Details
                        </button>

                        <button
                          disabled={!item.isAvailable}
                          onClick={() => addToCart(item, 1)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                            item.isAvailable
                              ? 'bg-amber-600 hover:bg-amber-500 active:scale-95 text-white cursor-pointer'
                              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
