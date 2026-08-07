import { Extension } from "@tiptap/core";

const TYPES = ["paragraph", "heading"];
const INDENT_STEP_PX = 32;
const MAX_INDENT_STEPS = 8;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

/**
 * Covers both cases from the same Tab-shaped action: inside a list item,
 * indent re-parents under the previous sibling (`sinkListItem`, built into
 * the list extensions already in StarterKit); everywhere else it steps a
 * plain `margin-left` attribute on the current paragraph/heading. Only one
 * of the two ever applies to a given selection, so they don't conflict.
 */
export const Indent = Extension.create({
  name: "indent",

  addGlobalAttributes() {
    return [
      {
        types: TYPES,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const margin = parseInt(element.style.marginLeft || "0", 10);
              return Math.round(margin / INDENT_STEP_PX) || 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent) return {};
              return {
                style: `margin-left: ${attributes.indent * INDENT_STEP_PX}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ editor, chain }) => {
          if (editor.can().sinkListItem("listItem")) {
            return chain().sinkListItem("listItem").run();
          }
          const nodeType = editor.state.selection.$from.parent.type.name;
          if (!TYPES.includes(nodeType)) return false;
          const current = (editor.getAttributes(nodeType).indent as number) ?? 0;
          if (current >= MAX_INDENT_STEPS) return false;
          return chain()
            .updateAttributes(nodeType, { indent: current + 1 })
            .run();
        },
      outdent:
        () =>
        ({ editor, chain }) => {
          if (editor.can().liftListItem("listItem")) {
            return chain().liftListItem("listItem").run();
          }
          const nodeType = editor.state.selection.$from.parent.type.name;
          if (!TYPES.includes(nodeType)) return false;
          const current = (editor.getAttributes(nodeType).indent as number) ?? 0;
          if (current <= 0) return false;
          return chain()
            .updateAttributes(nodeType, { indent: current - 1 })
            .run();
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Returning false here (nothing to indent) falls through to
      // ProseMirror/browser default Tab handling instead of swallowing it.
      Tab: () => this.editor.commands.indent(),
      "Shift-Tab": () => this.editor.commands.outdent(),
    };
  },
});
