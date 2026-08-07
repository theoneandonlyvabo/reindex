import { ArrowRight, Sparkles } from "lucide-react";
import { MockupFrame } from "./mockup-frame";

export function SelectionEditMockup() {
  return (
    <MockupFrame className="p-6">
      <p className="text-sm leading-relaxed text-card-foreground">
        The results indicate that{" "}
        <span className="ai-pending-selection">
          the method basically works pretty well overall
        </span>{" "}
        across the tested conditions.
      </p>

      <div className="mt-3 flex w-56 items-center gap-1 border bg-popover p-1 shadow-md">
        <Sparkles className="ml-1 size-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-xs text-muted-foreground">
          Make this more formal...
        </span>
        <span className="flex size-6 shrink-0 items-center justify-center bg-primary text-primary-foreground">
          <ArrowRight className="size-3.5" />
        </span>
      </div>
    </MockupFrame>
  );
}
