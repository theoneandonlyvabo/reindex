import { APICallError } from "ai";

/** Turns a thrown AI SDK error into a message safe and useful to show the user. */
export function describeAiError(error: unknown): string {
  if (APICallError.isInstance(error) && error.statusCode === 429) {
    return "Reindex Agent is temporarily rate-limited by the AI provider (daily quota reached). Please wait a bit and try again.";
  }
  return "The AI request failed. Please try again.";
}
