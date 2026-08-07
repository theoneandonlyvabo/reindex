import type { Editor } from "@tiptap/react";
import { buildTextIndex, findRange } from "./text-index";

export type EditResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export function applyInsertText(
  editor: Editor,
  input: { text: string; at?: "cursor" | "end" },
): EditResult {
  const at = input.at ?? "end";
  const from =
    at === "end" ? editor.state.doc.content.size : editor.state.selection.from;

  // Inserted as a proper paragraph node, not a raw string — a raw string
  // insert glues onto whatever's already at that position with no paragraph
  // boundary, losing the document's structure (and its formatting).
  editor
    .chain()
    .focus()
    .insertContentAt(from, {
      type: "paragraph",
      content: input.text ? [{ type: "text", text: input.text }] : [],
    })
    .run();

  const to = editor.state.selection.from; // cursor lands right after the inserted content
  editor.commands.flashRange(from, to);

  return {
    ok: true,
    message: `Inserted a new paragraph at the ${at === "end" ? "end of the document" : "cursor position"}.`,
  };
}

export function applyReplaceText(
  editor: Editor,
  input: { find: string; replace: string; occurrence?: number },
): EditResult {
  const range = findRange(
    buildTextIndex(editor.state.doc),
    input.find,
    input.occurrence ?? 1,
  );
  if (!range) {
    return {
      ok: false,
      error: `Text not found (must be verbatim, cannot cross a paragraph boundary): "${input.find.slice(0, 80)}"`,
    };
  }
  editor.chain().focus().insertContentAt(range, input.replace).run();
  editor.commands.flashRange(range.from, range.from + input.replace.length);
  return { ok: true, message: "Text replaced." };
}

export function applyFormatText(
  editor: Editor,
  input: {
    find: string;
    format: "bold" | "italic" | "strike" | "underline" | "heading";
    level?: 1 | 2 | 3;
  },
): EditResult {
  const range = findRange(buildTextIndex(editor.state.doc), input.find);
  if (!range) {
    return {
      ok: false,
      error: `Text not found (must be verbatim, cannot cross a paragraph boundary): "${input.find.slice(0, 80)}"`,
    };
  }

  const chain = editor.chain().focus().setTextSelection(range);
  switch (input.format) {
    case "bold":
      chain.setBold().run();
      break;
    case "italic":
      chain.setItalic().run();
      break;
    case "strike":
      chain.setStrike().run();
      break;
    case "underline":
      chain.setUnderline().run();
      break;
    case "heading":
      chain.setHeading({ level: input.level ?? 2 }).run();
      break;
  }
  editor.commands.flashRange(range.from, range.to);

  return { ok: true, message: `Applied ${input.format} formatting.` };
}
