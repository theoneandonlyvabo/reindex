"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { RequireAuth } from "@/components/auth/require-auth";
import { DocumentEditor } from "@/components/editor/document-editor";
import { Button } from "@/components/ui/button";

function DocumentPageContent() {
  const params = useParams<{ id: string }>();
  const documentId = params.id as Id<"documents">;
  const doc = useQuery(api.documents.get, { documentId });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (doc === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Memuat dokumen...
      </div>
    );
  }

  if (doc === null) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Dokumen tidak ditemukan atau Anda tidak memiliki akses.
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="min-w-0 flex-1 lg:basis-[70%]">
        <DocumentEditor key={doc._id} doc={doc} />
      </div>

      {sidebarOpen ? (
        <aside className="no-print hidden w-full flex-col border-l lg:flex lg:basis-[30%]">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="text-sm font-medium">Asisten AI</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSidebarOpen(false)}
            >
              <PanelRightClose />
            </Button>
          </div>
          <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            Sidebar agent akan tersedia di fase berikutnya.
          </div>
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

export default function DocumentPage() {
  return (
    <RequireAuth>
      <DocumentPageContent />
    </RequireAuth>
  );
}
