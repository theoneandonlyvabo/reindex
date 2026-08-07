import type { Node as PMNode } from "@tiptap/pm/model";

export interface TextIndex {
  text: string;
  segments: { start: number; pos: number; len: number }[];
}

/**
 * Flattens the document into plain text plus a map back to ProseMirror
 * positions, so AI tool calls can address content by verbatim substring
 * instead of needing to reason about PM positions directly. Textblocks are
 * joined with a blank line, which is deliberately NOT part of any segment —
 * a `find` string that crosses a paragraph break has no valid position and
 * `findRange` returns null for it.
 */
export function buildTextIndex(doc: PMNode): TextIndex {
  const segments: TextIndex["segments"] = [];
  let text = "";
  let first = true;

  doc.descendants((node, pos) => {
    if (node.isTextblock) {
      if (!first) text += "\n\n";
      first = false;
      return true;
    }
    if (node.isText && node.text) {
      segments.push({ start: text.length, pos, len: node.text.length });
      text += node.text;
    }
    return true;
  });

  return { text, segments };
}

function offsetToPos(index: TextIndex, offset: number): number | null {
  for (const seg of index.segments) {
    if (offset >= seg.start && offset <= seg.start + seg.len) {
      return seg.pos + (offset - seg.start);
    }
  }
  return null;
}

export function findRange(
  index: TextIndex,
  needle: string,
  occurrence = 1,
): { from: number; to: number } | null {
  let searchIndex = -1;
  for (let i = 0; i < occurrence; i++) {
    searchIndex = index.text.indexOf(needle, searchIndex + 1);
    if (searchIndex === -1) return null;
  }

  const from = offsetToPos(index, searchIndex);
  const to = offsetToPos(index, searchIndex + needle.length);
  if (from === null || to === null) return null;
  return { from, to };
}
