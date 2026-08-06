"use client";

import { useEffect } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

/**
 * Upserts the `users` row right after Firebase sign-in, so every later
 * Convex call can resolve `ctx.auth.getUserIdentity()` to an owner.
 */
export function AuthBootstrap() {
  const { isAuthenticated } = useConvexAuth();
  const ensureUser = useMutation(api.users.ensureUser);

  useEffect(() => {
    if (isAuthenticated) {
      void ensureUser({});
    }
  }, [isAuthenticated, ensureUser]);

  return null;
}
