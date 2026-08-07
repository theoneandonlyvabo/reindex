import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

type FlashState = { from: number; to: number } | null;

const flashKey = new PluginKey<FlashState>("flashHighlight");
const FLASH_DURATION_MS = 1800;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    flashHighlight: {
      /** Briefly highlights a range — used to show the user where an AI tool just edited. */
      flashRange: (from: number, to: number) => ReturnType;
    };
  }
}

export const FlashHighlight = Extension.create({
  name: "flashHighlight",

  addCommands() {
    return {
      flashRange:
        (from, to) =>
        ({ tr, dispatch, view }) => {
          dispatch?.(tr.setMeta(flashKey, { from, to }));
          if (view) {
            setTimeout(() => {
              view.dispatch(view.state.tr.setMeta(flashKey, null));
            }, FLASH_DURATION_MS);
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<FlashState>({
        key: flashKey,
        state: {
          init: () => null,
          apply(tr, value) {
            const meta = tr.getMeta(flashKey);
            if (meta !== undefined) return meta;
            if (tr.docChanged && value) {
              return {
                from: tr.mapping.map(value.from),
                to: tr.mapping.map(value.to),
              };
            }
            return value;
          },
        },
        props: {
          decorations(state) {
            const range = flashKey.getState(state);
            if (!range || range.from >= range.to) return null;
            return DecorationSet.create(state.doc, [
              Decoration.inline(range.from, range.to, { class: "ai-flash" }),
            ]);
          },
        },
      }),
    ];
  },
});
