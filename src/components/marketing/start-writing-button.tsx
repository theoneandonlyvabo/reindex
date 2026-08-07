"use client";

import Link from "next/link";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StartWritingButton({ className }: { className?: string }) {
  const { isAuthenticated } = useConvexAuth();
  const href = isAuthenticated ? "/dashboard" : "/sign-in";
  const label = isAuthenticated ? "Start using Reindex AI" : "Start writing";

  return (
    <Button asChild className={cn(className)}>
      <Link href={href}>{label}</Link>
    </Button>
  );
}
