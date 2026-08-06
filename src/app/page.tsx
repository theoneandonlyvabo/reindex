import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Reindex AI</h1>
        <p className="max-w-md text-muted-foreground">
          Editor dokumen berbasis AI untuk skripsi, tesis, dan paper — dengan
          sitasi yang bisa diverifikasi ke sumber asli.
        </p>
      </div>
      <Button asChild>
        <Link href="/sign-in">Mulai menulis</Link>
      </Button>
    </div>
  );
}
