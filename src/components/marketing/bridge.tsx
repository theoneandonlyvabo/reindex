import { FileText, ShieldCheck } from "lucide-react";
import { Reveal } from "./reveal";

export function Bridge() {
  return (
    <section className="mx-auto w-full max-w-5xl border-t px-6 py-16 sm:py-24">
      <div className="grid gap-10 sm:grid-cols-2 sm:gap-16">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Reindex closes both gaps at once.
          </h2>
          <p className="mt-4 text-muted-foreground">
            The agent sits in a sidebar next to the page you&apos;re writing
            — not in a separate tab. It reads the document that&apos;s open,
            edits it directly on your instruction, and researches with
            citations grounded to real, checkable sources instead of
            generating plausible-sounding ones.
          </p>
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={0.08}>
            <div className="flex gap-4 border-t pt-5">
              <FileText className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-medium">Scoped to your document</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  The agent&apos;s context is exactly what&apos;s open in the
                  editor — no re-explaining, no re-pasting.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="flex gap-4 border-t pt-5">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-medium">Citations you can verify</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Research is grounded to real sources, with links back to
                  where each claim came from.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
