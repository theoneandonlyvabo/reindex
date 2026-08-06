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

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
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
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dokumen Anda
          </h1>
          <p className="text-sm text-muted-foreground">
            Draf skripsi, tesis, dan paper yang sedang Anda kerjakan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate}>Draf baru</Button>
          <Button variant="ghost" onClick={() => signOut(firebaseAuth)}>
            Keluar
          </Button>
        </div>
      </div>

      {documents === undefined ? (
        <p className="text-sm text-muted-foreground">Memuat dokumen...</p>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada draf. Mulai draf skripsi pertama Anda.
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
                    Diperbarui {dateFormatter.format(doc.updatedAt)}
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
                  Hapus
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
