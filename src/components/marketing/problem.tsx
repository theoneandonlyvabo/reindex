import { Reveal } from "./reveal";

const PAINS = [
  {
    index: "01",
    title: "The copy-paste loop",
    body: "You research and draft in ChatGPT or Claude, then paste it back into your manuscript by hand — and paste your manuscript back into the chat every time it needs more context. The AI never actually sees your thesis; it sees whatever fragment you remembered to give it.",
  },
  {
    index: "02",
    title: "Citations that don't exist",
    body: "Ask a general-purpose model for a source and it will often invent one — a title, authors, and a journal that sound entirely plausible and aren't real. In academic writing, that's not a minor slip. It's the kind of error a committee catches.",
  },
];

export function Problem() {
  return (
    <section className="mx-auto w-full max-w-5xl border-t px-6 py-16 sm:py-24">
      <Reveal>
        <h2 className="max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
          Two problems every AI-assisted writer runs into.
        </h2>
      </Reveal>

      <div className="mt-12 space-y-10">
        {PAINS.map((pain, i) => (
          <Reveal key={pain.index} delay={i * 0.08}>
            <div className="grid grid-cols-[3.5rem_1fr] gap-6 border-t pt-6 sm:grid-cols-[6rem_1fr]">
              <span className="font-mono text-sm text-muted-foreground">
                {pain.index}
              </span>
              <div>
                <h3 className="text-xl font-medium">{pain.title}</h3>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  {pain.body}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
