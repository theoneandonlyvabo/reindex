import { Search, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { MockupFrame } from "./mockup-frame";

export function AgentMockup() {
  return (
    <MockupFrame className="space-y-3 p-4">
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-muted px-3 py-1.5 text-sm">
          Find a source for the claim I just wrote about citation fabrication
          in LLMs.
        </div>
      </div>

      <div className="flex items-start gap-2">
        <Logo size={16} alt="" className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground">
            <Search className="size-3.5 shrink-0" />
            Researched the web · 3 sources
          </div>
          <p className="text-sm">
            Here&apos;s a verifiable source, cited inline —
          </p>
          <div className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 shrink-0" />
            Inserted citation
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}
