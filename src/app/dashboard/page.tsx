"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { signOut } from "firebase/auth";
import { api } from "../../../convex/_generated/api";
import { firebaseAuth } from "@/lib/firebase";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  async function handleCreate() {
    const id = await createDocument({});
    router.push(`/doc/${id}`);
  }

  async function handleRemove(documentId: Id<"documents">) {
    await removeDocument({ documentId });
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-6 overflow-y-auto px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your documents
          </h1>
          <p className="text-sm text-muted-foreground">
            Thesis, dissertation, and paper drafts you&apos;re working on.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate}>New draft</Button>
          <Button variant="ghost" onClick={() => signOut(firebaseAuth)}>
            Sign out
          </Button>
        </div>
      </div>

      {documents === undefined ? (
        <p className="text-sm text-muted-foreground">Loading documents...</p>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No drafts yet. Start your first thesis draft.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {documents.map((doc) => (
            <Card
              key={doc._id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => router.push(`/doc/${doc._id}`)}
            >
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base font-medium">
                    {doc.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Updated {dateFormatter.format(doc.updatedAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleRemove(doc._id);
                  }}
                >
                  Delete
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
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
