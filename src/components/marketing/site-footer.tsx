import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Logo size={20} className="size-5" />
          <span className="text-sm font-medium">Reindex AI</span>
        </div>
        <p className="text-sm text-muted-foreground">
          An AI editor for theses, dissertations, and papers — with
          verifiable citations.
        </p>
        <p className="text-xs text-muted-foreground">
          By Airel Adrivano, Gathfaan Agra Pratama, and Aryandana Pascua
          Patiung — team 2030 SUKSES!
        </p>
      </div>
    </footer>
  );
}
