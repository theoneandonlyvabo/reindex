"use client";

import Image from "next/image";
import Link from "next/link";
import { EditorContent, type Editor } from "@tiptap/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Toolbar } from "./toolbar";
import { SelectionToolbar } from "./selection-toolbar";
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
      <div className="no-print flex items-center gap-2 border-b px-4 py-2">
        <Link href="/" className="shrink-0" aria-label="Back to home">
          <Image
            src="/reindex-logo.png"
            alt=""
            width={24}
            height={24}
            className="size-6"
            unoptimized
          />
        </Link>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="min-w-48 max-w-full border border-transparent px-2 text-2xl font-medium shadow-none [field-sizing:content] hover:border-input focus-visible:border-input focus-visible:ring-0"
          placeholder="Draft title"
        />
      </div>
      <Toolbar editor={editor} documentId={documentId} />
      <div className="doc-canvas min-h-0 flex-1 overflow-auto bg-muted px-6 py-8">
        <SelectionToolbar editor={editor} />
        <EditorContent
          editor={editor}
          className="academic-doc doc-paper mx-auto"
        />
      </div>
    </div>
  );
}
