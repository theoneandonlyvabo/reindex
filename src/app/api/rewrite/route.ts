import { google } from "@ai-sdk/google";
import { APICallError, generateText } from "ai";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { rewriteSystemPrompt } from "@/lib/ai/prompts";
import { describeAiError } from "@/lib/ai/error-message";

type RewriteRequestBody = {
  selectedText: string;
  instruction: string;
};

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rate = await checkRateLimit(token, "rewrite");
  if (!rate.ok) {
    if (rate.reason === "unauthenticated") {
      return new Response("Unauthorized", { status: 401 });
    }
    return new Response("Too many requests, please try again shortly.", {
      status: 429,
    });
  }

  const { selectedText, instruction } =
    (await req.json()) as RewriteRequestBody;
  if (!selectedText?.trim() || !instruction?.trim()) {
    return new Response("Missing selectedText or instruction", {
      status: 400,
    });
  }

  try {
    const { text } = await generateText({
      model: google("gemini-3.5-flash"),
      system: rewriteSystemPrompt(),
      prompt: `<selected_text>\n${selectedText}\n</selected_text>\n\nInstruction: ${instruction}`,
    });

    return Response.json({ text: text.trim() });
  } catch (error) {
    const status = APICallError.isInstance(error) && error.statusCode === 429 ? 429 : 502;
    return new Response(describeAiError(error), { status });
  }
}
