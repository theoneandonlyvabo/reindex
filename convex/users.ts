import { mutation } from "./_generated/server";

/**
 * Upsert-on-first-call: the client invokes this right after Firebase
 * sign-in. Identity (uid, email, name) comes only from the verified auth
 * context — never from client-supplied arguments.
 */
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      firebaseUid: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email ?? "",
      name: identity.name,
    });
  },
});
