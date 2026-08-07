import { initializeApp, getApps, getApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  inMemoryPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// Explicit persistence fallback chain: IndexedDB can throw ("Database is
// closing/hidden") on tab-visibility races or during dev Fast Refresh.
// initializeAuth automatically falls back to the next entry instead of
// throwing. try/catch guards Fast Refresh re-evaluating this module against
// "Auth already initialized".
export const firebaseAuth = (() => {
  try {
    return initializeAuth(firebaseApp, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        inMemoryPersistence,
      ],
    });
  } catch {
    return getAuth(firebaseApp);
  }
})();

/** Fresh ID token for the current user, for authenticating Next.js AI routes. */
export async function getIdToken(): Promise<string> {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Not signed in");
  return await user.getIdToken();
}
