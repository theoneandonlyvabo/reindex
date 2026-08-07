import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";
import {
  PAGE_CONTENT_HEIGHT_PX,
  PAGE_CONTENT_WIDTH_PX,
  PAGE_GAP_PX,
  PAGE_MARGIN_PX,
} from "@/lib/editor/pagination-geometry";

const paginationKey = new PluginKey<DecorationSet>("pagination");
const SPACER_CLASS = "page-break-spacer";

export type PaginationOptions = {
  onPageCountChange: (count: number) => void;
};

type BreakPoint = { pos: number; height: number };

/**
 * Simulated pagination: the document stays ONE continuous ProseMirror doc
 * (a real separate-editable-region-per-page architecture would break
 * cursor/selection/undo continuity) — this measures rendered block-node
 * positions and inserts spacer widgets that push content down at the
 * point it would overflow a page, so it LOOKS like separate A4 sheets.
 * The background page rectangles are rendered by React
 * (document-editor.tsx) based on the page count this reports.
 */
function computeBreaks(view: EditorView): { breaks: BreakPoint[]; pageCount: number } {
  const dom = view.dom as HTMLElement;
  const rect = dom.getBoundingClientRect();
  if (rect.width === 0) return { breaks: [], pageCount: 1 };

  // Derive the current effective zoom from measured vs. raw content width
  // instead of threading zoom state in — works regardless of what caused
  // the scaling (our zoom control, browser zoom, anything else), since
  // getBoundingClientRect() already reflects it.
  const effectiveZoom = rect.width / PAGE_CONTENT_WIDTH_PX;
  const containerTop = rect.top;

  const children = Array.from(dom.children) as HTMLElement[];
  const breaks: BreakPoint[] = [];
  let cumulativeSpacerHeight = 0;
  let pageIndex = 0;

  for (const el of children) {
    if (el.classList.contains(SPACER_CLASS)) {
      cumulativeSpacerHeight += el.getBoundingClientRect().height;
      continue;
    }

    const childRect = el.getBoundingClientRect();
    // "Natural" position (as if no spacers existed yet), converted back to
    // RAW/unzoomed units so it's directly comparable to
    // PAGE_CONTENT_HEIGHT_PX regardless of the current zoom level.
    const naturalTop =
      (childRect.top - containerTop - cumulativeSpacerHeight) / effectiveZoom;
    const naturalBottom =
      (childRect.bottom - containerTop - cumulativeSpacerHeight) / effectiveZoom;

    const pageContentBottom = (pageIndex + 1) * PAGE_CONTENT_HEIGHT_PX;

    if (naturalBottom > pageContentBottom && naturalTop < pageContentBottom) {
      const pos = view.posAtDOM(el, 0);
      const remaining = pageContentBottom - naturalTop;
      // Fill the rest of the current page's content area, its bottom
      // margin, the visual gap between sheets, and the next page's top
      // margin — all in raw units; the browser's own zoom on this
      // subtree scales the rendered spacer to match everything else.
      const height = remaining + PAGE_MARGIN_PX + PAGE_GAP_PX + PAGE_MARGIN_PX;
      breaks.push({ pos, height });
      pageIndex += 1;
    }
  }

  return { breaks, pageCount: pageIndex + 1 };
}

function breaksSignature(breaks: BreakPoint[]): string {
  return breaks.map((b) => `${b.pos}:${Math.round(b.height)}`).join("|");
}

export const Pagination = Extension.create<PaginationOptions>({
  name: "pagination",

  addOptions() {
    return {
      onPageCountChange: () => {},
    };
  },

  addProseMirrorPlugins() {
    const { onPageCountChange } = this.options;

    return [
      new Plugin<DecorationSet>({
        key: paginationKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(paginationKey);
            if (meta) return meta;
            return old.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return paginationKey.getState(state);
          },
        },
        view(editorView) {
          let rafId: number | null = null;
          let lastWidth = 0;
          let lastSignature = "";

          const recompute = () => {
            const { breaks, pageCount } = computeBreaks(editorView);
            onPageCountChange(pageCount);

            const signature = breaksSignature(breaks);
            if (signature === lastSignature) return; // nothing actually changed — skip the dispatch
            lastSignature = signature;

            const decorations = breaks.map(({ pos, height }) =>
              Decoration.widget(
                pos,
                () => {
                  const spacer = document.createElement("div");
                  spacer.className = SPACER_CLASS;
                  spacer.style.height = `${height}px`;
                  spacer.contentEditable = "false";
                  spacer.setAttribute("aria-hidden", "true");
                  return spacer;
                },
                { side: -1 },
              ),
            );

            const tr = editorView.state.tr.setMeta(
              paginationKey,
              DecorationSet.create(editorView.state.doc, decorations),
            );
            editorView.dispatch(tr);
          };

          const schedule = () => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
              rafId = null;
              recompute();
            });
          };

          // Width changes (zoom, window resize, sidebar/outline toggling
          // canvas width) need a recompute too — but our OWN spacer
          // inserts change this element's HEIGHT, which would otherwise
          // retrigger this same observer in a loop, so only react to
          // actual width changes.
          const resizeObserver = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width ?? 0;
            if (width === lastWidth) return;
            lastWidth = width;
            schedule();
          });
          resizeObserver.observe(editorView.dom);
          schedule();

          return {
            update(view, prevState) {
              if (!view.state.doc.eq(prevState.doc)) schedule();
            },
            destroy() {
              if (rafId !== null) cancelAnimationFrame(rafId);
              resizeObserver.disconnect();
            },
          };
        },
      }),
    ];
  },
});
