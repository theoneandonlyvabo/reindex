import { groq } from "@ai-sdk/groq";
import { APICallError, generateText } from "ai";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { describeAiError } from "@/lib/ai/error-message";

// Preceding characters sent as context — enough for a coherent
// continuation without ballooning the payload on every keystroke pause.
const MAX_CONTEXT_CHARS = 2000;

type CompleteRequestBody = { context: string };

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rate = await checkRateLimit(token, "complete");
  if (!rate.ok) {
    if (rate.reason === "unauthenticated") {
      return new Response("Unauthorized", { status: 401 });
    }
    return new Response("Too many requests.", { status: 429 });
  }

  const { context } = (await req.json()) as CompleteRequestBody;
  const trimmedContext = (context ?? "").slice(-MAX_CONTEXT_CHARS);
  if (!trimmedContext.trim()) {
    return Response.json({ suggestion: "" });
  }

  try {
    const { text } = await generateText({
      // Separate provider and model from the Gemini routes on purpose —
      // this fires on every typing pause, so latency budget is much
      // tighter than the sidebar/rewrite calls.
      model: groq("llama-3.1-8b-instant"),
      system: [
        "You are an inline autocomplete engine inside an academic document editor (theses, dissertations, papers).",
        "Continue the given text naturally, picking up EXACTLY where it stops — no repeated words, no leading space unless the text needs one, no explanation.",
        "Output ONLY the continuation: roughly 3-12 words, one short phrase or clause. No quotes, no markdown.",
        "Match the register and language already used (Indonesian or English). If there's nothing sensible to add, output nothing.",
      ].join("\n"),
      prompt: trimmedContext,
      maxOutputTokens: 32,
      temperature: 0.3,
    });

    return Response.json({ suggestion: text.trimEnd() });
  } catch (error) {
    const status = APICallError.isInstance(error) && error.statusCode === 429 ? 429 : 502;
    return new Response(describeAiError(error), { status });
  }
}
