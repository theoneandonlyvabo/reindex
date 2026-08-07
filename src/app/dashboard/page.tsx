"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, Plus, Search, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { signOut } from "firebase/auth";
import { api } from "../../../convex/_generated/api";
import { firebaseAuth } from "@/lib/firebase";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { Id } from "../../../convex/_generated/dataModel";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function DashboardContent() {
  const router = useRouter();
  const documents = useQuery(api.documents.list);
  const createDocument = useMutation(api.documents.create);
  const removeDocument = useMutation(api.documents.remove);
  const [query, setQuery] = useState("");

  async function handleCreate() {
    const id = await createDocument({});
    router.push(`/doc/${id}`);
  }

  async function handleRemove(documentId: Id<"documents">) {
    await removeDocument({ documentId });
  }

  const filtered = documents?.filter((doc) =>
    doc.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="flex items-center gap-4 border-b px-6 py-3">
        <Image
          src="/reindex-logo.png"
          alt="Reindex AI"
          width={24}
          height={24}
          className="size-6"
          unoptimized
        />
        <span className="font-medium">Reindex AI</span>
        <div className="relative mx-auto w-full max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents"
            className="pl-9"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut(firebaseAuth)}
          aria-label="Sign out"
        >
          <LogOut />
        </Button>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Start a new draft
          </h2>
          <button
            onClick={handleCreate}
            className="flex h-40 w-40 flex-col items-center justify-center gap-2 border bg-card transition-colors hover:bg-muted/50"
          >
            <Plus className="size-8 text-primary" />
            <span className="text-xs text-muted-foreground">Blank draft</span>
          </button>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Recent documents
          </h2>

          {documents === undefined ? (
            <p className="text-sm text-muted-foreground">
              Loading documents...
            </p>
          ) : filtered && filtered.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {documents.length === 0
                  ? "No drafts yet. Start your first thesis draft above."
                  : "No documents match your search."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {filtered?.map((doc) => (
                <button
                  key={doc._id}
                  onClick={() => router.push(`/doc/${doc._id}`)}
                  className="group flex aspect-[3/4] flex-col overflow-hidden border bg-card text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-1 items-center justify-center border-b bg-muted/40">
                    <Image
                      src="/reindex-logo.png"
                      alt=""
                      width={28}
                      height={28}
                      className="size-7 opacity-30"
                      unoptimized
                    />
                  </div>
                  <div className="flex items-start justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {doc.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dateFormatter.format(doc.updatedAt)}
                      </p>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleRemove(doc._id);
                      }}
                      className="shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                      aria-label="Delete document"
                    >
                      <Trash2 className="size-4" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
