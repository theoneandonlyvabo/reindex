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
import { PAGE_GAP_PX, PAGE_HEIGHT_PX } from "@/lib/editor/pagination-geometry";

export function DocumentEditor({
  editor,
  title,
  onTitleChange,
  documentId,
  pageCount,
}: {
  editor: Editor | null;
  title: string;
  onTitleChange: (next: string) => void;
  documentId: Id<"documents">;
  pageCount: number;
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
       * full-height sibling column like the AI sidebar.
       * bg-muted on this wrapper too (not just .doc-canvas below): on an
       * aggressive scroll-bounce past the canvas's edge, its own
       * background can't cover the overscrolled gap, and the app's warm
       * --background peeks through from behind. Muted here means there's
       * muted-colored area behind it either way. */}
      <div className="relative flex min-h-0 flex-1 bg-muted">
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
        <div
          className="doc-canvas min-h-0 flex-1 overflow-auto bg-muted px-6 py-8"
          style={{ zoom: `${zoom}%` }}
        >
          {/* zoom lives on the canvas, not .doc-paper directly: .doc-paper
           * has `max-width: 100%` (academic.css, a responsive safeguard) —
           * applying zoom to .doc-paper itself let text render at the
           * zoomed size while max-width clamped the PAGE back to the
           * canvas's unzoomed width, since the constraint's own reference
           * didn't scale with it. Zooming the canvas scales both together. */}
          <SelectionToolbar editor={editor} />
          <div className="doc-page-frame mx-auto">
            {/* Simulated page sheets, one per page the pagination
             * extension computed — see academic.css and
             * extensions/pagination.ts for how this works together. */}
            {Array.from({ length: pageCount }).map((_, i) => (
              <div
                key={i}
                className="doc-page-bg"
                style={{
                  top: i * (PAGE_HEIGHT_PX + PAGE_GAP_PX),
                  height: PAGE_HEIGHT_PX,
                }}
              />
            ))}
            <EditorContent editor={editor} className="academic-doc doc-paper" />
          </div>
        </div>
      </div>
    </div>
  );
}
