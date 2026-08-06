"use client";

import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Toolbar } from "./toolbar";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { Input } from "@/components/ui/input";

const AUTOSAVE_DELAY_MS = 1000;

export function DocumentEditor({ doc }: { doc: Doc<"documents"> }) {
  const updateContent = useMutation(api.documents.updateContent);
  const updateTitle = useMutation(api.documents.updateTitle);
  const [title, setTitle] = useState(doc.title);

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
        placeholder: "Mulai menulis draf skripsi Anda...",
      }),
    ],
    content: doc.content,
    onUpdate: ({ editor }) => {
      scheduleContentSave(editor.getJSON());
    },
  });

  return (
    <div className="flex h-full flex-col">
      <div className="no-print border-b px-4 py-2">
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleTitleSave(e.target.value);
          }}
          className="border-none px-0 text-lg font-medium shadow-none focus-visible:ring-0"
          placeholder="Judul draf"
        />
      </div>
      <Toolbar editor={editor} documentId={doc._id} />
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <EditorContent
          editor={editor}
          className="academic-doc mx-auto max-w-3xl"
        />
      </div>
    </div>
  );
}
