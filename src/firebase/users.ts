import {
  collection,
  doc,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { UserProfile, UserRole } from '../types';

export function subscribeToUsers(
  onUpdate: (users: UserProfile[]) => void,
  onError?: (error: Error) => void
) {
  const usersRef = collection(db, 'users');
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const users = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      })) as UserProfile[];
      users.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(users);
    },
    (err) => {
      console.error('Error fetching users:', err);
      onError?.(err);
      handleFirestoreError(err, OperationType.GET, 'users');
    }
  );
}

export async function updateUserRole(userId: string, userEmail: string, role: UserRole): Promise<void> {
  const now = new Date().toISOString();
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role,
      updatedAt: now
    });

    const adminRef = doc(db, 'admins', userId);
    if (role === 'admin') {
      await setDoc(adminRef, {
        email: userEmail,
        createdAt: now
      });
    } else {
      await deleteDoc(adminRef).catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}
