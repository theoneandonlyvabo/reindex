"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

/**
 * Bridges Firebase auth state into the shape ConvexProviderWithAuth expects.
 * `fetchAccessToken` must stay referentially stable across renders and honor
 * `forceRefreshToken`, otherwise Convex re-authenticates in a loop.
 */
export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });
  }, []);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      const current = firebaseAuth.currentUser;
      if (!current) return null;
      return await current.getIdToken(forceRefreshToken);
    },
    [],
  );

  return {
    isLoading,
    isAuthenticated: user !== null,
    fetchAccessToken,
  };
}
