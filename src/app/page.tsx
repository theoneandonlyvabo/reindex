import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 text-center">
      <Image
        src="/reindex-logo.png"
        alt="Reindex AI"
        width={64}
        height={64}
        className="size-16"
        unoptimized
        priority
      />
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Reindex AI</h1>
        <p className="max-w-md text-muted-foreground">
          AI-powered document editor for theses, dissertations, and papers —
          with citations you can verify back to the source.
        </p>
      </div>
      <Button asChild>
        <Link href="/sign-in">Start writing</Link>
      </Button>
    </div>
  );
}
