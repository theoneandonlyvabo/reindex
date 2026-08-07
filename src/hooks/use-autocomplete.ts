"use client";

import { useRef } from "react";
import type { Editor } from "@tiptap/react";
import { getIdToken } from "@/lib/firebase";
import { useDebouncedCallback } from "./use-debounced-callback";

const DEBOUNCE_MS = 350;
const CONTEXT_CHARS = 2000;
const MIN_SENTENCE_WORDS = 3;

/** Word count of the sentence currently being written — text since the last "." or line break. */
function currentSentenceWordCount(context: string): number {
  const lastBreak = Math.max(context.lastIndexOf("."), context.lastIndexOf("\n"));
  const sentence = context.slice(lastBreak + 1).trim();
  return sentence ? sentence.split(/\s+/).length : 0;
}

/**
 * Returns a debounced trigger for inline ghost-text autocomplete — call it
 * from the editor's onUpdate. Owns the request lifecycle: aborts a
 * still-pending fetch when a newer one starts, and drops a response if the
 * cursor has since moved (both guard against a stale suggestion appearing
 * after the user has already typed past it).
 */
export function useAutocomplete() {
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  return useDebouncedCallback((editor: Editor) => {
    const { selection, doc } = editor.state;
    if (!selection.empty) return;

    const pos = selection.from;
    const context = doc.textBetween(Math.max(0, pos - CONTEXT_CHARS), pos, "\n");
    if (!context.trim()) return;
    // Don't interrupt short sentences with a suggestion — only once the
    // current sentence has more than MIN_SENTENCE_WORDS words.
    if (currentSentenceWordCount(context) <= MIN_SENTENCE_WORDS) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;

    void (async () => {
      try {
        const res = await fetch("/api/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getIdToken()}`,
          },
          body: JSON.stringify({ context }),
          signal: controller.signal,
        });
        if (!res.ok) return;

        const { suggestion } = (await res.json()) as { suggestion: string };
        const stillCurrent =
          requestId === requestIdRef.current && editor.state.selection.from === pos;
        if (suggestion.trim() && stillCurrent) {
          editor.commands.showSuggestion(pos, suggestion);
        }
      } catch {
        // Silent — a missing ghost suggestion isn't worth surfacing an error for.
      }
    })();
  }, DEBOUNCE_MS);
}
