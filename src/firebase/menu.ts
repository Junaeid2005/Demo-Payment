import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { MenuItem, CategoryInfo } from '../types';

export const INITIAL_CATEGORIES: CategoryInfo[] = [
  { id: 'all', name: 'All Dishes', slug: 'all', description: 'Explore our full culinary collection', displayOrder: 0 },
  { id: 'burgers', name: 'Burgers', slug: 'burgers', description: 'Artisan handcrafted gourmet burgers', displayOrder: 1 },
  { id: 'pizza', name: 'Pizza', slug: 'pizza', description: 'Wood-fired sourdough Neapolitan style pizzas', displayOrder: 2 },
  { id: 'pasta', name: 'Pasta', slug: 'pasta', description: 'Fresh handmade Italian pastas & slow-cooked sauces', displayOrder: 3 },
  { id: 'starters', name: 'Starters', slug: 'starters', description: 'Delectable appetizers to awaken the palate', displayOrder: 4 },
  { id: 'drinks', name: 'Drinks', slug: 'drinks', description: 'Craft botanical mocktails & signature beverages', displayOrder: 5 },
  { id: 'desserts', name: 'Desserts', slug: 'desserts', description: 'Decadent artisanal sweets & Italian delicacies', displayOrder: 6 },
];

export const ONE_POUND_ITEM: Omit<MenuItem, 'id'> = {
  name: 'Artisan Warm Garlic Herb Baguette',
  description: 'Freshly baked French artisanal sourdough baguette slice brushed with whipped roasted garlic herb butter, fresh parsley, and Maldon sea salt flakes.',
  price: 1.00,
  category: 'Starters',
  imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80',
  isAvailable: true,
  isPopular: true,
  dietary: ['Vegetarian', 'Chef Special', '£1 Deal'],
  prepTime: '5 mins',
  calories: 190,
};

export const INITIAL_MENU_ITEMS: Omit<MenuItem, 'id'>[] = [
  ONE_POUND_ITEM,
  {
    name: 'Wagyu Truffle Smash Burger',
    description: 'Double Wagyu beef smash patties, black truffle aioli, aged Gruyère cheese, caramelized shallots, and crisp wild baby arugula on a toasted brioche bun.',
    price: 18.50,
    category: 'Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: true,
    dietary: ['Chef Special'],
    prepTime: '15-20 mins',
    calories: 780,
  },
  {
    name: 'Smoked Hickory Bacon Burger',
    description: 'Prime Angus beef patty, thick applewood smoked bacon, sharp Vermont cheddar, pickled jalapeños, and house-made bourbon BBQ glaze.',
    price: 16.00,
    category: 'Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: false,
    dietary: [],
    prepTime: '15 mins',
    calories: 820,
  },
  {
    name: 'Portobello & Seared Halloumi Burger',
    description: 'Balsamic-marinated grilled Portobello cap, seared Cyprus halloumi, roasted red pepper pesto, and tender spinach in an artisan seeded bun.',
    price: 15.50,
    category: 'Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: false,
    dietary: ['Vegetarian'],
    prepTime: '12-15 mins',
    calories: 590,
  },
  {
    name: 'Margherita di Bufala D.O.P.',
    description: 'San Marzano tomato coulis, fresh mozzarella di bufala campana, torn sweet basil leaves, and cold-pressed extra virgin olive oil on 48h sourdough crust.',
    price: 17.00,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: true,
    dietary: ['Vegetarian'],
    prepTime: '12-16 mins',
    calories: 680,
  },
  {
    name: 'Tartufo & Wild Forest Mushroom Pizza',
    description: 'White truffle cream base, sautéed porcini and chanterelle mushrooms, creamy fior di latte, fresh thyme, and aged pecorino romano shavings.',
    price: 21.50,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: true,
    dietary: ['Vegetarian', 'Chef Special'],
    prepTime: '15-18 mins',
    calories: 740,
  },
  {
    name: 'Prosciutto di Parma & Fig Pizza',
    description: 'Crisp sourdough crust, 24-month cured Prosciutto di Parma, caramelized black mission figs, gorgonzola dolce, hot honey drizzle, and fresh rocket.',
    price: 22.00,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: false,
    dietary: ['Chef Special'],
    prepTime: '15-20 mins',
    calories: 790,
  },
  {
    name: 'Handcrafted Truffle Tagliolini',
    description: 'Fresh artisanal egg ribbon pasta tossed in Normandy butter emulsion, black summer truffle carpaccio, and 24-month aged Parmigiano-Reggiano.',
    price: 23.00,
    category: 'Pasta',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: true,
    dietary: ['Vegetarian', 'Chef Special'],
    prepTime: '14-18 mins',
    calories: 620,
  },
  {
    name: 'Braised Beef Short Rib Pappardelle',
    description: 'Silk pappardelle ribbons slow-braised for 12 hours with Chianti Classico wine, rosemary, mirepoix, and topped with shaved aged pecorino.',
    price: 24.50,
    category: 'Pasta',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281e04?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: true,
    dietary: [],
    prepTime: '18-22 mins',
    calories: 840,
  },
  {
    name: 'Artisanal Burrata Caprese',
    description: 'Creamy Pugliese burrata cheese, organic heirloom vine tomatoes, Genovese basil pearls, cold-pressed olive oil, and aged balsamic glaze.',
    price: 15.50,
    category: 'Starters',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: false,
    dietary: ['Vegetarian', 'Gluten-Free'],
    prepTime: '10 mins',
    calories: 450,
  },
  {
    name: 'Crispy Calamari Fritti',
    description: 'Tender Monterey Bay calamari flash-fried to golden perfection, dusted with smoked paprika and sea salt, served with lemon-garlic aioli and marinara.',
    price: 14.00,
    category: 'Starters',
    imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: false,
    dietary: ['Chef Special'],
    prepTime: '12 mins',
    calories: 510,
  },
  {
    name: 'Hibiscus Blood Orange Botanical Spritz',
    description: 'Steeped Egyptian hibiscus flowers, freshly squeezed Sicilian blood orange, artisanal tonic, fresh mint leaves, and edible flowers.',
    price: 8.50,
    category: 'Drinks',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: true,
    dietary: ['Vegetarian', 'Gluten-Free'],
    prepTime: '5 mins',
    calories: 110,
  },
  {
    name: 'Smoked Rosemary Old Fashioned Mocktail',
    description: 'Kentucky barrel-aged botanicals, spiced Demerara reduction, aromatic gentian bitters, charred rosemary smoke, and expressed Seville orange.',
    price: 9.50,
    category: 'Drinks',
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: false,
    dietary: ['Vegetarian', 'Gluten-Free'],
    prepTime: '5 mins',
    calories: 95,
  },
  {
    name: 'Tiramisù al Mascarpone Tradizionale',
    description: 'Savoiardi ladyfingers lightly steeped in rich espresso and hazelnut, layered with cloud-like mascarpone cream and dusted with 100% Valrhona dark cocoa.',
    price: 11.00,
    category: 'Desserts',
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: true,
    dietary: ['Vegetarian'],
    prepTime: '5 mins',
    calories: 420,
  },
  {
    name: 'Molten Belgian Dark Chocolate Fondant',
    description: 'Warm 70% Callebaut dark chocolate cake with a molten center of salted caramel, accompanied by a scoop of Madagascar vanilla bean gelato.',
    price: 12.50,
    category: 'Desserts',
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: true,
    dietary: ['Vegetarian'],
    prepTime: '8 mins',
    calories: 560,
  },
  {
    name: 'Artisan Warm Garlic Herb Baguette',
    description: 'Freshly baked French artisanal sourdough baguette slice brushed with whipped roasted garlic herb butter, fresh parsley, and Maldon sea salt flakes.',
    price: 1.00,
    category: 'Starters',
    imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: true,
    dietary: ['Vegetarian', 'Chef Special'],
    prepTime: '5 mins',
    calories: 190,
  }
];

