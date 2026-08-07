import type { Node as PMNode } from "@tiptap/pm/model";

const DEFAULT_LIMIT = 12000;

/**
 * Flattens the document into plain, markdown-ish text for the AI's document
 * context — not the TipTap JSON (too token-heavy, and the model can't
 * reliably reproduce verbatim `find` strings from a JSON tree).
 */
export function serializeDoc(doc: PMNode, limit = DEFAULT_LIMIT): string {
  const lines: string[] = [];

  doc.forEach((node) => {
    const text = node.textContent;
    if (!text.trim()) return;

    if (node.type.name === "heading") {
      const level = (node.attrs.level as number) ?? 1;
      lines.push(`${"#".repeat(level)} ${text}`);
    } else if (node.type.name === "bulletList" || node.type.name === "orderedList") {
      node.forEach((item) => lines.push(`- ${item.textContent}`));
    } else {
      lines.push(text);
    }
  });

  const full = lines.join("\n\n");
  if (full.length <= limit) return full;

  const half = Math.floor(limit / 2);
  return `${full.slice(0, half)}\n\n[... middle truncated ...]\n\n${full.slice(-half)}`;
}
