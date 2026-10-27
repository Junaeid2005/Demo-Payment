import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { Order, OrderStatus, OrderItem } from '../types';

export function generateOrderNumber(): string {
  const letters = 'SAV';
  const randNum = Math.floor(100000 + Math.random() * 900000);
  return `${letters}-${randNum}`;
}

export interface CreateOrderParams {
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
}

export async function createOrder(params: CreateOrderParams): Promise<Order> {
  const now = new Date().toISOString();
  const orderNumber = generateOrderNumber();

  const newOrderData: Omit<Order, 'id'> = {
    orderNumber,
    userId: params.userId,
    customerName: params.customerName.trim(),
    customerEmail: params.customerEmail.trim(),
    customerPhone: params.customerPhone.trim(),
    deliveryAddress: params.deliveryAddress.trim(),
    specialInstructions: params.specialInstructions?.trim() || '',
    items: params.items,
    subtotal: Number(params.subtotal.toFixed(2)),
    deliveryFee: Number(params.deliveryFee.toFixed(2)),
    tax: Number(params.tax.toFixed(2)),
    total: Number(params.total.toFixed(2)),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, 'orders'), newOrderData);
    return {
      id: docRef.id,
      ...newOrderData
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'orders');
  }
}

export function subscribeToUserOrders(
  userId: string,
  onUpdate: (orders: Order[]) => void,
  onError?: (error: Error) => void
) {
  // To avoid requiring a composite index right away, query by userId and sort in memory if needed
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      })) as Order[];
      // Sort newest first
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(orders);
    },
    (err) => {
      console.error('Error fetching user orders:', err);
      onError?.(err);
      handleFirestoreError(err, OperationType.GET, 'orders');
    }
  );
}

export function subscribeToAllOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (error: Error) => void
) {
  const q = collection(db, 'orders');
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      })) as Order[];
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(orders);
    },
    (err) => {
      console.error('Error fetching all orders:', err);
      onError?.(err);
      handleFirestoreError(err, OperationType.GET, 'orders');
    }
  );
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Order;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `orders/${orderId}`);
  }
}
