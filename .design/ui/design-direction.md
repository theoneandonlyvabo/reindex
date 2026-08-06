# Reindex AI — UI Design Direction

Reference point: Cursor, Google Antigravity, Claude.ai. Precision developer-tool
aesthetic, not a consumer SaaS aesthetic. Reindex AI is a writing tool for
people who already live in tools like these — the chrome around the document
should feel like the same species of software, not a generic dashboard
template.

## Scope: chrome vs. paper

Two different visual regimes coexist on purpose — don't collapse them into one:

- **The chrome** (toolbar, sidebar, dashboard, sign-in, title bar, every shadcn
  component) — this doc governs it. Modern-tech, neutral, precise.
- **The paper** (`.academic-doc` / `.doc-paper`, the actual document content) —
  stays TNR 12pt / justified / BAB-numbered per `MASTER_PROMPT.md`. It is
  *supposed* to look like a thesis, not a code editor. Don't tech-ify it.

The contrast between a precise dark-tool chrome and a plain academic white
page is itself part of the visual identity — the app gets out of the way of
the document.

## Palette

Neutral-first, one restrained accent, semantic color used sparingly:

- Base: near-black / near-white neutrals (the existing shadcn `oklch(... 0 0)`
  zero-chroma neutral scale is the right starting point — keep it, don't
  introduce a tinted gray).
- Accent: a single precise hue (Cursor/Antigravity lean cool-blue or
  violet-blue; Claude leans warm terracotta/rust). Pick **one**, use it for
  primary actions, active/selected states, and the agent's "thinking"
  affordances only — never as decoration.
- Dark-mode-first posture: design the dark theme first, verify light second.
  These tools all default to dark; light mode should feel like a deliberate
  second theme, not the primary one left to rot.
- Borders over blocks of color: prefer a 1px `border` in a neutral tone to
  separate regions (toolbar/sidebar/panels) over background-color blocking.
  This is the single biggest visual tell of this genre of tool.

## Typography

- UI chrome: keep Geist Sans (already wired via `next/font`) — it's the same
  register as Vercel/Linear/Cursor-adjacent tools. Don't add a second display
  typeface for the chrome.
- Monospace accent: use Geist Mono (already imported, currently unused
  outside the font variable) for things that are literally code/data-shaped —
  model names, token counts, file paths, keyboard shortcuts, citation IDs.
  A stray monospace tag or shortcut hint (`⌘K`-style) is a strong signal of
  this aesthetic; use it precisely, not everywhere.
- Sizes stay restrained: small, deliberate steps (12/13/14px body text is
  normal for this genre — bigger than that reads as "consumer app").

## Spacing & density

- Tighter than a typical marketing/dashboard template. Toolbar buttons,
  sidebar rows, list items: favor `h-7`/`h-8` control heights over `h-10`+.
  This is already the direction `radix-nova`'s `sm` sizes point toward — lean
  into `sm` as the default toolbar/chrome size, not `default`.
- Information density over whitespace-as-decoration. Generous padding is for
  the paper (it's a document); the chrome should feel efficient.

## Surfaces & elevation

- Borders, not shadows, are the primary separator between regions (toolbar
  bottom border, sidebar left border — both already in place). Reserve shadow
  for genuinely floating/overlay elements (dropdowns, popovers, the bubble
  menu coming in Phase 3) — shadcn's Radix-based popover/select defaults
  already do this correctly, don't fight them.
- The one deliberate exception is the paper itself (`.doc-paper`), which uses
  a soft shadow because it's meant to read as a physical sheet sitting on a
  canvas — that's intentionally the *opposite* register from the chrome
  around it, which is the point (see Scope above).
- Corner radius: small and consistent (`--radius: 0.625rem` scaled down via
  the existing `--radius-sm`/`--radius-md` tokens for compact controls).
  Avoid large/bubbly radii — that reads as consumer-app, not tool-app.

## Interaction & state

- Every interactive element needs a visible hover state and a pointer cursor
  (fixed globally in `globals.css`) — no dead-looking buttons.
- Focus states: a visible border/ring, never fully suppressed (accessibility
  floor — see `RequireAuth`/title-input pattern already in place: border
  appears on hover *and* focus, not just one).
- Keyboard-first affordances where it's cheap: the agent sidebar (Phase 2)
  should show its shortcut, autocomplete's Tab/Esc should feel exactly like
  Copilot's — instant, no animation lag getting in the way of typing.

## Motion

- Fast and functional, never decorative. 100–150ms transitions on
  hover/press states; nothing longer unless it's communicating a real state
  change (streaming text arriving, a tool call executing).
- No bounce/spring easing for chrome UI — linear or a fast ease-out. Springy
  motion is a consumer-app tell.

## Anti-patterns for this project specifically

- Don't add a second accent color "for variety" — one accent, used
  consistently, is what makes Cursor/Claude/Antigravity read as precise
  rather than decorated.
- Don't round the chrome to match the paper's softness, or vice versa — the
  contrast is intentional (see Scope).
- Don't add gradients, glassmorphism, or decorative illustration to the
  chrome. If the dashboard or sign-in page ever feels "empty," fix it with
  better type hierarchy and spacing, not with a hero graphic.

## Where this applies next

Phase 1's chrome (toolbar, title bar, dashboard, sign-in) currently uses
default shadcn styling and should be revisited against this doc as a
follow-up pass. Phase 2's sidebar agent (chat UI, tool-call chips, citation
cards) is the surface most worth getting right against this direction from
the start, since it's the most Cursor/Claude-adjacent UI in the product.
