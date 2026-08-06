import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Resolves the calling Firebase-authenticated user, or null if unauthenticated
 * or if `users.ensureUser` hasn't landed yet — a brief race right after
 * sign-in/reload, since that mutation fires from a client effect rather than
 * being awaited before other queries run. Returning null (not throwing) lets
 * Convex's reactivity do the healing: once `ensureUser` inserts the row, any
 * query that read the `by_token_identifier` index — even as a miss — reruns
 * automatically. Use this in queries; use `requireUser` in mutations, where
 * a missing row after the initial bootstrap is a genuine error worth failing on.
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

export async function requireUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const user = await getAuthenticatedUser(ctx);
  if (!user) {
    throw new Error("Unauthenticated");
  }
  return user;
}

/**
 * Loads a document the caller owns, or null — collapsing "unauthenticated",
 * "user not provisioned yet", "document doesn't exist", and "not yours" into
 * the same null so none of them leak whether a document exists. Use in queries.
 */
export async function getOwnedDocument(
  ctx: QueryCtx | MutationCtx,
  documentId: Id<"documents">,
): Promise<Doc<"documents"> | null> {
  const user = await getAuthenticatedUser(ctx);
  if (!user) return null;
  const doc = await ctx.db.get("documents", documentId);
  if (!doc || doc.ownerId !== user._id) return null;
  return doc;
}

/**
 * Throws unless the caller owns the document — this is the one place
 * ownership is enforced for mutations, so there's no per-caller guard to forget.
 */
export async function requireDocument(
  ctx: QueryCtx | MutationCtx,
  documentId: Id<"documents">,
): Promise<Doc<"documents">> {
  const doc = await getOwnedDocument(ctx, documentId);
  if (!doc) {
    throw new Error("Not found or not authorized");
  }
  return doc;
}
