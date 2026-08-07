import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

type SuggestionState = { from: number; text: string } | null;

const autocompleteKey = new PluginKey<SuggestionState>("autocomplete");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    autocomplete: {
      /** Shows a ghost-text suggestion at `from`. */
      showSuggestion: (from: number, text: string) => ReturnType;
      /** Clears the active suggestion, if any. Returns false (no-op) if there isn't one. */
      hideSuggestion: () => ReturnType;
      /** Inserts the active suggestion at its position and clears it. Returns false (no-op) if there isn't one. */
      acceptSuggestion: () => ReturnType;
    };
  }
}

/**
 * Ghost-text autocomplete, rendered as a widget decoration (not real doc
 * content) so it's never part of the selection/undo history until accepted.
 * The suggestion is cleared by ANY doc change or selection move (see
 * `apply` below) — that's the stale-response guard: a suggestion fetched
 * for a since-abandoned cursor position can never render.
 */
export const Autocomplete = Extension.create({
  name: "autocomplete",

  addCommands() {
    return {
      showSuggestion:
        (from, text) =>
        ({ tr, dispatch }) => {
          dispatch?.(tr.setMeta(autocompleteKey, { from, text }));
          return true;
        },
      hideSuggestion:
        () =>
        ({ state, tr, dispatch }) => {
          if (!autocompleteKey.getState(state)) return false;
          dispatch?.(tr.setMeta(autocompleteKey, null));
          return true;
        },
      acceptSuggestion:
        () =>
        ({ state, tr, dispatch }) => {
          const suggestion = autocompleteKey.getState(state);
          if (!suggestion) return false;
          if (dispatch) {
            tr.insertText(suggestion.text, suggestion.from);
            const endPos = suggestion.from + suggestion.text.length;
            tr.setSelection(TextSelection.create(tr.doc, endPos));
            tr.setMeta(autocompleteKey, null);
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.acceptSuggestion(),
      Escape: () => this.editor.commands.hideSuggestion(),
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<SuggestionState>({
        key: autocompleteKey,
        state: {
          init: () => null,
          apply(tr, value) {
            const meta = tr.getMeta(autocompleteKey);
            if (meta !== undefined) return meta;
            if (tr.docChanged || tr.selectionSet) return null;
            return value;
          },
        },
        props: {
          decorations(state) {
            const suggestion = autocompleteKey.getState(state);
            if (!suggestion) return null;
            return DecorationSet.create(state.doc, [
              Decoration.widget(
                suggestion.from,
                () => {
                  const span = document.createElement("span");
                  span.className = "ai-ghost-text";
                  span.textContent = suggestion.text;
                  span.contentEditable = "false";
                  span.setAttribute("aria-hidden", "true");
                  return span;
                },
                { side: 1 },
              ),
            ]);
          },
        },
      }),
    ];
  },
});
