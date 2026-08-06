import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireDocument, requireUser } from "./model/auth";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("documents")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .take(200);
  },
});

export const get = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    return await requireDocument(ctx, args.documentId);
  },
});

export const create = mutation({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("documents", {
      ownerId: user._id,
      title: args.title ?? "Draf tanpa judul",
      content: EMPTY_DOC,
      updatedAt: Date.now(),
    });
  },
});

export const updateContent = mutation({
  args: { documentId: v.id("documents"), content: v.any() },
  handler: async (ctx, args) => {
    await requireDocument(ctx, args.documentId);
    await ctx.db.patch("documents", args.documentId, {
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});

export const updateTitle = mutation({
  args: { documentId: v.id("documents"), title: v.string() },
  handler: async (ctx, args) => {
    await requireDocument(ctx, args.documentId);
    await ctx.db.patch("documents", args.documentId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    await requireDocument(ctx, args.documentId);

    const files = await ctx.db
      .query("documentFiles")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();
    for (const file of files) {
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete("documentFiles", file._id);
    }

    await ctx.db.delete("documents", args.documentId);
  },
});
