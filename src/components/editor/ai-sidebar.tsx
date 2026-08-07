"use client";

import { useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import {
  AlertCircle,
  ChevronRight,
  FilePlus2,
  Replace,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Type,
  User,
} from "lucide-react";
import { getIdToken } from "@/lib/firebase";
import { serializeDoc } from "@/lib/editor/serialize";
import {
  applyFormatText,
  applyInsertText,
  applyReplaceText,
  type EditResult,
} from "@/lib/editor/apply-edit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchWebOutput = {
  answer: string;
  sources: { title?: string; url: string }[];
};

const EDIT_TOOL_META: Record<string, { label: string; icon: typeof FilePlus2 }> = {
  "tool-insert_text": { label: "Menyisipkan teks", icon: FilePlus2 },
  "tool-replace_text": { label: "Mengganti teks", icon: Replace },
  "tool-format_text": { label: "Mengubah format", icon: Type },
};

export function AiSidebar({
  editor,
  documentTitle,
}: {
  editor: Editor | null;
  documentTitle: string;
}) {
  const [input, setInput] = useState("");

  // `body` as a FUNCTION (not a static object) is required: useChat's
  // automatic resubmit after a client-executed tool result does not carry
  // over a one-off `sendMessage(..., { body })`, but it does re-invoke this
  // function — which also means the resubmit sends the post-edit document,
  // so the model sees the effect of its own tool call for free.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async () => ({
          Authorization: `Bearer ${await getIdToken()}`,
        }),
        body: () => {
          const state = editor?.state;
          if (!state) return { docTitle: documentTitle, docText: "" };
          const { from, to } = state.selection;
          return {
            docTitle: documentTitle,
            docText: serializeDoc(state.doc),
            selection:
              from === to ? undefined : state.doc.textBetween(from, to, " "),
          };
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documentTitle],
  );

  const { messages, sendMessage, addToolOutput, status, error, regenerate } =
    useChat({
      transport,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      onToolCall: ({ toolCall }) => {
        if (toolCall.dynamic) return;

        if (!editor) {
          addToolOutput({
            tool: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            state: "output-error",
            errorText: "Editor belum siap.",
          });
          return;
        }

        let result: EditResult | undefined;
        switch (toolCall.toolName) {
          case "insert_text":
            result = applyInsertText(
              editor,
              toolCall.input as { text: string; at?: "cursor" | "end" },
            );
            break;
          case "replace_text":
            result = applyReplaceText(
              editor,
              toolCall.input as {
                find: string;
                replace: string;
                occurrence?: number;
              },
            );
            break;
          case "format_text":
            result = applyFormatText(
              editor,
              toolCall.input as {
                find: string;
                format:
                  | "bold"
                  | "italic"
                  | "strike"
                  | "underline"
                  | "heading";
                level?: 1 | 2 | 3;
              },
            );
            break;
          default:
            return; // search_web executes server-side
        }

        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output: result,
        });
      },
    });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    void sendMessage({ text });
    setInput("");
  }

  const isBusy = status === "streaming" || status === "submitted";
  const lastMessage = messages[messages.length - 1];
  const isThinking = isBusy && (!lastMessage || lastMessage.role === "user");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tanyakan sesuatu, minta riset bersitasi, atau minta Reindex Agent
            mengedit dokumen ini langsung.
          </p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start gap-2">
              {message.role === "user" ? (
                <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              ) : (
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              )}
              <div className="min-w-0 flex-1 space-y-1.5">
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <p
                        key={i}
                        className={
                          message.role === "user"
                            ? "text-sm font-medium"
                            : "text-sm"
                        }
                      >
                        {part.text}
                      </p>
                    );
                  }

                  if (
                    part.type === "tool-insert_text" ||
                    part.type === "tool-replace_text" ||
                    part.type === "tool-format_text"
                  ) {
                    const meta = EDIT_TOOL_META[part.type];
                    const Icon = meta.icon;
                    if (part.state === "output-available") {
                      const output = part.output as EditResult;
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${
                            output.ok
                              ? "text-muted-foreground"
                              : "border-destructive/50 text-destructive"
                          }`}
                        >
                          <Icon className="size-3.5 shrink-0" />
                          {output.ok ? output.message : output.error}
                        </div>
                      );
                    }
                    if (part.state === "output-error") {
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 rounded-md border border-destructive/50 px-2.5 py-1.5 text-xs text-destructive"
                        >
                          <AlertCircle className="size-3.5 shrink-0" />
                          {part.errorText}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground"
                      >
                        <Icon className="size-3.5 shrink-0 animate-pulse" />
                        {meta.label}...
                      </div>
                    );
                  }

                  if (part.type === "tool-search_web") {
                    if (part.state === "output-available") {
                      const output = part.output as SearchWebOutput;
                      return (
                        <details
                          key={i}
                          className="group rounded-md border text-xs"
                        >
                          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                            <ChevronRight className="size-3.5 shrink-0 transition-transform group-open:rotate-90" />
                            <Search className="size-3.5 shrink-0" />
                            Meneliti web · {output.sources.length} sumber
                          </summary>
                          <div className="space-y-1.5 border-t px-2.5 py-2">
                            <p>{output.answer}</p>
                            {output.sources.length > 0 ? (
                              <ul className="space-y-0.5">
                                {output.sources.map((source, si) => (
                                  <li key={si}>
                                    <a
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary underline underline-offset-2"
                                    >
                                      {source.title ?? source.url}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </details>
                      );
                    }
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground"
                      >
                        <Search className="size-3.5 shrink-0 animate-pulse" />
                        Mencari sumber...
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          ))
        )}

        {isThinking ? (
          <div className="flex items-center gap-2 pl-6">
            <Sparkles className="size-4 shrink-0 animate-pulse text-primary" />
            <span className="animate-pulse text-xs text-muted-foreground">
              Reindex Agent sedang berpikir...
            </span>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/50 px-2.5 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <p>{error?.message || "Permintaan gagal. Coba lagi."}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => regenerate()}
              >
                <RotateCcw />
                Coba lagi
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="no-print flex items-center gap-2 border-t p-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya atau minta edit..."
          disabled={isBusy}
        />
        <Button type="submit" size="icon-sm" disabled={!input.trim() || isBusy}>
          <Send />
        </Button>
      </form>
    </div>
  );
}
