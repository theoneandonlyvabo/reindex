"use client";

import { useRef, useState } from "react";
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
import { useAutocomplete } from "./use-autocomplete";
import { FlashHighlight } from "@/components/editor/extensions/flash-highlight";
import { PendingSelection } from "@/components/editor/extensions/pending-selection";
import { Autocomplete } from "@/components/editor/extensions/autocomplete";
import { Pagination } from "@/components/editor/extensions/pagination";

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

  const triggerAutocomplete = useAutocomplete();

  // A ref (not just state) because onUpdate's closure is set once at editor
  // creation — reading state here would risk it being stale.
  const [autocompleteEnabled, setAutocompleteEnabledState] = useState(true);
  const autocompleteEnabledRef = useRef(true);

  const [pageCount, setPageCount] = useState(1);

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
      PendingSelection,
      Autocomplete,
      Pagination.configure({ onPageCountChange: setPageCount }),
    ],
    content: doc.content,
    onUpdate: ({ editor, transaction }) => {
      scheduleContentSave(editor.getJSON());
      if (transaction.docChanged && autocompleteEnabledRef.current) {
        triggerAutocomplete(editor);
      }
    },
  });

  function setTitle(next: string) {
    setTitleState(next);
    scheduleTitleSave(next);
  }

  function setAutocompleteEnabled(enabled: boolean) {
    autocompleteEnabledRef.current = enabled;
    setAutocompleteEnabledState(enabled);
    if (!enabled) editor?.commands.hideSuggestion();
  }

  return {
    editor,
    title,
    setTitle,
    autocompleteEnabled,
    setAutocompleteEnabled,
    pageCount,
  };
}
