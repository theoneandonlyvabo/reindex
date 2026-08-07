"use client";

import { useState } from "react";
import Image from "next/image";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useDocumentEditor } from "@/hooks/use-document-editor";
import { DocumentEditor } from "./document-editor";
import { AiSidebar } from "./ai-sidebar";
import { Button } from "@/components/ui/button";

export function DocumentWorkspace({ doc }: { doc: Doc<"documents"> }) {
  const { editor, title, setTitle } = useDocumentEditor(doc);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-w-0 flex-1 lg:basis-[70%]">
        <DocumentEditor
          editor={editor}
          title={title}
          onTitleChange={setTitle}
          documentId={doc._id}
        />
      </div>

      {sidebarOpen ? (
        <aside className="no-print hidden w-full flex-col overflow-hidden border-l lg:flex lg:basis-[30%]">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div className="flex items-center gap-2">
              <Image
                src="/reindex-logo.png"
                alt=""
                width={16}
                height={16}
                className="size-4"
                unoptimized
              />
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
