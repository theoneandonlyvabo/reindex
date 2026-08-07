import { v } from "convex/values";
import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import { requireUser } from "./model/auth";

const rateLimiter = new RateLimiter(components.rateLimiter, {
  chat: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 5 },
  rewrite: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 5 },
  complete: { kind: "token bucket", rate: 60, period: MINUTE, capacity: 10 },
});

/**
 * Called from Next.js AI route handlers (chat/rewrite/complete) before any
 * model call — Gemini/Groq/Perplexity keys never touch Convex, so the model
 * call itself happens in Next.js, gated by this check.
 */
export const checkAndConsume = mutation({
  args: {
    name: v.union(v.literal("chat"), v.literal("rewrite"), v.literal("complete")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await rateLimiter.limit(ctx, args.name, { key: user._id });
  },
});
