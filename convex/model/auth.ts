import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Resolves the calling Firebase-authenticated user from the Convex auth
 * context. Throws when unauthenticated or when the user hasn't been
 * upserted yet (see `users.ensureUser`) — never returns null silently.
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new Error("User not found — call ensureUser first");
  }

  return user;
}

/**
 * Loads a document and throws unless the caller owns it. This is the one
 * place ownership is enforced — every document query/mutation must route
 * through this rather than checking `ownerId` inline.
 */
export async function requireDocument(
  ctx: QueryCtx | MutationCtx,
  documentId: Id<"documents">,
): Promise<Doc<"documents">> {
  const user = await requireUser(ctx);
  const doc = await ctx.db.get("documents", documentId);
  if (!doc || doc.ownerId !== user._id) {
    throw new Error("Not found or not authorized");
  }
  return doc;
}