export function subscribeToMenuItems(onUpdate: (items: MenuItem[]) => void, onError?: (error: Error) => void) {
  const q = collection(db, 'menuItems');
  return onSnapshot(
    q,
    (snapshot) => {
      const items: MenuItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as MenuItem[];
      onUpdate(items);
    },
    (err) => {
      console.error('Menu items snapshot error:', err);
      onError?.(err);
      handleFirestoreError(err, OperationType.GET, 'menuItems');
    }
  );
}

export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const snap = await getDocs(collection(db, 'menuItems'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MenuItem[];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'menuItems');
  }
}

export async function addMenuItem(item: Omit<MenuItem, 'id'>): Promise<string> {
  const now = new Date().toISOString();
  try {
    const docRef = await addDoc(collection(db, 'menuItems'), {
      ...item,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'menuItems');
  }
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
  try {
    const ref = doc(db, 'menuItems', id);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `menuItems/${id}`);
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'menuItems', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `menuItems/${id}`);
  }
}

export async function toggleMenuItemAvailability(id: string, currentStatus: boolean): Promise<void> {
  await updateMenuItem(id, { isAvailable: !currentStatus });
}

export async function seedInitialMenuIfEmpty(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, 'menuItems'));
    if (snap.empty) {
      console.log('Seeding initial gourmet restaurant menu items...');
      const now = new Date().toISOString();
      for (const item of INITIAL_MENU_ITEMS) {
        await addDoc(collection(db, 'menuItems'), {
          ...item,
          createdAt: now,
          updatedAt: now,
        });
      }
      return true;
    } else {
      // Check if the £1.00 item is missing from Firestore
      const hasOnePoundItem = snap.docs.some((doc) => {
        const d = doc.data();
        return d.price === 1.00 || d.name?.includes('Garlic Herb Baguette');
      });
      if (!hasOnePoundItem) {
        console.log('Adding £1.00 Artisan Warm Garlic Herb Baguette to Firestore...');
        const onePoundItem = INITIAL_MENU_ITEMS.find((i) => i.price === 1.00);
        if (onePoundItem) {
          const now = new Date().toISOString();
          await addDoc(collection(db, 'menuItems'), {
            ...onePoundItem,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }
    return false;
  } catch (error) {
    console.warn('Initial seeding could not be completed automatically (requires admin):', error);
    return false;
  }
}

