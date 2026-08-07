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
    return new Response("Terlalu banyak permintaan, coba lagi sebentar.", {
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
        description: "Menyisipkan teks baru ke dalam dokumen.",
        inputSchema: z.object({
          text: z.string().describe("Teks polos, tanpa markdown."),
          at: z.enum(["cursor", "end"]).default("end"),
        }),
      }),
      replace_text: tool({
        description:
          "Mengganti bagian teks yang sudah ada. `find` HARUS disalin verbatim dari dokumen dan TIDAK BOLEH melewati batas paragraf.",
        inputSchema: z.object({
          find: z.string().min(3),
          replace: z.string(),
          occurrence: z.number().int().min(1).default(1),
        }),
      }),
      format_text: tool({
        description: "Menerapkan format ke bagian teks verbatim yang sudah ada.",
        inputSchema: z.object({
          find: z.string().min(3),
          format: z.enum(["bold", "italic", "strike", "underline", "heading"]),
          level: z.number().int().min(1).max(3).optional(),
        }),
      }),

      // Server-executed: runs here, result goes straight back to the model.
      search_web: tool({
        description:
          "Mencari sumber di web untuk sitasi bersumber. Gunakan sebelum membuat klaim faktual atau sitasi apapun.",
        inputSchema: z.object({ query: z.string() }),
        execute: async ({ query }) => {
          const { text, sources } = await generateText({
            model: perplexity("sonar"),
            prompt: `Pertanyaan riset: ${query}\nJawab secara ringkas dan sertakan sumber.`,
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
