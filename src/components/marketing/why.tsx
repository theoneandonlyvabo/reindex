import { Reveal } from "./reveal";

const COMPARISONS = [
  {
    against: "Generic AI writing tools",
    body: "ChatGPT and similar tools live outside your document and don't specialize in academic rigor — they'll happily generate a citation that sounds right and isn't real. Reindex is built specifically for research writing, with citations grounded to sources you can check.",
  },
  {
    against: "Google Docs",
    body: "Familiar rich-text editing, but AI is an afterthought bolted onto the side. Reindex is AI-native from the ground up — the agent is a first-class part of the writing surface, not a plugin.",
  },
];

export function Why() {
  return (
    <section className="mx-auto w-full max-w-5xl border-t px-6 py-16 sm:py-24">
      <Reveal>
        <h2 className="max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
          Why not just use what you already have?
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-px overflow-hidden border sm:grid-cols-2">
        {COMPARISONS.map((c, i) => (
          <Reveal key={c.against} delay={i * 0.08}>
            <div className="h-full bg-card p-6 sm:p-8">
              <p className="text-sm text-muted-foreground">Not another</p>
              <h3 className="mt-1 text-xl font-medium">{c.against}</h3>
              <p className="mt-3 text-muted-foreground">{c.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
