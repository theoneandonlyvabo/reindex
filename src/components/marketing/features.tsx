import { Reveal } from "./reveal";
import { EditorMockup } from "./mockups/editor-mockup";
import { AgentMockup } from "./mockups/agent-mockup";
import { SelectionEditMockup } from "./mockups/selection-edit-mockup";
import { AutocompleteMockup } from "./mockups/autocomplete-mockup";

const FEATURES = [
  {
    index: "01",
    title: "A format-compliant editor",
    body: "Rich text that feels familiar to write in, with academic formatting — typography, spacing, and heading structure — set up by default instead of fought over.",
    Mockup: EditorMockup,
  },
  {
    index: "02",
    title: "An AI agent inside the sidebar",
    body: "Reads the document you have open, edits it directly through your instructions, and researches with citations grounded to real sources.",
    Mockup: AgentMockup,
  },
  {
    index: "03",
    title: "Select, instruct, done",
    body: "Highlight any passage, describe the change in plain language, and the agent rewrites exactly that range — no full-document regeneration.",
    Mockup: SelectionEditMockup,
  },
  {
    index: "04",
    title: "Inline autocomplete",
    body: "Low-latency suggestions as you type, shown as ghost text. Tab to accept, Esc to dismiss — the same rhythm as code completion.",
    Mockup: AutocompleteMockup,
  },
];

export function Features() {
  return (
    <section className="mx-auto w-full max-w-5xl border-t px-6 py-16 sm:py-24">
      <Reveal>
        <h2 className="max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
          Four features. One writing surface.
        </h2>
      </Reveal>

      <div className="mt-12 space-y-16 sm:space-y-20">
        {FEATURES.map((feature, i) => {
          const reversed = i % 2 === 1;
          return (
            <Reveal key={feature.index}>
              <div
                className={`grid items-center gap-8 border-t pt-8 sm:grid-cols-2 sm:gap-12 ${
                  reversed ? "sm:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <span className="font-mono text-sm text-muted-foreground">
                    {feature.index}
                  </span>
                  <h3 className="mt-2 text-2xl font-medium">
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-md text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
                <feature.Mockup />
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
