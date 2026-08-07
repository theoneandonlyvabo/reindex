import { Extension } from "@tiptap/core";

const TYPES = ["paragraph", "heading"];

// A pure line-height change is invisible on any paragraph that doesn't
// wrap to a second line — which is most of them — so "line spacing" here
// also scales the gap between blocks (paired 1:1 with the toolbar's 4
// preset values, matching `.academic-doc p`'s existing 1em default at the
// "1.5" entry so picking the default option is a visual no-op).
const PARAGRAPH_SPACING: Record<string, string> = {
  "1": "0.5em",
  "1.15": "0.6em",
  "1.5": "1em",
  "2": "1.5em",
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

/**
 * `.academic-doc` sets a document-wide `line-height: 1.5` default in
 * academic.css — this attribute renders as an inline style, which wins on
 * specificity, so per-block overrides layer on top without touching the
 * base rule.
 */
export const LineHeight = Extension.create({
  name: "lineHeight",

  addGlobalAttributes() {
    return [
      {
        types: TYPES,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {};
              const spacing = PARAGRAPH_SPACING[attributes.lineHeight];
              const style = spacing
                ? `line-height: ${attributes.lineHeight}; margin-bottom: ${spacing}`
                : `line-height: ${attributes.lineHeight}`;
              return { style };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight) =>
        ({ editor, chain }) => {
          const nodeType = editor.state.selection.$from.parent.type.name;
          if (!TYPES.includes(nodeType)) return false;
          return chain().updateAttributes(nodeType, { lineHeight }).run();
        },
      unsetLineHeight:
        () =>
        ({ editor, chain }) => {
          const nodeType = editor.state.selection.$from.parent.type.name;
          if (!TYPES.includes(nodeType)) return false;
          return chain().updateAttributes(nodeType, { lineHeight: null }).run();
        },
    };
  },
});
