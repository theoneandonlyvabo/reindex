import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  size = 24,
  alt = "Reindex AI",
  className,
  priority,
}: {
  size?: number;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/reindex-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      unoptimized
      priority={priority}
    />
  );
}
