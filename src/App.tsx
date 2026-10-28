import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PopularDishes } from './components/PopularDishes';
import { MenuSection } from './components/MenuSection';
import { MenuItemModal } from './components/MenuItemModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { UserDashboard } from './components/UserDashboard';
import { AdminPanel } from './components/AdminPanel';
import { AboutSection } from './components/AboutSection';
import { HoursAndContact } from './components/HoursAndContact';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { ShieldCheck } from 'lucide-react';
import { MenuItem, Order } from './types';
import { subscribeToMenuItems, INITIAL_MENU_ITEMS, ONE_POUND_ITEM, seedInitialMenuIfEmpty } from './firebase/menu';

const MainContent: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { setIsCartOpen } = useCart();

  const [activeView, setActiveView] = useState<'home' | 'menu' | 'profile' | 'admin'>('home');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(true);

  // Modals state
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Subscribe to real-time menu items from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToMenuItems(
      (items) => {
        if (items.length > 0) {
          const hasOnePound = items.some((i) => i.price === 1.00 || i.name?.toLowerCase().includes('baguette'));
          if (!hasOnePound) {
            setMenuItems([{ id: 'special-1pound-baguette', ...ONE_POUND_ITEM }, ...items]);
          } else {
            setMenuItems(items);
          }
        } else {
          // If Firestore is initially empty, fall back to initial items in memory
          // until admin seeds, so the restaurant UI is immediately vibrant and gorgeous!
          const fallbackWithIds: MenuItem[] = INITIAL_MENU_ITEMS.map((item, idx) => ({
            id: `init-${idx}`,
            ...item
          }));
          setMenuItems(fallbackWithIds);
        }
        setLoadingMenu(false);
      },
      (err) => {
        console.warn('Could not connect to Firestore menu collection:', err);
        const fallbackWithIds: MenuItem[] = INITIAL_MENU_ITEMS.map((item, idx) => ({
          id: `init-${idx}`,
          ...item
        }));
        setMenuItems(fallbackWithIds);
        setLoadingMenu(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // When admin logs in and menu is empty, attempt initial seed
  useEffect(() => {
    if (isAdmin) {
      seedInitialMenuIfEmpty().catch(() => {});
    }
  }, [isAdmin]);

  const handleOrderSuccess = (newOrder: Order) => {
    setConfirmedOrder(newOrder);
  };

  const handleTrackOrderFromConfirmation = () => {
    setConfirmedOrder(null);
    setActiveView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-amber-600 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenCheckout={() => setCheckoutModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeView === 'home' && (
          <>
            <Hero
              onExploreMenu={() => {
                setActiveView('menu');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              featuredItem={menuItems[0]}
            />
            <PopularDishes
              items={menuItems}
              onSelectItem={(item) => setSelectedItemForModal(item)}
              onViewMenu={() => {
                setActiveView('menu');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
            <MenuSection
              items={menuItems}
              onSelectItem={(item) => setSelectedItemForModal(item)}
            />
            <AboutSection />
            <HoursAndContact />
          </>
        )}

        {activeView === 'menu' && (
          <div className="pt-6">
            <MenuSection
              items={menuItems}
              onSelectItem={(item) => setSelectedItemForModal(item)}
            />
          </div>
        )}

        {activeView === 'profile' && (
          <UserDashboard onBackToMenu={() => setActiveView('menu')} />
        )}

        {activeView === 'admin' && (
          <AdminPanel />
        )}
      </main>

      {/* Footer */}
      <Footer onNavClick={(view, anchorId) => {
        setActiveView(view);
        if (view === 'home' && anchorId) {
          setTimeout(() => {
            const el = document.getElementById(anchorId);
            el?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }} />

      {/* Interactive Modals & Drawers */}
      <MenuItemModal
        item={selectedItemForModal}
        onClose={() => setSelectedItemForModal(null)}
      />

      <CartDrawer
        onProceedToCheckout={() => setCheckoutModalOpen(true)}
        onExploreMenu={() => {
          setActiveView('menu');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrderConfirmationModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        onViewDashboard={handleTrackOrderFromConfirmation}
      />

      {/* Floating Admin Panel Quick Shortcut */}
      <button
        onClick={() => {
          setActiveView(activeView === 'admin' ? 'home' : 'admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="fixed bottom-6 left-6 z-40 bg-stone-900/90 hover:bg-stone-900 text-stone-200 hover:text-amber-400 backdrop-blur-md border border-stone-700/80 shadow-2xl px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
        title="Admin Panel Shortcut"
      >
        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-stone-950 transition">
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
        <span>{activeView === 'admin' ? 'Exit Admin View' : 'Admin Panel Shortcut'}</span>
        {isAdmin && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/40 animate-pulse" title="Admin Logged In" />
        )}
      </button>

      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainContent />
      </CartProvider>
    </AuthProvider>
  );
}
