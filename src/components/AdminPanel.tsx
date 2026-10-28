import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle2,
  ChefHat,
  Sparkles,
  Flame,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MenuItem, Order, OrderStatus, UserProfile } from '../types';
import {
  subscribeToMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  seedInitialMenuIfEmpty,
  INITIAL_MENU_ITEMS
} from '../firebase/menu';
import { subscribeToAllOrders, updateOrderStatus } from '../firebase/orders';
import { subscribeToUsers, updateUserRole } from '../firebase/users';

// High-resolution culinary image presets for instant food addition
const PRESET_FOOD_IMAGES = [
  { name: 'Gourmet Smash Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { name: 'Smoked Bacon Burger', url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80' },
  { name: 'Neapolitan Margherita', url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80' },
  { name: 'Truffle & Mushroom Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
  { name: 'Prosciutto Gourmet Pizza', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80' },
  { name: 'Truffle Egg Pasta', url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80' },
  { name: 'Beef Short Rib Pappardelle', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281e04?auto=format&fit=crop&w=800&q=80' },
  { name: 'Artisan Burrata Caprese', url: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?auto=format&fit=crop&w=800&q=80' },
  { name: 'Crispy Calamari Fritti', url: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=800&q=80' },
  { name: 'Blood Orange Spritz', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80' },
  { name: 'Tiramisù Tradizionale', url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80' },
  { name: 'Belgian Chocolate Fondant', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Warm Garlic Herb Baguette (£1)', url: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80' },
];

export const AdminPanel: React.FC = () => {
  const { user, isAdmin, login, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'food' | 'orders' | 'users'>('dashboard');

  // Real-time Firestore states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  // Food modal state
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Food Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('Burgers');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formDietary, setFormDietary] = useState<string[]>([]);
  const [formPrepTime, setFormPrepTime] = useState('15 mins');
  const [formCalories, setFormCalories] = useState('');
  const [isSavingFood, setIsSavingFood] = useState(false);

  // Orders Filter
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Seeding feedback
  const [seedingMessage, setSeedingMessage] = useState<string | null>(null);

  // Food search & category filter in admin
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState('all');

  useEffect(() => {
    if (!isAdmin) return;

    const unsubMenu = subscribeToMenuItems((items) => setMenuItems(items));
    const unsubOrders = subscribeToAllOrders((allOrders) => setOrders(allOrders));
    const unsubUsers = subscribeToUsers((allUsers) => setUsersList(allUsers));

    return () => {
      unsubMenu();
      unsubOrders();
      unsubUsers();
    };
  }, [isAdmin]);

  // Calculations for stats
  const stats = useMemo(() => {
    const totalOrdersCount = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'delivered');
    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const activeOrdersCount = orders.filter(
      (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing' || o.status === 'ready'
    ).length;
    const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / (totalOrdersCount || 1) : 0;

    return {
      totalOrdersCount,
      totalRevenue,
      activeOrdersCount,
      completedOrdersCount: completedOrders.length,
      avgOrderValue,
      totalMenuItems: menuItems.length,
      totalUsers: usersList.length,
    };
  }, [orders, menuItems, usersList]);

  // Open modal for adding
  const handleOpenAddFood = () => {
    setEditingItem(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormCategory('Burgers');
    setFormImageUrl(PRESET_FOOD_IMAGES[0].url);
    setFormIsAvailable(true);
    setFormIsPopular(false);
    setFormDietary([]);
    setFormPrepTime('15 mins');
    setFormCalories('650');
    setFoodModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditFood = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormPrice(item.price.toString());
    setFormCategory(item.category);
    setFormImageUrl(item.imageUrl);
    setFormIsAvailable(item.isAvailable);
    setFormIsPopular(!!item.isPopular);
    setFormDietary(item.dietary || []);
    setFormPrepTime(item.prepTime || '15 mins');
    setFormCalories(item.calories ? item.calories.toString() : '');
    setFoodModalOpen(true);
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice || !formImageUrl) {
      alert('Please fill out dish name, price, and image URL.');
      return;
    }

    setIsSavingFood(true);
    try {
      const payload: Omit<MenuItem, 'id'> = {
        name: formName.trim(),
        description: formDescription.trim(),
        price: parseFloat(formPrice),
        category: formCategory,
        imageUrl: formImageUrl.trim(),
        isAvailable: formIsAvailable,
        isPopular: formIsPopular,
        dietary: formDietary,
        prepTime: formPrepTime,
        calories: formCalories ? parseInt(formCalories) : undefined,
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, payload);
      } else {
        await addMenuItem(payload);
      }

      setIsSavingFood(false);
      setFoodModalOpen(false);
    } catch (err: any) {
      setIsSavingFood(false);
      alert('Failed to save menu item: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteFood = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from the menu?`)) {
      try {
        await deleteMenuItem(id);
      } catch (err) {
        alert('Could not delete menu item.');
      }
    }
  };

  const handleSeedMenu = async () => {
    if (confirm('Do you want to seed the standard gourmet restaurant dishes into Firestore?')) {
      setSeedingMessage('Seeding dishes into Firestore...');
      try {
        const result = await seedInitialMenuIfEmpty();
        if (result) {
          setSeedingMessage('Successfully seeded restaurant menu items!');
        } else {
          setSeedingMessage('Menu already contains items. Existing items preserved.');
        }
        setTimeout(() => setSeedingMessage(null), 4000);
      } catch (e) {
        setSeedingMessage('Seeding failed. Please check permissions.');
        setTimeout(() => setSeedingMessage(null), 4000);
      }
    }
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
        return false;
      }
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase();
        const matchesNumber = order.orderNumber.toLowerCase().includes(q);
        const matchesName = order.customerName.toLowerCase().includes(q);
        const matchesPhone = order.customerPhone.toLowerCase().includes(q);
        if (!matchesNumber && !matchesName && !matchesPhone) return false;
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  // Filtered food list in admin
  const filteredFood = useMemo(() => {
    return menuItems.filter((item) => {
      if (foodCategoryFilter !== 'all' && item.category.toLowerCase() !== foodCategoryFilter.toLowerCase()) {
        return false;
      }
      if (foodSearch.trim()) {
        const q = foodSearch.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [menuItems, foodCategoryFilter, foodSearch]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-8 h-8 text-amber-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display text-stone-900">
              Admin Management Portal
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-1">
              Authorized administrator access for restaurant menu management, live customer orders, and Stripe payments.
            </p>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs space-y-1.5">
            <p className="font-semibold text-stone-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
              <span>Designated Owner Email:</span>
            </p>
            <p className="font-mono text-amber-800 font-bold bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 break-all">
              junaeidshohan2005@gmail.com
            </p>
            {user && (
              <p className="text-stone-500 pt-2 border-t border-stone-200/80">
                Currently signed in as: <span className="font-semibold text-stone-800">{user.email}</span>
              </p>
            )}
          </div>

          {!user ? (
            <button
              onClick={login}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign In with Owner Google Account</span>
            </button>
          ) : (
            <button
              onClick={async () => {
                await logout();
                await login();
              }}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Switch Account to junaeidshohan2005@gmail.com</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-stone-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              Restaurant Management Console
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-stone-900 mt-2">
            Operations & Administration
          </h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Real-time management for culinary offerings, incoming customer orders, and registered patron profiles.
          </p>
        </div>

        {seedingMessage && (
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-medium animate-in fade-in">
            {seedingMessage}
          </div>
        )}
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center overflow-x-auto gap-2 py-4 border-b border-stone-200 no-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-stone-900 text-amber-400 shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'orders'
              ? 'bg-stone-900 text-amber-400 shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Order Management</span>
          {stats.activeOrdersCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-extrabold text-[10px]">
              {stats.activeOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('food')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'food'
              ? 'bg-stone-900 text-amber-400 shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Food Menu Management</span>
          <span className="text-[10px] text-stone-400 font-normal">({stats.totalMenuItems})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'users'
              ? 'bg-stone-900 text-amber-400 shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Profiles</span>
          <span className="text-[10px] text-stone-400 font-normal">({stats.totalUsers})</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="mt-8 space-y-8">
          {/* Key KPI Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Gross Sales</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold font-display text-stone-900">
                £{stats.totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-stone-400 mt-1">From active customer transactions</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold font-display text-stone-900">
                {stats.totalOrdersCount}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                {stats.activeOrdersCount} in active kitchen pipeline
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Menu Offerings</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold font-display text-stone-900">
                {stats.totalMenuItems}
              </p>
              <p className="text-xs text-stone-400 mt-1">Across burgers, pizza, pasta & drinks</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Registered Patrons</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold font-display text-stone-900">
                {stats.totalUsers}
              </p>
              <p className="text-xs text-stone-400 mt-1">Authenticated via Google accounts</p>
            </div>
          </div>

          {/* Quick Action & Seeding Banner */}
          <div className="bg-gradient-to-r from-stone-900 to-stone-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
            <div>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Menu & Database Seeding Tool
              </span>
              <h3 className="text-2xl font-bold font-display mt-1">
                Need to populate or refresh sample gourmet food items?
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-xl">
                One-click seeder loads our complete 14-item artisanal menu directly into your Firestore database with high-resolution imagery and realistic pricing.
              </p>
            </div>
            <button
              onClick={handleSeedMenu}
              className="px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition active:scale-95 shrink-0 cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>Seed Initial Menu (Firestore)</span>
            </button>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-stone-150">
              <div>
                <h3 className="font-display font-bold text-lg text-stone-900">
                  Recent Kitchen Orders
                </h3>
                <p className="text-xs text-stone-500">Live order queue</p>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
              >
                <span>View All Orders</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs text-stone-400 py-8 text-center">No orders recorded yet.</p>
            ) : (
              <div className="divide-y divide-stone-150">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">#{order.orderNumber}</span>
                        <span className="font-medium text-stone-700">• {order.customerName}</span>
                      </div>
                      <span className="text-[11px] text-stone-400">
                        {order.items.length} items • £{order.total.toFixed(2)} • {new Date(order.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          order.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedOrderDetails(order);
                          setActiveTab('orders');
                        }}
                        className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50"
                        title="View order"
                      >
                        <Eye className="w-3.5 h-3.5 text-stone-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FOOD MENU MANAGEMENT */}
      {activeTab === 'food' && (
        <div className="mt-8 space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  placeholder="Search dish title or description..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <select
                value={foodCategoryFilter}
                onChange={(e) => setFoodCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-700"
              >
                <option value="all">All Categories</option>
                <option value="Burgers">Burgers</option>
                <option value="Pizza">Pizza</option>
                <option value="Pasta">Pasta</option>
                <option value="Starters">Starters</option>
                <option value="Drinks">Drinks</option>
                <option value="Desserts">Desserts</option>
              </select>
            </div>

            <button
              onClick={handleOpenAddFood}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>

          {/* Food Items Table / Cards */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Dish</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Dietary Tags</th>
                    <th className="py-3.5 px-4">Availability</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {filteredFood.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        No food items match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredFood.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-12 h-12 rounded-xl object-cover bg-stone-100 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-stone-900 text-sm truncate max-w-xs">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-stone-500 truncate max-w-xs mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-semibold text-[11px]">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-stone-900 text-sm">
                          £{item.price.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {item.dietary && item.dietary.length > 0 ? (
                              item.dietary.map((d) => (
                                <span
                                  key={d}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200"
                                >
                                  {d}
                                </span>
                              ))
                            ) : (
                              <span className="text-stone-400 text-[11px]">—</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => toggleMenuItemAvailability(item.id, item.isAvailable)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              item.isAvailable
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                            title="Click to toggle availability"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${item.isAvailable ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                            <span>{item.isAvailable ? 'Available' : 'Sold Out'}</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditFood(item)}
                              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition"
                              title="Edit dish"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFood(item.id, item.name)}
                              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                              title="Delete dish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORDER MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="mt-8 space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
                    orderStatusFilter === st
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Search Order # or Customer..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                <p className="text-stone-400 text-xs sm:text-sm">No customer orders found in this category.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs hover:border-stone-300 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-150">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-stone-900">
                          #{order.orderNumber}
                        </span>
                        <span className="text-stone-400">•</span>
                        <span className="font-bold text-stone-900 text-sm">
                          {order.customerName}
                        </span>
                        <span className="text-xs text-stone-500">({order.customerPhone})</span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Placed on {new Date(order.createdAt).toLocaleString()} • {order.customerEmail}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-display font-extrabold text-base text-stone-900">
                        £{order.total.toFixed(2)}
                      </span>

                      {/* Status Dropdown Controller */}
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                          order.status === 'delivered'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : order.status === 'cancelled'
                            ? 'bg-rose-50 border-rose-300 text-rose-800'
                            : order.status === 'preparing'
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-stone-50 border-stone-300 text-stone-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready for Pickup/Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Delivery Location & Special Notes */}
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="text-stone-700">
                      <strong>Delivery to:</strong> {order.deliveryAddress}
                    </span>
                    {order.specialInstructions && (
                      <span className="text-amber-900 bg-amber-100/60 px-2.5 py-0.5 rounded-lg italic">
                        <strong>Kitchen Note:</strong> "{order.specialInstructions}"
                      </span>
                    )}
                  </div>

                  {/* Items Summary */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {order.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 flex items-center gap-1.5"
                      >
                        <span className="font-bold text-amber-700">{item.quantity}×</span>
                        <span>{item.name}</span>
                        {item.notes && <span className="text-stone-400 italic">({item.notes})</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-stone-150">
              <h3 className="font-display font-bold text-lg text-stone-900">
                Registered Patrons & Roles
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Users authenticated through Google Sign-In with profile details and RBAC security levels
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-6">User</th>
                    <th className="py-3.5 px-6">Contact & Phone</th>
                    <th className="py-3.5 px-6">Saved Address</th>
                    <th className="py-3.5 px-6">System Role</th>
                    <th className="py-3.5 px-6 text-right">Role Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        No registered users found.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/60 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {u.photoURL ? (
                              <img
                                src={u.photoURL}
                                alt={u.displayName}
                                className="w-9 h-9 rounded-xl object-cover ring-1 ring-stone-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center">
                                {u.displayName?.[0] || 'U'}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-stone-900 text-sm">{u.displayName}</p>
                              <p className="text-[11px] text-stone-400">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-stone-700">
                          {u.phone || <span className="text-stone-400 italic">None saved</span>}
                        </td>

                        <td className="py-4 px-6 text-stone-700 max-w-xs truncate">
                          {u.address || <span className="text-stone-400 italic">None saved</span>}
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                              u.role === 'admin'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {u.role === 'admin' ? 'Administrator' : 'Customer'}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={async () => {
                              const newRole = u.role === 'admin' ? 'user' : 'admin';
                              if (confirm(`Change ${u.displayName}'s role to ${newRole}?`)) {
                                await updateUserRole(u.id, u.email, newRole);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-semibold text-xs transition"
                          >
                            {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT FOOD MODAL */}
      {foodModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-stone-150 flex items-center justify-between bg-stone-50">
              <h3 className="font-display font-bold text-xl text-stone-900">
                {editingItem ? 'Edit Menu Dish' : 'Add New Gourmet Dish'}
              </h3>
              <button
                onClick={() => setFoodModalOpen(false)}
                className="w-9 h-9 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-200 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="p-6 sm:p-8 space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Dish Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Wagyu Truffle Smash Burger"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Price (£ / GBP) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="1.00"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  >
                    <option value="Burgers">Burgers</option>
                    <option value="Pizza">Pizza</option>
                    <option value="Pasta">Pasta</option>
                    <option value="Starters">Starters</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Prep Time</label>
                  <input
                    type="text"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(e.target.value)}
                    placeholder="15-20 mins"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={formCalories}
                    onChange={(e) => setFormCalories(e.target.value)}
                    placeholder="750"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detailed culinary ingredients and preparation..."
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm resize-none"
                />
              </div>

              {/* Image URL & Preset Picker */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Food Image URL <span className="text-rose-600">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-xs"
                />

                <div className="mt-3">
                  <span className="text-[11px] text-stone-500 font-semibold block mb-1.5">
                    Or select from high-resolution culinary gallery:
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {PRESET_FOOD_IMAGES.map((preset, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setFormImageUrl(preset.url)}
                        className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition relative ${
                          formImageUrl === preset.url ? 'border-amber-600 ring-2 ring-amber-500/30' : 'border-stone-200 opacity-70 hover:opacity-100'
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dietary Tags Checkboxes */}
              <div>
                <label className="font-bold text-stone-700 block mb-2">Dietary Badges</label>
                <div className="flex flex-wrap gap-2">
                  {['Vegetarian', 'Gluten-Free', 'Chef Special', 'Spicy', 'Organic'].map((tag) => {
                    const isSelected = formDietary.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => {
                          if (isSelected) {
                            setFormDietary(formDietary.filter((t) => t !== tag));
                          } else {
                            setFormDietary([...formDietary, tag]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-100 border-amber-300 text-amber-900'
                            : 'bg-stone-50 border-stone-200 text-stone-600'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={formIsAvailable}
                    onChange={(e) => setFormIsAvailable(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Mark as Available</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={formIsPopular}
                    onChange={(e) => setFormIsPopular(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Feature in Popular Section</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFoodModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingFood}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md transition disabled:opacity-50"
                >
                  {isSavingFood ? 'Saving to Firestore...' : editingItem ? 'Update Dish' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
