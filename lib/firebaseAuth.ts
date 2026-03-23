import type { Auth } from 'firebase/auth';
import { getFirebaseApp } from './firebaseApp';

let auth: Auth | null = null;

/**
 * Get the Firebase Auth instance, initializing if needed.
 * Lazy-loaded to prevent SSR window errors.
 */
export async function getFirebaseAuth(): Promise<Auth> {
  if (!auth) {
    const app = await getFirebaseApp();
    const { getAuth } = await import('firebase/auth');
    auth = getAuth(app);
  }
  return auth;
}

/**
 * Detect iOS devices where popup auth is blocked.
 * Used by useAuth to choose signInWithRedirect over signInWithPopup.
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
