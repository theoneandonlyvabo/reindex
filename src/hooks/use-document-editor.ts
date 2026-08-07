"use client";

import { useState } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useDebouncedCallback } from "./use-debounced-callback";
import { FlashHighlight } from "@/components/editor/extensions/flash-highlight";

const AUTOSAVE_DELAY_MS = 1000;

/**
 * Owns the TipTap instance + autosave for one document. Lives at the page
 * level (not inside the editor's own presentational component) so the AI
 * sidebar, selected-text edit, and autocomplete can all share the same
 * `editor` object rather than each wiring up their own.
 */
export function useDocumentEditor(doc: Doc<"documents">) {
  const updateContent = useMutation(api.documents.updateContent);
  const updateTitle = useMutation(api.documents.updateTitle);
  const [title, setTitleState] = useState(doc.title);

  const scheduleContentSave = useDebouncedCallback((content: unknown) => {
    void updateContent({ documentId: doc._id, content });
  }, AUTOSAVE_DELAY_MS);

  const scheduleTitleSave = useDebouncedCallback((next: string) => {
    void updateTitle({ documentId: doc._id, title: next });
  }, AUTOSAVE_DELAY_MS);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({
        placeholder: "Start writing your thesis draft...",
      }),
      FlashHighlight,
    ],
    content: doc.content,
    onUpdate: ({ editor }) => {
      scheduleContentSave(editor.getJSON());
    },
  });

  function setTitle(next: string) {
    setTitleState(next);
    scheduleTitleSave(next);
  }

  return { editor, title, setTitle };
}
