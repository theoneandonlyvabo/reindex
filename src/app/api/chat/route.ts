import { google } from "@ai-sdk/google";
import { perplexity } from "@ai-sdk/perplexity";
import {
  convertToModelMessages,
  generateText,
  isStepCount,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { agentSystemPrompt } from "@/lib/ai/prompts";

// Multi-step tool loops + retries against a model that's shown transient
// "high demand" errors can legitimately take 10-15s per step.
export const maxDuration = 60;

type ChatRequestBody = {
  messages: UIMessage[];
  docTitle: string;
  docText: string;
  selection?: string;
};

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rate = await checkRateLimit(token, "chat");
  if (!rate.ok) {
    if (rate.reason === "unauthenticated") {
      return new Response("Unauthorized", { status: 401 });
    }
    return new Response("Too many requests, please try again shortly.", {
      status: 429,
    });
  }

  const { messages, docTitle, docText, selection } =
    (await req.json()) as ChatRequestBody;

  const result = streamText({
    model: google("gemini-3.5-flash"),
    system: agentSystemPrompt({ docTitle, docText, selection }),
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(6),
    tools: {
      // Client-executed: no `execute`, handled by the sidebar's onToolCall
      // against the live TipTap editor instance.
      insert_text: tool({
        description:
          "Inserts ONE new paragraph into the document (always its own paragraph block, inheriting the document's formatting). To add/change text in the MIDDLE of an existing paragraph, use replace_text instead — do not use insert_text for that.",
        inputSchema: z.object({
          text: z.string().describe("Plain text for one paragraph, no markdown."),
          at: z.enum(["cursor", "end"]).default("end"),
        }),
      }),
      replace_text: tool({
        description:
          "Replaces existing text, or inserts text mid-paragraph (make `replace` the old text plus the new text combined). `find` MUST be copied verbatim from the document and MUST NOT cross a paragraph boundary.",
        inputSchema: z.object({
          find: z.string().min(3),
          replace: z.string(),
          occurrence: z.number().int().min(1).default(1),
        }),
      }),
      format_text: tool({
        description: "Applies formatting to an existing verbatim span of text.",
        inputSchema: z.object({
          find: z.string().min(3),
          format: z.enum(["bold", "italic", "strike", "underline", "heading"]),
          level: z.number().int().min(1).max(3).optional(),
        }),
      }),

      // Server-executed: runs here, result goes straight back to the model.
      search_web: tool({
        description:
          "Searches the web for citable sources. Use this before making any factual claim or citation.",
        inputSchema: z.object({ query: z.string() }),
        execute: async ({ query }) => {
          const { text, sources } = await generateText({
            model: perplexity("sonar"),
            prompt: `Research question: ${query}\nAnswer concisely and include sources.`,
          });
          return {
            answer: text,
            sources: (sources ?? [])
              .filter((source) => source.sourceType === "url")
              .map((source) => ({
                title: source.title ?? source.url,
                url: source.url,
              })),
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
