"use client";

import { useState } from "react";
import { BubbleMenu, type Editor } from "@tiptap/react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { getIdToken } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Floating instruction toolbar shown on a non-empty text selection. Its own
 * non-streaming rewrite call — no tool-calling machinery, since it only ever
 * does one thing (replace the selected range). Applied as a single
 * insertContentAt transaction over the range captured at submit time, so it
 * stays undoable with one Ctrl+Z even if the user re-selects while pending.
 *
 * The selected range is also pinned via the `pendingSelection` decoration
 * (not just left as the native browser selection) because focusing the
 * instruction input below blurs the editor, and browsers dim/drop the
 * visible text selection on blur — the decoration keeps it visible
 * regardless of where focus is, through the whole request.
 */
export function SelectionToolbar({ editor }: { editor: Editor | null }) {
  const [instruction, setInstruction] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editor) return null;

  function handleFocus() {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    editor.commands.setPendingSelection(from, to);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    const text = instruction.trim();
    if (!text || pending) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText) return;

    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getIdToken()}`,
        },
        body: JSON.stringify({ selectedText, instruction: text }),
      });

      if (!res.ok) {
        setError((await res.text()) || "Something went wrong. Please try again.");
        return;
      }

      const { text: replacement } = (await res.json()) as { text: string };
      editor.chain().focus().insertContentAt({ from, to }, replacement).run();
      setInstruction("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      editor.commands.clearPendingSelection();
      setPending(false);
    }
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: "bottom" }}
      shouldShow={({ state }) => !state.selection.empty}
    >
      <div className="w-64 space-y-1">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-1 rounded-md border bg-popover p-1 shadow-md"
        >
          <Sparkles className="ml-1 size-3.5 shrink-0 text-muted-foreground" />
          <Input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onFocus={handleFocus}
            placeholder="Make this more formal..."
            disabled={pending}
            autoFocus
            className="h-7 border-none px-1 shadow-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={!instruction.trim() || pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
          </Button>
        </form>
        {error ? (
          <p className="rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </BubbleMenu>
  );
}
