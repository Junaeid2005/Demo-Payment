import React from 'react';
import { ArrowRight, Flame, Star, Sparkles, Clock, ShieldCheck, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { MenuItem } from '../types';

interface HeroProps {
  onExploreMenu: () => void;
  featuredItem?: MenuItem;
}

export const Hero: React.FC<HeroProps> = ({ onExploreMenu, featuredItem }) => {
  const { addToCart } = useCart();

  const defaultHeroDish: MenuItem = featuredItem || {
    id: 'hero-wagyu',
    name: 'Wagyu Truffle Smash Burger',
    description: 'Double Wagyu beef smash patties, black truffle aioli, aged Gruyère, and caramelized shallots on toasted brioche.',
    price: 18.50,
    category: 'Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    isAvailable: true,
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-semibold backdrop-blur-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Michelin-Crafted Comfort & Wood-Fired Delicacies</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-stone-100 font-display leading-[1.1]">
              Artisanal Flavors,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
                Uncompromising
              </span>{' '}
              Craft.
            </h1>

            <p className="text-stone-300 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
              Welcome to <span className="text-amber-300 font-medium">Savoria</span>. Immerse yourself in 48-hour sourdough Neapolitan pizzas, prime Wagyu smash burgers, and fresh handmade pastas prepared with locally-sourced organic ingredients.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onExploreMenu}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-base shadow-xl shadow-amber-600/30 hover:shadow-amber-600/40 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Order Online Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('about-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-stone-800/80 hover:bg-stone-800 text-stone-200 font-semibold text-base border border-stone-700/60 hover:border-stone-600 transition flex items-center justify-center cursor-pointer"
              >
                Our Story & Philosophy
              </button>
            </div>

            {/* £1 Flash Deal Highlight */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-stone-900/60 border border-amber-500/40 backdrop-blur-md flex items-center justify-between gap-3 max-w-lg mx-auto lg:mx-0 shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=400&q=80"
                  alt="Artisan Garlic Herb Baguette"
                  className="w-12 h-12 rounded-xl object-cover shrink-0 ring-1 ring-amber-400/50"
                />
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500 text-stone-950">
                      £1.00 Item
                    </span>
                    <span className="text-xs font-bold text-amber-300">Starter Special</span>
                  </div>
                  <p className="text-xs font-semibold text-stone-100 truncate mt-0.5">
                    Artisan Warm Garlic Herb Baguette
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  addToCart(
                    {
                      id: 'special-1pound-baguette',
                      name: 'Artisan Warm Garlic Herb Baguette',
                      description: 'Freshly baked French artisanal sourdough baguette slice brushed with whipped roasted garlic herb butter, fresh parsley, and Maldon sea salt flakes.',
                      price: 1.00,
                      category: 'Starters',
                      imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80',
                      isAvailable: true,
                    },
                    1
                  )
                }
                className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                Add for £1.00
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-stone-800/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-display text-amber-400">4.9 ★</p>
                <p className="text-xs text-stone-400 mt-0.5">Over 2,400+ foodies review</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-display text-amber-400">30 Min</p>
                <p className="text-xs text-stone-400 mt-0.5">Average delivery speed</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-display text-amber-400">100%</p>
                <p className="text-xs text-stone-400 mt-0.5">Fresh artisanal ingredients</p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual with interactive card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer Glow */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl blur-xl opacity-30 animate-pulse" />

              {/* Main Image Container */}
              <div className="relative rounded-3xl overflow-hidden bg-stone-800 border border-stone-700/80 shadow-2xl aspect-[4/3] sm:aspect-[4/3] lg:aspect-[5/4] group">
                <img
                  src={defaultHeroDish.imageUrl}
                  alt={defaultHeroDish.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />

                {/* Top Badge */}
                <div className="absolute top-4 left-4 bg-stone-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-700/80 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold text-stone-200">Today's Chef Recommendation</span>
                </div>

                {/* Bottom Overlay Content */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-stone-900/90 backdrop-blur-md border border-stone-700/80 shadow-lg flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-stone-100 text-lg truncate">
                      {defaultHeroDish.name}
                    </p>
                    <p className="text-xs text-amber-400 font-semibold mt-0.5">
                      £{defaultHeroDish.price.toFixed(2)} • Double Wagyu Beef
                    </p>
                  </div>
                  <button
                    onClick={() => addToCart(defaultHeroDish, 1)}
                    className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-xs shadow transition active:scale-95 cursor-pointer"
                  >
                    Quick Add
                  </button>
                </div>
              </div>

              {/* Floating Pill - Authentic Wood Fired */}
              <div className="hidden sm:flex absolute -top-5 -right-5 bg-stone-900/95 border border-stone-700/80 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md items-center gap-3 animate-float">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-200">Express Delivery</p>
                  <p className="text-[11px] text-stone-400">Hot to your doorstep</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
