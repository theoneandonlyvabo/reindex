import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    firebaseUid: v.string(),
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  })
    .index("by_firebase_uid", ["firebaseUid"])
    .index("by_token_identifier", ["tokenIdentifier"]),

  documents: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    content: v.any(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  documentFiles: defineTable({
    documentId: v.id("documents"),
    storageId: v.id("_storage"),
  }).index("by_document", ["documentId"]),
});
