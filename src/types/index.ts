export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  address?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type FoodCategory = 'Burgers' | 'Pizza' | 'Pasta' | 'Starters' | 'Drinks' | 'Desserts';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: FoodCategory | string;
  imageUrl: string;
  isAvailable: boolean;
  isPopular?: boolean;
  dietary?: string[]; // e.g. ['Vegetarian', 'Gluten-Free', 'Spicy', 'Chef Special']
  prepTime?: string; // e.g. '15-20 mins'
  calories?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  specialInstructions?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: 'stripe' | 'cash';
  paymentStatus?: 'paid' | 'pending';
  paymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInfo {
  id: string;
  name: FoodCategory | string;
  slug: string;
  description: string;
  icon?: string;
  displayOrder: number;
}
