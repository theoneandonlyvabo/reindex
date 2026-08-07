// CSS spec: 1in = 96px, 1in = 2.54cm — exact, not a runtime measurement.
// Mirrors the A4 + 2.54cm-margin geometry academic.css uses for print.
const CM_TO_PX = 96 / 2.54;

export const PAGE_WIDTH_PX = 21 * CM_TO_PX;
export const PAGE_HEIGHT_PX = 29.7 * CM_TO_PX;
export const PAGE_MARGIN_PX = 2.54 * CM_TO_PX; // ≈ 96px (1in)
export const PAGE_CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - PAGE_MARGIN_PX * 2;
// Purely visual breathing room between sheets on screen — not a physical measurement.
export const PAGE_GAP_PX = 32;
