import { Reveal } from "./reveal";
import { StartWritingButton } from "./start-writing-button";

export function Cta() {
  return (
    <section className="mx-auto w-full max-w-5xl border-t px-6 py-16 sm:py-24">
      <Reveal>
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
            Start your next draft with citations you can trust.
          </h2>
          <StartWritingButton className="h-11 shrink-0 px-6 text-base" />
        </div>
      </Reveal>
    </section>
  );
}
