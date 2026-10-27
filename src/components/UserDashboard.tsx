import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  RotateCcw,
  LogOut,
  AlertCircle,
  ChefHat,
  Truck,
  CheckCheck,
  XCircle,
  Receipt,
  Save,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { subscribeToUserOrders, updateOrderStatus } from '../firebase/orders';
import { updateUserProfile } from '../firebase/auth';
import { Order, OrderStatus } from '../types';

interface UserDashboardProps {
  onBackToMenu: () => void;
}

const STATUS_STEPS: { key: OrderStatus; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'pending', label: 'Received', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'preparing', label: 'In Kitchen', icon: ChefHat },
  { key: 'ready', label: 'Ready for Dispatch', icon: Package },
  { key: 'delivered', label: 'Delivered', icon: Truck },
];

export const UserDashboard: React.FC<UserDashboardProps> = ({ onBackToMenu }) => {
  const { user, profile, logout, refreshProfile } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) {
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);
    const unsubscribe = subscribeToUserOrders(
      user.uid,
      (fetchedOrders) => {
        setOrders(fetchedOrders);
        setLoadingOrders(false);
      },
      (err) => {
        setOrderError('Could not load order history. Please try refreshing.');
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSuccessMsg(null);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      await refreshProfile();
      setSavingProfile(false);
      setIsEditingProfile(false);
      setProfileSuccessMsg('Your profile was updated successfully.');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err) {
      setSavingProfile(false);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to cancel this pending order?')) {
      try {
        await updateOrderStatus(orderId, 'cancelled');
      } catch (e) {
        alert('Could not cancel order.');
      }
    }
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addToCart(
        {
          id: item.menuItemId,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          category: 'Reorder',
          description: '',
          isAvailable: true,
        },
        item.quantity,
        item.notes
      );
    });
    setIsCartOpen(true);
  };

  const getStepProgressIndex = (status: OrderStatus) => {
    if (status === 'cancelled') return -1;
    const idx = STATUS_STEPS.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-stone-900 font-display">Authentication Required</h2>
        <p className="text-stone-600 mt-2 text-sm">Please sign in with your Google account to view your user dashboard and orders.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Title & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-stone-200 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
            Customer Dashboard
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-stone-900 mt-2">
            Welcome, {profile?.displayName || user.displayName || 'Gourmet Guest'}
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Manage your personal dining details, track active orders, and view past receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMenu}
            className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
          >
            Order More Dishes
          </button>
          <button
            onClick={logout}
            className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-600 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: User Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm relative">
            <div className="flex items-center gap-4 pb-6 border-b border-stone-150">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-500/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white font-display text-2xl font-bold flex items-center justify-center shadow-md">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-display font-bold text-lg text-stone-900 truncate">
                  {profile?.displayName || user.displayName}
                </h3>
                <p className="text-xs text-stone-500 truncate">{user.email}</p>
                <span className="inline-block mt-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  {profile?.role === 'admin' ? 'Administrator' : 'Verified Patron'}
                </span>
              </div>
            </div>

            {profileSuccessMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {!isEditingProfile ? (
              <div className="mt-6 space-y-4 text-xs">
                <div>
                  <span className="text-stone-400 font-medium block">Phone Contact</span>
                  <span className="text-stone-900 font-semibold text-sm flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    {profile?.phone || 'Not added yet'}
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 font-medium block">Preferred Delivery Address</span>
                  <span className="text-stone-900 font-medium text-xs sm:text-sm flex items-start gap-1.5 mt-0.5 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    {profile?.address || 'Not added yet (will be saved on checkout)'}
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 font-medium block">Account Created</span>
                  <span className="text-stone-600 font-medium block mt-0.5">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Active'}
                  </span>
                </div>

                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full mt-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-800 font-semibold text-xs transition cursor-pointer"
                >
                  Edit Information
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="mt-6 space-y-3.5 text-xs">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Delivery Address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address, Apartment, City, Zip"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 resize-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                  >
                    {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-3 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Help Card */}
          <div className="bg-stone-900 text-stone-200 rounded-3xl p-6 shadow-sm border border-stone-800">
            <h4 className="font-display font-bold text-base text-stone-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Direct Kitchen Line
            </h4>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Have a special allergen concern or need to modify an order in progress? Reach out to our chef desk at <strong className="text-stone-200">(415) 890-4820</strong>.
            </p>
          </div>
        </div>

        {/* Right Column: Order History & Real-Time Tracking */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between pb-6 border-b border-stone-150">
              <div>
                <h3 className="font-display font-bold text-xl text-stone-900">
                  Your Order History
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Synchronized in real-time with our restaurant kitchen system
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-stone-100 rounded-full text-stone-700">
                {orders.length} Total {orders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>

            {loadingOrders ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
                <p className="text-xs text-stone-500 font-medium">Loading your orders from Firestore...</p>
              </div>
            ) : orderError ? (
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center my-6">
                {orderError}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-8 h-8" />
                </div>
                <h4 className="font-display font-bold text-lg text-stone-800">No orders placed yet</h4>
                <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                  When you order your favorite dishes, their preparation and delivery status will appear right here in real time.
                </p>
                <button
                  onClick={onBackToMenu}
                  className="mt-5 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition"
                >
                  Order Handcrafted Delicacies
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-150 mt-4 space-y-6">
                {orders.map((order) => {
                  const currentStepIdx = getStepProgressIndex(order.status);
                  const isCancelled = order.status === 'cancelled';

                  return (
                    <div key={order.id} className="pt-6 first:pt-2 space-y-5">
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-stone-900">
                              #{order.orderNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                order.status === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.status === 'cancelled'
                                  ? 'bg-rose-100 text-rose-800'
                                  : order.status === 'preparing'
                                  ? 'bg-amber-100 text-amber-900 animate-pulse'
                                  : 'bg-stone-200 text-stone-800'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 mt-1 block">
                            Ordered on {new Date(order.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-base font-extrabold font-display text-stone-900">
                            ${order.total.toFixed(2)}
                          </span>

                          <button
                            onClick={() => handleReorder(order)}
                            className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-white text-stone-700 text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                            title="Add items to cart"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                            <span>Re-order</span>
                          </button>

                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Live Status Progress Stepper */}
                      {!isCancelled ? (
                        <div className="px-2 py-3 bg-white rounded-2xl border border-stone-150">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-3 px-2">
                            Live Kitchen & Delivery Tracking
                          </p>
                          <div className="grid grid-cols-5 gap-1 relative">
                            {STATUS_STEPS.map((step, idx) => {
                              const StepIcon = step.icon;
                              const isCompleted = idx <= currentStepIdx;
                              const isCurrent = idx === currentStepIdx;

                              return (
                                <div key={step.key} className="flex flex-col items-center text-center">
                                  <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                      isCurrent
                                        ? 'bg-amber-600 text-white ring-4 ring-amber-100 scale-110 shadow-sm'
                                        : isCompleted
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-stone-100 text-stone-400'
                                    }`}
                                  >
                                    <StepIcon className="w-4 h-4" />
                                  </div>
                                  <span
                                    className={`text-[10px] mt-1.5 font-medium leading-tight ${
                                      isCurrent
                                        ? 'text-amber-800 font-bold'
                                        : isCompleted
                                        ? 'text-stone-800 font-semibold'
                                        : 'text-stone-400'
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>This order was cancelled. No charges were captured.</span>
                        </div>
                      )}

                      {/* Order Items Breakdown */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                          Ordered Items
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 border border-stone-150"
                            >
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-11 h-11 rounded-lg object-cover bg-stone-200 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-stone-900 truncate">
                                  {item.name}
                                </p>
                                <p className="text-[11px] text-stone-500">
                                  {item.quantity} × ${item.price.toFixed(2)}
                                </p>
                                {item.notes && (
                                  <p className="text-[10px] text-amber-700 italic truncate">
                                    "{item.notes}"
                                  </p>
                                )}
                              </div>
                              <span className="text-xs font-bold text-stone-900">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Details Footer */}
                      <div className="text-xs text-stone-500 bg-stone-50/60 p-3 rounded-xl border border-stone-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">
                            Delivered to: <strong className="text-stone-700">{order.deliveryAddress}</strong>
                          </span>
                        </div>
                        {order.specialInstructions && (
                          <span className="text-[11px] italic text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                            Notes: "{order.specialInstructions}"
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
