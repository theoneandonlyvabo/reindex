"use client";

import { useState } from "react";
import { PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useDocumentEditor } from "@/hooks/use-document-editor";
import { DocumentEditor } from "./document-editor";
import { AiSidebar } from "./ai-sidebar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function DocumentWorkspace({ doc }: { doc: Doc<"documents"> }) {
  const {
    editor,
    title,
    setTitle,
    autocompleteEnabled,
    setAutocompleteEnabled,
    pageCount,
  } = useDocumentEditor(doc);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-w-0 flex-1 lg:basis-[78%]">
        <DocumentEditor
          editor={editor}
          title={title}
          onTitleChange={setTitle}
          documentId={doc._id}
          pageCount={pageCount}
        />
      </div>

      {sidebarOpen ? (
        <aside className="no-print hidden w-full flex-col overflow-hidden border-l lg:flex lg:basis-[22%]">
          <div className="flex h-12 items-center justify-between border-b px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Reindex Agent</span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSidebarOpen(false)}
            >
              <PanelRightClose />
            </Button>
          </div>
          <div className="flex h-11 items-center justify-between border-b bg-background px-4 py-2">
            <Label
              htmlFor="autocomplete-toggle"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Sparkles className="size-3.5" />
              Inline autocomplete
            </Label>
            <Switch
              id="autocomplete-toggle"
              size="sm"
              checked={autocompleteEnabled}
              onCheckedChange={setAutocompleteEnabled}
            />
          </div>
          <AiSidebar editor={editor} documentTitle={title} />
        </aside>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          className="no-print absolute top-16 right-2 hidden lg:flex"
          onClick={() => setSidebarOpen(true)}
        >
          <PanelRightOpen />
        </Button>
      )}
    </div>
  );
}
