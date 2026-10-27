import { signInWithPopup, signOut as fbSignOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { UserProfile, UserRole } from '../types';

export const BOOTSTRAP_ADMIN_EMAIL = 'junaeidshohan@gmail.com';

export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
}

export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

  try {
    const snapshot = await getDoc(userRef);
    const isBootstrappedAdmin = user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

    if (!snapshot.exists()) {
      const initialRole: UserRole = isBootstrappedAdmin ? 'admin' : 'user';
      const newProfile: UserProfile = {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Guest Gourmet',
        photoURL: user.photoURL || '',
        phone: user.phoneNumber || '',
        address: '',
        role: initialRole,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(userRef, newProfile);

      // If bootstrapped admin, also create admins entry for strict security rule checks
      if (isBootstrappedAdmin) {
        try {
          await setDoc(doc(db, 'admins', user.uid), {
            email: user.email,
            createdAt: now,
          });
        } catch (e) {
          console.warn('Could not write admin entry:', e);
        }
      }

      return newProfile;
    } else {
      const existing = snapshot.data() as UserProfile;
      // If user is bootstrapped admin but stored as user, elevate
      if (isBootstrappedAdmin && existing.role !== 'admin') {
        await updateDoc(userRef, {
          role: 'admin',
          updatedAt: now,
        });
        existing.role = 'admin';
        try {
          await setDoc(doc(db, 'admins', user.uid), {
            email: user.email,
            createdAt: now,
          });
        } catch (e) {
          console.warn('Could not write admin entry:', e);
        }
      }
      return existing;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'phone' | 'address'>>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.email) return false;
  if (user.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) return true;

  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    if (adminSnap.exists()) return true;

    const userSnap = await getDoc(doc(db, 'users', user.uid));
    if (userSnap.exists()) {
      const data = userSnap.data() as UserProfile;
      return data.role === 'admin';
    }
    return false;
  } catch {
    return false;
  }
}
