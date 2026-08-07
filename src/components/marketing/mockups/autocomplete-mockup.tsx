import { MockupFrame } from "./mockup-frame";

export function AutocompleteMockup() {
  return (
    <MockupFrame className="p-6">
      <p className="text-sm leading-relaxed text-card-foreground">
        These findings suggest that the proposed approach{" "}
        <span className="ai-ghost-text">
          outperforms the baseline across all evaluated metrics.
        </span>
      </p>
      <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <kbd className="border bg-muted px-1.5 py-0.5 font-mono text-[0.65rem]">
          Tab
        </kbd>
        to accept
        <kbd className="ml-2 border bg-muted px-1.5 py-0.5 font-mono text-[0.65rem]">
          Esc
        </kbd>
        to dismiss
      </div>
    </MockupFrame>
  );
}
