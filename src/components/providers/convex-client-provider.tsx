"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { AuthBootstrap } from "./auth-bootstrap";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useFirebaseAuth}>
      <AuthBootstrap />
      {children}
    </ConvexProviderWithAuth>
  );
}
