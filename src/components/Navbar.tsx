import React, { useState, useRef, useEffect } from 'react';
import {
  UtensilsCrossed,
  ShoppingBag,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Menu as MenuIcon,
  X,
  Clock,
  Sparkles,
  Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  activeView: 'home' | 'menu' | 'profile' | 'admin';
  setActiveView: (view: 'home' | 'menu' | 'profile' | 'admin') => void;
  onOpenCheckout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView }) => {
  const { user, profile, isAdmin, login, logout, loading } = useAuth();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (view: 'home' | 'menu' | 'profile' | 'admin', anchorId?: string) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    if (view === 'home' && anchorId) {
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    } else if (view === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs transition-all">
      {/* Top Banner Notice */}
      <div className="bg-stone-900 text-stone-300 text-xs py-1.5 px-4 text-center hidden sm:flex items-center justify-center gap-4 border-b border-stone-800">
        <span className="flex items-center gap-1.5 text-amber-400 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          Chef's Tasting Menu available this week
        </span>
        <span className="text-stone-600">•</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          Open Today: 11:00 AM – 10:00 PM
        </span>
        <span className="text-stone-600">•</span>
        <span>Free delivery on orders over $50</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-600/20 group-hover:scale-105 transition">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-stone-900 font-display block leading-none">
                SAVORIA
              </span>
              <span className="text-[11px] font-medium tracking-widest text-amber-700 uppercase">
                Artisanal Bistro & Bar
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => handleNavClick('home')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                activeView === 'home'
                  ? 'text-amber-700 bg-amber-50'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('menu')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                activeView === 'menu'
                  ? 'text-amber-700 bg-amber-50'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Food Menu
            </button>
            <button
              onClick={() => handleNavClick('home', 'popular-section')}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
            >
              Popular
            </button>
            <button
              onClick={() => handleNavClick('home', 'about-section')}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
            >
              About Us
            </button>
            <button
              onClick={() => handleNavClick('home', 'contact-section')}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
            >
              Hours & Contact
            </button>

            {/* Admin Quick Link if admin */}
            {isAdmin && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`ml-2 px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition ${
                  activeView === 'admin'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-100/80 text-amber-900 hover:bg-amber-200/80'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>

          {/* Action buttons (Cart + Auth) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition flex items-center justify-center group"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5 text-stone-700 group-hover:scale-105 transition" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Auth Button or User Menu */}
            {loading ? (
              <div className="w-9 h-9 rounded-xl bg-stone-200 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-amber-500/30"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-stone-800 max-w-[90px] truncate hidden sm:inline">
                    {user.displayName || 'Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="text-sm font-bold text-stone-900 truncate">
                        {user.displayName || 'Gourmet Patron'}
                      </p>
                      <p className="text-xs text-stone-500 truncate">{user.email}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                            Administrator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700">
                            Patron Member
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setActiveView('profile');
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition ${
                          activeView === 'profile'
                            ? 'text-amber-700 bg-amber-50 font-medium'
                            : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <Receipt className="w-4 h-4 text-stone-500" />
                        <span>My Orders & Profile</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setActiveView('admin');
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition ${
                            activeView === 'admin'
                              ? 'text-amber-700 bg-amber-50 font-medium'
                              : 'text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-stone-100 pt-1">
                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          await logout();
                          setActiveView('home');
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
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
                <span className="hidden sm:inline">Sign In with Google</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-stone-700 hover:bg-stone-100 md:hidden transition"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-4">
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold ${
              activeView === 'home' ? 'text-amber-700 bg-amber-50' : 'text-stone-700'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNavClick('menu')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold ${
              activeView === 'menu' ? 'text-amber-700 bg-amber-50' : 'text-stone-700'
            }`}
          >
            Food Menu
          </button>
          <button
            onClick={() => handleNavClick('home', 'popular-section')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-700"
          >
            Popular Dishes
          </button>
          <button
            onClick={() => handleNavClick('home', 'about-section')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-700"
          >
            About Us
          </button>
          <button
            onClick={() => handleNavClick('home', 'contact-section')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-700"
          >
            Hours & Contact
          </button>

          {user && (
            <button
              onClick={() => handleNavClick('profile')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between ${
                activeView === 'profile' ? 'text-amber-700 bg-amber-50' : 'text-stone-700'
              }`}
            >
              <span>My Orders & Profile</span>
              <Receipt className="w-4 h-4 text-stone-400" />
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between ${
                activeView === 'admin' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-900'
              }`}
            >
              <span>Admin Management Dashboard</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {!user && (
            <button
              onClick={login}
              className="w-full mt-2 py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow"
            >
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
