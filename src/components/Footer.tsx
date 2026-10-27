import React, { useState } from 'react';
import { UtensilsCrossed, Heart, ArrowUp, Instagram, Facebook, Twitter, Mail, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onNavClick: (view: 'home' | 'menu' | 'profile' | 'admin', anchorId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavClick }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setTimeout(() => {
        setNewsletterSubscribed(false);
        setNewsletterEmail('');
      }, 4000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-stone-950 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-stone-800/80">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/30">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold font-display text-white tracking-wide block leading-none">
                  SAVORIA
                </span>
                <span className="text-[10px] tracking-widest text-amber-500 uppercase font-medium">
                  Artisanal Bistro & Bar
                </span>
              </div>
            </div>

            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Dedicated to the timeless art of artisanal dining. From slow-fermented Neapolitan pizzas and dry-aged Wagyu smash burgers to handcrafted pasta ribbons.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="#instagram"
                className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500 hover:text-amber-400 text-stone-400 flex items-center justify-center transition"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#facebook"
                className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500 hover:text-amber-400 text-stone-400 flex items-center justify-center transition"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#twitter"
                className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500 hover:text-amber-400 text-stone-400 flex items-center justify-center transition"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-stone-100 text-xs font-display">
              Explore
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  onClick={() => onNavClick('home')}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  Home Showcase
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('menu')}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  Full Food Menu
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('home', 'popular-section')}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  Popular Dishes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('home', 'about-section')}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  Our Heritage
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('home', 'contact-section')}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  Hours & Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="lg:col-span-2 space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-stone-100 text-xs font-display">
              Cuisine
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  onClick={() => onNavClick('menu')}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  Wagyu Burgers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('menu')}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  Wood-Fired Pizza
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('menu')}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  Handmade Pasta
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('menu')}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  Craft Botanical Drinks
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('menu')}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  Artisanal Desserts
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-stone-100 text-xs font-display">
              The Chef's Circle
            </h4>
            <p className="text-stone-400 text-xs leading-relaxed">
              Subscribe for private invitations to seasonal tasting menus, secret chef specials, and complimentary dessert on your birthday.
            </p>

            {newsletterSubscribed ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>You're enrolled in The Chef's Circle!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder:text-stone-500 text-xs focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
                  >
                    Join
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Credits & Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Savoria Artisanal Bistro & Bar. All rights reserved.</p>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-stone-400 hover:text-amber-400 transition cursor-pointer"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
