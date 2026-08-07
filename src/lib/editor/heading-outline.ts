import type { Editor } from "@tiptap/react";

export type OutlineEntry = {
  pos: number;
  level: 1 | 2 | 3;
  text: string;
  number: string;
};

const ROMAN_NUMERALS = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
];

function toRoman(n: number): string {
  return ROMAN_NUMERALS[n - 1] ?? String(n);
}

/**
 * Walks the document for heading nodes and derives chapter.section.subsection
 * numbering — the same scheme the paper's CSS counters used to render
 * inline (now removed from the paper itself; see academic.css) — for the
 * outline panel to display instead.
 */
export function buildOutline(editor: Editor): OutlineEntry[] {
  const entries: OutlineEntry[] = [];
  let chapter = 0;
  let section = 0;
  let subsection = 0;

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== "heading") return;
    const level = node.attrs.level as 1 | 2 | 3;
    const text = node.textContent.trim();
    if (!text) return;

    let number: string;
    if (level === 1) {
      chapter += 1;
      section = 0;
      subsection = 0;
      number = `BAB ${toRoman(chapter)}`;
    } else if (level === 2) {
      section += 1;
      subsection = 0;
      number = `${chapter || 1}.${section}`;
    } else {
      subsection += 1;
      number = `${chapter || 1}.${section || 1}.${subsection}`;
    }

    entries.push({ pos, level, text, number });
  });

  return entries;
}
