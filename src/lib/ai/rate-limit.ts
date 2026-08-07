import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

type RateLimitName = "chat" | "rewrite" | "complete";

export type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" }
  | { ok: false; reason: "rate_limited"; retryAfter?: number };

/**
 * Consumes one unit from the named Convex rate-limiter bucket for the user
 * identified by `idToken`. Convex verifies the Firebase token itself (same
 * trust relationship as the client SDK, via convex/auth.config.ts) — the
 * Next.js route never has to verify it independently. Any failure to reach
 * that verification (missing/malformed/expired token) is treated as
 * unauthenticated rather than left to throw, since an invalid token is a
 * routine client condition, not a server error.
 */
export async function checkRateLimit(
  idToken: string,
  name: RateLimitName,
): Promise<RateLimitResult> {
  try {
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    client.setAuth(idToken);
    const result = await client.mutation(api.rateLimit.checkAndConsume, {
      name,
    });
    if (!result.ok) {
      return { ok: false, reason: "rate_limited", retryAfter: result.retryAfter };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "unauthenticated" };
  }
}
