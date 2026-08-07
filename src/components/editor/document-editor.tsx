"use client";

import { EditorContent, type Editor } from "@tiptap/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Toolbar } from "./toolbar";
import { Input } from "@/components/ui/input";

export function DocumentEditor({
  editor,
  title,
  onTitleChange,
  documentId,
}: {
  editor: Editor | null;
  title: string;
  onTitleChange: (next: string) => void;
  documentId: Id<"documents">;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="no-print border-b px-4 py-2">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-fit min-w-48 border border-transparent px-2 text-2xl font-medium shadow-none hover:border-input focus-visible:border-input focus-visible:ring-0"
          placeholder="Judul draf"
        />
      </div>
      <Toolbar editor={editor} documentId={documentId} />
      <div className="doc-canvas min-h-0 flex-1 overflow-auto bg-muted px-6 py-8">
        <EditorContent
          editor={editor}
          className="academic-doc doc-paper mx-auto"
        />
      </div>
    </div>
  );
}
