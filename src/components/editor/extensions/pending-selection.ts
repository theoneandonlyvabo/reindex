import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

type PendingSelectionState = { from: number; to: number } | null;

const pendingSelectionKey = new PluginKey<PendingSelectionState>(
  "pendingSelection",
);

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pendingSelection: {
      /**
       * Pins a visual highlight over a range independent of DOM focus/native
       * selection — the browser dims the real text selection the moment
       * focus leaves the contenteditable (e.g. clicking into the selection
       * toolbar's instruction input), so the selected-text-edit UI needs its
       * own focus-independent marker to stay visible through the request.
       */
      setPendingSelection: (from: number, to: number) => ReturnType;
      clearPendingSelection: () => ReturnType;
    };
  }
}

export const PendingSelection = Extension.create({
  name: "pendingSelection",

  addCommands() {
    return {
      setPendingSelection:
        (from, to) =>
        ({ tr, dispatch }) => {
          dispatch?.(tr.setMeta(pendingSelectionKey, { from, to }));
          return true;
        },
      clearPendingSelection:
        () =>
        ({ tr, dispatch }) => {
          dispatch?.(tr.setMeta(pendingSelectionKey, null));
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<PendingSelectionState>({
        key: pendingSelectionKey,
        state: {
          init: () => null,
          apply(tr, value) {
            const meta = tr.getMeta(pendingSelectionKey);
            if (meta !== undefined) return meta;
            // Auto-clear as part of the SAME transaction that collapses the
            // selection (e.g. clicking elsewhere in the doc) — clearing via
            // a separate `editor.commands` call from a "selectionUpdate"
            // listener would re-enter view.dispatch() while this
            // transaction is still being processed.
            if (tr.selectionSet && tr.selection.empty) return null;
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
            const range = pendingSelectionKey.getState(state);
            if (!range || range.from >= range.to) return null;
            return DecorationSet.create(state.doc, [
              Decoration.inline(range.from, range.to, {
                class: "ai-pending-selection",
              }),
            ]);
          },
        },
      }),
    ];
  },
});
