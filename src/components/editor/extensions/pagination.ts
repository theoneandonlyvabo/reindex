import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";
import {
  PAGE_CONTENT_HEIGHT_PX,
  PAGE_GAP_PX,
  PAGE_HEIGHT_PX,
  PAGE_MARGIN_PX,
  PAGE_WIDTH_PX,
} from "@/lib/editor/pagination-geometry";

const paginationKey = new PluginKey<DecorationSet>("pagination");
const SPACER_CLASS = "page-break-spacer";
const PAGE_BG_LAYER_CLASS = "doc-page-bg-layer";

type BreakPoint = { pos: number; height: number };

/**
 * Simulated pagination: the document stays ONE continuous ProseMirror doc
 * (a real separate-editable-region-per-page architecture would break
 * cursor/selection/undo continuity) — this measures rendered block-node
 * positions and inserts spacer widgets that push content down at the
 * point it would overflow a page, so it LOOKS like separate A4 sheets.
 *
 * The background page rectangles are ALSO decorations from this same
 * measurement pass — not separately-tracked React state updated via a
 * callback. Two systems that have to stay in sync through different
 * update paths (a rAF-deferred DOM measurement vs. React's render cycle)
 * is exactly the kind of gap where timing races hide; keeping everything
 * in one DecorationSet, dispatched atomically, removes that whole class
 * of bug.
 */
function computeDecorations(view: EditorView): Decoration[] {
  const dom = view.dom as HTMLElement;
  // .ProseMirror -> .doc-paper -> .doc-page-frame. Measuring the frame
  // (plainly `width: 21cm` in CSS, no padding/box-sizing to account for)
  // instead of .ProseMirror's own content-box width is more robust —
  // fewer assumptions have to hold for the derived zoom to be right.
  const frame = dom.parentElement?.parentElement;
  if (!frame) return [];

  const frameRect = frame.getBoundingClientRect();
  if (frameRect.width === 0) return [];

  // Derive the current effective zoom from measured vs. raw frame width
  // instead of threading zoom state in — works regardless of what caused
  // the scaling (our zoom control, browser zoom, anything else).
  const effectiveZoom = frameRect.width / PAGE_WIDTH_PX;
  const containerTop = dom.getBoundingClientRect().top;

  // Position each top-level node via the DOCUMENT MODEL, not
  // view.posAtDOM(el, 0) — posAtDOM is ambiguous about whether it returns
  // the position before a block node or inside it (at its first
  // character); getting that wrong would place the spacer widget INSIDE
  // the paragraph's DOM rather than as a sibling, breaking every
  // subsequent measurement pass silently. Node.forEach's offset is exactly
  // "the absolute doc position right before this top-level node" — no
  // DOM-offset ambiguity.
  const topLevelPositions: number[] = [];
  view.state.doc.forEach((_node, offset) => {
    topLevelPositions.push(offset);
  });

  const allChildren = Array.from(dom.children) as HTMLElement[];
  const breaks: BreakPoint[] = [];
  let cumulativeSpacerHeight = 0;
  let pageIndex = 0;
  let contentIndex = 0;

  for (const el of allChildren) {
    if (el.classList.contains(SPACER_CLASS) || el.classList.contains(PAGE_BG_LAYER_CLASS)) {
      if (el.classList.contains(SPACER_CLASS)) {
        cumulativeSpacerHeight += el.getBoundingClientRect().height;
      }
      continue;
    }

    const pos = topLevelPositions[contentIndex];
    contentIndex += 1;
    if (pos === undefined) continue; // count mismatch safety guard — skip rather than mis-break

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
      const remaining = Math.max(0, pageContentBottom - naturalTop);
      // Fill the rest of the current page's content area, its bottom
      // margin, the visual gap between sheets, and the next page's top
      // margin — all in raw units; the browser's own zoom on this
      // subtree scales the rendered spacer to match everything else.
      const height = remaining + PAGE_MARGIN_PX + PAGE_GAP_PX + PAGE_MARGIN_PX;
      breaks.push({ pos, height });
      pageIndex += 1;
    }
  }

  const pageCount = pageIndex + 1;

  const decorations: Decoration[] = [
    // Single widget holding all `pageCount` white A4 sheet rectangles,
    // positioned at doc position 0. ProseMirror's own base CSS sets
    // `.ProseMirror { position: relative }` — since this widget renders
    // AS A CHILD of .ProseMirror, that makes .ProseMirror (not
    // .doc-page-frame) the nearest positioned ancestor, so `inset: 0`
    // resolves against .ProseMirror's narrow content box (inside
    // .doc-paper's padding), not the full page. Escaping that with
    // negative offsets equal to the padding, landing flush with
    // .doc-page-frame's actual edges instead.
    Decoration.widget(
      0,
      () => {
        const layer = document.createElement("div");
        layer.className = PAGE_BG_LAYER_CLASS;
        layer.style.position = "absolute";
        layer.style.top = `-${PAGE_MARGIN_PX}px`;
        layer.style.left = `-${PAGE_MARGIN_PX}px`;
        layer.style.width = `${PAGE_WIDTH_PX}px`;
        layer.style.zIndex = "-1";
        layer.style.pointerEvents = "none";
        layer.contentEditable = "false";
        layer.setAttribute("aria-hidden", "true");
        for (let i = 0; i < pageCount; i += 1) {
          const sheet = document.createElement("div");
          sheet.className = "doc-page-bg";
          sheet.style.top = `${i * (PAGE_HEIGHT_PX + PAGE_GAP_PX)}px`;
          sheet.style.height = `${PAGE_HEIGHT_PX}px`;
          layer.appendChild(sheet);
        }
        return layer;
      },
      { side: -1, key: `page-bg-${pageCount}` },
    ),
    ...breaks.map(({ pos, height }) =>
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
        { side: -1, key: `page-spacer-${pos}-${Math.round(height)}` },
      ),
    ),
  ];

  return decorations;
}

export const Pagination = Extension.create({
  name: "pagination",

  addProseMirrorPlugins() {
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

          const recompute = () => {
            const decorations = computeDecorations(editorView);
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
          // canvas width) need a recompute too — but our OWN spacer/bg
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
