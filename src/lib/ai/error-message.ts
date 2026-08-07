import { APICallError } from "ai";

/** Turns a thrown AI SDK error into a message safe and useful to show the user. */
export function describeAiError(error: unknown): string {
  if (APICallError.isInstance(error) && error.statusCode === 429) {
    return "Sorry — we've hit today's AI usage limit. This demo runs on a free-tier API key, which caps how many requests it can handle per day. Please try again later.";
  }
  return "The AI request failed. Please try again.";
}
