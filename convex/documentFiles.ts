import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getOwnedDocument, requireDocument, requireUser } from "./model/auth";

/** Client calls this to get a short-lived URL it can POST the file to directly. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Records the uploaded blob against a document, once the client-side POST succeeds. */
export const attach = mutation({
  args: { documentId: v.id("documents"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireDocument(ctx, args.documentId);
    await ctx.db.insert("documentFiles", {
      documentId: args.documentId,
      storageId: args.storageId,
    });
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const listForDocument = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await getOwnedDocument(ctx, args.documentId);
    if (!doc) return [];
    const files = await ctx.db
      .query("documentFiles")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();
    return await Promise.all(
      files.map(async (file) => ({
        _id: file._id,
        url: await ctx.storage.getUrl(file.storageId),
      })),
    );
  },
});
