"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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
  Frown,
  Replace,
  RotateCcw,
  Search,
  Send,
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
import { ChatMarkdown } from "./chat-markdown";

type SearchWebOutput = {
  answer: string;
  sources: { title?: string; url: string }[];
};

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const EDIT_TOOL_META: Record<
  string,
  { label: string; icon: typeof FilePlus2 }
> = {
  "tool-insert_text": { label: "Inserting text", icon: FilePlus2 },
  "tool-replace_text": { label: "Replacing text", icon: Replace },
  "tool-format_text": { label: "Changing format", icon: Type },
};

export function AiSidebar({
  editor,
  documentTitle,
}: {
  editor: Editor | null;
  documentTitle: string;
}) {
  const [input, setInput] = useState("");
  // Timestamp per user message, captured at send time (in the event
  // handler — Date.now() there is fine; it's render/effect bodies that
  // must stay pure). Keyed by send order since the SDK assigns message ids
  // asynchronously, after this handler returns.
  const [userTimestamps, setUserTimestamps] = useState<number[]>([]);

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
            errorText: "Editor isn't ready yet.",
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
                format: "bold" | "italic" | "strike" | "underline" | "heading";
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
    setUserTimestamps((prev) => [...prev, Date.now()]);
    void sendMessage({ text });
    setInput("");
  }

  const isBusy = status === "streaming" || status === "submitted";
  const lastMessage = messages[messages.length - 1];
  const isThinking = isBusy && (!lastMessage || lastMessage.role === "user");
  let userMessageIndex = -1;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ask something, request cited research, or have Reindex Agent edit
            this document directly.
          </p>
        ) : (
          messages.map((message) => {
            if (message.role === "user") userMessageIndex += 1;
            const userTimestamp = userTimestamps[userMessageIndex];
            return message.role === "user" ? (
              <div
                key={message.id}
                className="flex flex-col items-end gap-1 pl-6"
              >
                <div className="flex justify-end gap-2">
                  <div className="max-w-[85%] space-y-1 rounded-2xl rounded-tr-sm bg-muted px-3 py-1.5">
                    {message.parts.map((part, i) =>
                      part.type === "text" ? (
                        <p key={i} className="text-sm">
                          {part.text}
                        </p>
                      ) : null,
                    )}
                  </div>
                  <User className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>
                <span className="pr-6 text-[0.65rem] text-muted-foreground">
                  {userTimestamp ? timeFormatter.format(userTimestamp) : ""}
                </span>
              </div>
            ) : (
              <div key={message.id} className="flex items-start gap-2">
                <Image
                  src="/reindex-logo.png"
                  alt=""
                  width={16}
                  height={16}
                  className="mt-0.5 size-4 shrink-0"
                  unoptimized
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return (
                        <div key={i} className="text-sm">
                          <ChatMarkdown text={part.text} />
                        </div>
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
                              Researched the web · {output.sources.length}{" "}
                              sources
                            </summary>
                            <div className="space-y-1.5 border-t px-2.5 py-2">
                              <ChatMarkdown text={output.answer} />
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
                          Searching the web...
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            );
          })
        )}

        {isThinking ? (
          <div className="flex items-center gap-2 pl-6">
            <Image
              src="/reindex-logo.png"
              alt=""
              width={16}
              height={16}
              className="size-4 shrink-0 animate-pulse"
              unoptimized
            />
            <span className="animate-pulse text-xs text-muted-foreground">
              Reindex Agent is thinking...
            </span>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
            <Frown className="size-8 text-destructive/70" />
            <p className="text-sm font-medium">Something went wrong</p>
            <p className="max-w-[90%] text-xs text-muted-foreground">
              {error?.message || "The request failed. Please try again."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => regenerate()}
            >
              <RotateCcw />
              Try again
            </Button>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="no-print flex items-center gap-2 border-t p-4"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask or request an edit..."
          disabled={isBusy}
        />
        <Button type="submit" size="icon-sm" disabled={!input.trim() || isBusy}>
          <Send />
        </Button>
      </form>
    </div>
  );
}
