import React from 'react';
import { Award, HeartHandshake, Leaf, Sparkles, UtensilsCrossed } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about-section" className="py-20 sm:py-28 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Images Grid */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="rounded-3xl overflow-hidden shadow-lg aspect-[4/5] bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80"
                  alt="Head Chef plating dish"
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200/60">
                <p className="text-2xl font-bold font-display text-amber-800">48-Hour</p>
                <p className="text-xs text-amber-900/80 mt-1">Slow cold-fermentation for sourdough Neapolitan pizza crusts</p>
              </div>
            </div>

            <div className="space-y-4 pt-8">
              <div className="p-5 rounded-3xl bg-stone-900 text-stone-150">
                <p className="text-2xl font-bold font-display text-amber-400">100%</p>
                <p className="text-xs text-stone-400 mt-1">Heritage breed Wagyu and organic heirloom vegetables</p>
              </div>
              <div className="rounded-3xl overflow-hidden shadow-lg aspect-[4/5] bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
                  alt="Restaurant interior"
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Our Culinary Heritage</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-stone-900 leading-tight">
              A Symphony of Traditional Craft & Modern Gastronomy
            </h2>

            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              Founded in 2019, <strong className="text-stone-900">Savoria</strong> began with a pure singular conviction: extraordinary food doesn’t require pretension—it requires devotion to time-honored techniques, uncompromising quality, and the freshest organic ingredients.
            </p>

            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              From our live wood-fired oven shipped directly from Naples to our in-house pasta laboratory rolling fresh ribbons every morning, each plate is an intimate invitation into our culinary soul.
            </p>

            {/* Feature Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-150">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">Farm-to-Table</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Sourced from California organic family farms daily.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">Master Craftsmanship</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Led by Executive Chef Matteo Bellini and culinary team.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
