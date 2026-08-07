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
  const pos =
    at === "end" ? editor.state.doc.content.size : editor.state.selection.from;
  editor.chain().focus().insertContentAt(pos, input.text).run();
  return {
    ok: true,
    message: `Menyisipkan teks di ${at === "end" ? "akhir dokumen" : "posisi kursor"}.`,
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
      error: `Teks tidak ditemukan (harus verbatim, tidak boleh melewati batas paragraf): "${input.find.slice(0, 80)}"`,
    };
  }
  editor.chain().focus().insertContentAt(range, input.replace).run();
  return { ok: true, message: "Teks berhasil diganti." };
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
      error: `Teks tidak ditemukan (harus verbatim, tidak boleh melewati batas paragraf): "${input.find.slice(0, 80)}"`,
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

  return { ok: true, message: `Format ${input.format} diterapkan.` };
}
