import Link from "next/link";
import { Logo } from "@/components/logo";
import { StartWritingButton } from "./start-writing-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b bg-background/80 px-6 py-3 backdrop-blur">
      <Link href="/" className="flex items-center gap-2">
        <Logo size={24} className="size-6" priority />
        <span className="font-medium">Reindex AI</span>
      </Link>
      <StartWritingButton />
    </header>
  );
}
