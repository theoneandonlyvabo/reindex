"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EditorContent, type Editor } from "@tiptap/react";
import { PanelLeftOpen } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Toolbar } from "./toolbar";
import { SelectionToolbar } from "./selection-toolbar";
import { DocumentOutline } from "./document-outline";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const [zoom, setZoom] = useState(100);
  const [outlineOpen, setOutlineOpen] = useState(true);

  return (
    <div className="flex h-full flex-col">
      <div className="no-print flex h-12 items-center gap-2 border-b px-4 py-2">
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
      <Toolbar
        editor={editor}
        documentId={documentId}
        zoom={zoom}
        onZoomChange={setZoom}
      />
      {/* Outline sits BELOW the title bar + toolbar (which span the full
       * editor column width), alongside only the paper canvas — not a
       * full-height sibling column like the AI sidebar. */}
      <div className="relative flex min-h-0 flex-1">
        {outlineOpen ? (
          <DocumentOutline
            editor={editor}
            onCollapse={() => setOutlineOpen(false)}
          />
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            className="no-print absolute top-2 left-2 z-10 hidden lg:flex"
            onClick={() => setOutlineOpen(true)}
          >
            <PanelLeftOpen />
          </Button>
        )}
        <div className="doc-canvas min-h-0 flex-1 overflow-auto bg-muted px-6 py-8">
          <SelectionToolbar editor={editor} />
          <EditorContent
            editor={editor}
            className="academic-doc doc-paper mx-auto"
            style={{ zoom: `${zoom}%` }}
          />
        </div>
      </div>
    </div>
  );
}
