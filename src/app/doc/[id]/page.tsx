"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { RequireAuth } from "@/components/auth/require-auth";
import { DocumentWorkspace } from "@/components/editor/document-workspace";

function DocumentPageContent() {
  const params = useParams<{ id: string }>();
  const documentId = params.id as Id<"documents">;
  const doc = useQuery(api.documents.get, { documentId });

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

  return <DocumentWorkspace key={doc._id} doc={doc} />;
}

export default function DocumentPage() {
  return (
    <RequireAuth>
      <DocumentPageContent />
    </RequireAuth>
  );
}
