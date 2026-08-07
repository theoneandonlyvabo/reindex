import { Reveal } from "./reveal";
import { StartWritingButton } from "./start-writing-button";

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <Reveal>
        <p className="mb-4 text-sm text-muted-foreground">
          For theses, dissertations, and papers
        </p>
      </Reveal>
      <Reveal delay={0.08}>
        <h1 className="max-w-3xl text-5xl leading-[1.05] font-semibold tracking-tight sm:text-7xl">
          Write Faster With AI That Understands Your Academic Writing.
        </h1>
      </Reveal>
      <Reveal delay={0.16}>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Reindex AI is a document editor built for academic writing — with
          an agent that reads what you&apos;re actually working on, and
          citations you can verify back to the source.
        </p>
      </Reveal>
      <Reveal delay={0.24}>
        <div className="mt-8">
          <StartWritingButton className="h-11 px-6 text-base" />
        </div>
      </Reveal>
    </section>
  );
}
