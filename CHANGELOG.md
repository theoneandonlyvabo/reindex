# Changelog

Auto-enforced by `.claude/hooks/changelog-check.sh` (Stop hook) — see CLAUDE.md > Changelog Policy. Grouped by day, newest day and newest entry on top.

## 2026-08-07

### 17:10
> "ubah semua icon svg reindex jd png aja, quality lbh oke, also diatas kiri (samping kiri judul dokumen tambahin logo reindex yg kalo diclick balik ke home page"

- **New:** `public/reindex-logo.png` (512×512, rasterized from the source SVG via macOS `qlmanage` — no new dependency). All 6 logo usages (favicon, home hero, sign-in header, sidebar message/thinking icons, sidebar header) switched from `.svg` to `.png`
- **New:** `document-editor.tsx` — logo added left of the document title, wrapped in a `next/link` back to `/`

---

### 17:05
> Batch of QC/branding/bugfix requests: border-radius→2px, markdown rendering in chat, official logo as favicon/logo/sidebar icon, prettier error state with sad-face icon, warm color theme (iterated to an exact reference swatch #f7f3e6), Firebase Auth "Database is closing/hidden" crash, sidebar padding, document-title input clipping, timestamps on user chat messages.

- **New:** `src/app/globals.css` — all 7 theme radius vars flattened to `2px` (was a calc-derived scale); single point of control, no component files touched
- **New:** `react-markdown` + `remark-gfm`, `src/components/editor/chat-markdown.tsx` — agent replies were showing raw `**bold**`/no line breaks; now parsed into real elements. Applies to agent text + search_web answers only, not user messages
- **New:** `public/reindex-logo.svg` (official logo, user-supplied) wired as: favicon (`layout.tsx` metadata.icons, replacing default `favicon.ico`), home page hero, sign-in card header, AI sidebar message/thinking icons and header — all via `next/image` with `unoptimized` (SVG, no raster benefit)
- **Fix:** `ai-sidebar.tsx` error state — was a bare "An error occurred" box; redesigned with a `Frown` icon, friendly copy, and the actual error message. Root cause of the error itself (separate from the UI): Gemini quota exhaustion from heavy same-day testing — external/account-level, not a code bug
- **Adjust:** `globals.css` color palette — iterated warm-tone request twice: first pass (hue 55-65) still read pink per feedback; final pass anchors on the user's exact reference swatch `#f7f3e6` (computed to `oklch(0.964 0.018 92.7)`), hue ~75-90 across all tokens, both themes. `.doc-paper`/`.academic-doc` in `academic.css` explicitly hardcoded to pure neutral (not `var(--card)`/`var(--foreground)`) so the paper stays exempt as requested
- **Fix:** `src/lib/firebase.ts` — Firebase Auth's default IndexedDB persistence can throw "Database is closing/hidden" on tab-visibility races with no fallback (known upstream SDK issue). Switched to `initializeAuth` with an explicit persistence fallback chain (indexedDB → browserLocal → inMemory), guarded against Fast-Refresh re-init
- **Fix:** `document-editor.tsx` — title `<input>` used `w-fit`, which doesn't work on inputs (they don't shrink-wrap to value content) — titles were clipping instead of growing. Switched to `field-sizing: content`
- **Adjust:** sidebar padding increased (`px-4 py-3`→`px-5 py-5`, input row `p-3`→`p-4`); user chat messages now show a send-time timestamp, captured in the send handler (not render/effect — avoided two rounds of React Compiler purity lint errors, `Date.now()`/setState are impure in render or effect bodies)

<!-- Format:
## YYYY-MM-DD

### HH:MM
> "exact user prompt, verbatim"

- **New:** ...
- **Fix:** ...
- **Adjust:** ...

---
-->

## 2026-08-07

### 14:55
> "change semua border radius jadi ONLY 2px, nothing else (gw mau sharp look gitu)" + mid-turn: "[Image #10] generated text output di chatbot optimize dong formatingnya, jangan jadiin semuanya 1 block gini susah dibaca, pake property real yang semua chatbot gunakan (enter, pointers, no "** **", etc)"

- **Adjust:** `src/app/globals.css` — all 7 theme radius variables (`--radius-sm` through `--radius-4xl`) and base `--radius` flattened to `2px` (were a calc-derived scale off a 0.625rem base). Single point of control: every `rounded-*` utility app-wide, including shadcn's `rounded-[min(var(--radius-md),Npx)]` expressions in button/toggle/select, resolves through these — no component files touched
- **New:** `react-markdown@10.1.0` + `remark-gfm@4.0.1`, `src/components/editor/chat-markdown.tsx` — agent chat responses were rendering raw markdown (`**bold**` shown literally, no real line breaks/bullets) since the sidebar just dumped `part.text`/`output.answer` into a plain `<p>`. Now parsed into real elements (bold, lists, links, paragraphs) with compact styling matching the sidebar's text scale. User messages intentionally still render as plain text (no reason to markdown-parse what a person typed)

---

### 14:41
> "ubah default texts reindex dari bahasa indo jadi bahasa inggris"

- **Adjust:** all default/UI copy switched Indonesian → English across `app/{page,layout,sign-in,dashboard,doc/[id]}`, `components/{auth/require-auth,editor/{document-editor,toolbar,ai-sidebar}}`, `lib/{ai/prompts,editor/{apply-edit,serialize}}`, `hooks/use-document-editor`, `app/api/chat/route.ts` (tool descriptions + 429 message + Perplexity prompt), `convex/documents.ts` (default title) — covers UI labels/placeholders/errors, the AI system prompt, and tool-call messages shown in the sidebar
- **Adjust:** `app/dashboard/page.tsx` — date formatter locale `id-ID` → `en-US` to match

---

### 14:16
> "QC lagi. (1) spacing di agent sidebar masih kacau, gabisa bedain antara mana prompt user dan hasil generation ai. (2) ini pertanyaan sih, kyk penanda perubahan (diff) memang blm diimplement apa kita drop? Karena tadi pas gw prompt dia lgsg nulis aja, tanpa mikirin apapun. (3) masih ada korelasi dgn poin 2, ai agent hanya nulis text tanpa mikir indentasi, page break, dan lain-lain padahal seharusnya lebih aware."

- **Fix:** `src/components/editor/ai-sidebar.tsx` — user vs agent turns were indistinguishable (same layout, same spacing for every part). User messages now render as a right-aligned bubble (icon + compact pill); agent turns stay left-aligned with icon + stacked parts; gap between different message turns increased (`space-y-4`→`space-y-5`) while keeping parts within one turn tight
- **Fix (root cause, item 3):** `src/lib/editor/apply-edit.ts` — `insert_text` inserted a raw string via `insertContentAt`, which glues onto whatever's at that position with no paragraph boundary — that's why AI-inserted text looked structure-blind. Now always inserts a proper `paragraph` node, inheriting the document's real paragraph formatting; `src/app/api/chat/route.ts` — tool description updated so the model uses `replace_text` (not `insert_text`) for anything that isn't a whole new paragraph
- **New:** `src/components/editor/extensions/flash-highlight.ts` — a TipTap extension that briefly highlights the range an AI tool just touched (CSS keyframe fade, ~1.8s), wired into all three edit tools in `apply-edit.ts`. Answers item 2's underlying want (some visible signal of what changed) without building a full diff/accept-reject review UI — see response for scoping on that
- **Adjust:** `src/hooks/use-document-editor.ts` — registered `FlashHighlight` extension

---

### 13:42
> "lets QC. (1) Margin on paper masih acak2an bgt, default should be 1 inch from edge (vertically and horizontally), paper should be real paper size (A4, Letter, etc). (2) [Image #8] thought processs should not be directly visible, diminimze dulu aja by default dan user harus tau kalo ai lagi mikir, either tambah animasi laoading or something (saran: breathing animation di "Reindex Agnet is thinking". (3) Add more icons to each components, skrg msh plain bgt apalagi di AI sidebar. (4) Noticable bug: prompt pertama berhasil dan menulis ke kertas, prompt kedua jg masih bs dijawab, ketika masuk ke prompt ketiga udh ngaco dan ga ada output sama sekali."

- **Fix:** `src/styles/academic.css` — paper margin was the asymmetric 3-3-3-4cm skripsi-binding convention from the original placeholder guess; user wants uniform, changed `.doc-paper` padding and `@page` margin to `2.54cm` (1in) on all sides, screen and print both
- **Fix (root cause, item 4):** server logs showed `AI_RetryError: Failed after 3 attempts... This model is currently experiencing high demand` on later turns of a conversation — but the sidebar had no rendering at all for `status === "error"`, so a failed request just showed nothing. Added an error state with the actual message and a "Coba lagi" retry button (`regenerate()`); bumped `maxDuration` 30→60 since legitimate multi-step responses were already taking 10-15s before any retries
- **Adjust:** `src/components/editor/ai-sidebar.tsx` — `search_web` results now collapse behind a `<details>`/`<summary>` disclosure by default (was a full research dump inline); "Reindex Agent sedang berpikir..." now only shows before the assistant's first visible content (not for the whole request lifetime) and uses `animate-pulse` instead of static text
- **Adjust:** `src/components/editor/ai-sidebar.tsx` — added icons throughout: role icons (user/agent) per message, tool-specific icons per edit chip (insert/replace/format), search icon on the research disclosure

---

### 13:24
> "[Image #6] not working at all, debug first and report to me"

- **Fix:** `src/app/api/chat/route.ts` — sidebar sent messages but never responded; server logs showed `AI_APICallError: This model models/gemini-2.5-flash is no longer available to new users`. Verified against the live API (not just the models-list endpoint, which still lists it) that this key can't call it, tested working alternatives, switched to `gemini-3.5-flash` (stable, non-preview, confirmed working). Also confirmed Perplexity's `sonar` (used by `search_web`, not yet exercised) still works — no change needed there.

---

### 01:38
> "okay continue for now"

- **New:** `convex/rateLimit.ts` (26L) — `@convex-dev/rate-limiter` token-bucket limits for `chat`/`rewrite`/`complete` (only `chat` used this phase; the other two are ready for Phase 3/4), keyed by authenticated user
- **New:** `src/lib/ai/rate-limit.ts` (37L) — Next.js-side `checkRateLimit`, calls the Convex mutation via `ConvexHttpClient.setAuth(idToken)` so Convex verifies the Firebase token itself (same trust as the client SDK) rather than duplicating JWT verification in Next.js
- **New:** `src/lib/editor/{text-index,serialize,apply-edit}.ts` (61L/32L/77L) — PM-doc↔plain-text mapping so AI tools address content by verbatim substring, doc→markdown-ish serialization for model context, and tool-input→TipTap-command application (`insert_text`/`replace_text`/`format_text`)
- **New:** `src/lib/ai/prompts.ts` (32L) — sidebar agent system prompt (verbatim-find rule, cite-before-claiming rule)
- **New:** `src/app/api/chat/route.ts` (101L) — Gemini Flash via `streamText`, 3 client-executed edit tools (no `execute`, handled by the sidebar's `onToolCall`) + 1 server-executed `search_web` tool (Perplexity Sonar via `@ai-sdk/perplexity`)
- **New:** `src/components/editor/ai-sidebar.tsx` (270L) — chat UI, `useChat` + `onToolCall`/`addToolOutput`, renders tool-call chips and citation links
- **New:** `src/hooks/use-document-editor.ts` (61L), `src/components/editor/document-workspace.tsx` (52L) — lifted the TipTap `editor` instance out of `document-editor.tsx` (now purely presentational, 38L) so the sidebar (and Phase 3/4 later) share the same live instance instead of each wiring its own
- **Fix:** `src/lib/ai/rate-limit.ts`, `src/app/api/chat/route.ts` — an invalid/expired bearer token was an uncaught throw → hard 500; now caught and returned as a clean 401 (found via smoke test with a bogus token)
- **Fix:** `src/hooks/use-debounced-callback.ts` — `ref.current` was written directly during render, which `eslint-plugin-react-hooks`' new `react-hooks/refs` rule (relevant given `reactCompiler: true`) flags as a hard error; moved into a bare `useEffect`
- **Adjust:** `convex/auth.config.ts` — anonymous default export → named `authConfig` (lint warning cleanup, no behavior change)

---

### 00:53
> "QC lagi, (1) sidebar agent harusnya GAK BISA DISCROLL (currently msh bs discroll), (2) Cursor in page HARUSNYA GAK BERADA DALEM BOX (liat gambar [Image #4], harusnya kyk [Image #5] *lgsg cursor, bukan ada box boundary nya dulu*), (3) UI wise, bikin lebih modern-tech vibe (cursor, antigravity, claude, paham kan?) bikinin design instruction file under .design/ui/(bikin .md file baru disini, isinya jelasin arah visual design ui yg gw mau). (4) H1, H2, H3 button harusnya dropdown, dan ada state 'Normal Text'. (5) ketika scorlling, yang bergerak HANYA PAPER PAGE NYA, tidak yang lain (ngaruh ke poin pertama, top toolbar jg seharusnya gak scrollable). (6) 'Asisten AI' ubah jadi Reindex Agent. (7) Judul dokumen dibuat lebih besar, dan hover state nya buatin border untuk contain si judul ini. (8) ubah semua interactable / hoverable component munculin cursor jari."

- **Fix:** `app/layout.tsx` — `body` changed `min-h-full` (a floor, content could still grow past viewport) → `h-full overflow-hidden` (a hard cap), which was the actual root cause of the whole page scrolling together instead of just the paper (issues 1, 5)
- **Fix:** `app/doc/[id]/page.tsx`, `components/editor/document-editor.tsx` (`.doc-canvas`) — added `min-h-0` at each column-direction flex boundary so `overflow-auto`/`overflow-hidden` actually clip instead of the flexbox min-height:auto bug forcing content-sized growth; toolbar/title bar are structural siblings of the scroll region, so they were already correctly non-scrolling once this was fixed
- **Fix:** `app/page.tsx`, `sign-in/page.tsx`, `dashboard/page.tsx` — since body no longer scrolls globally, each top-level page now owns its own `overflow-y-auto min-h-0` region (dashboard's document list would otherwise get silently clipped instead of scrolling)
- **Fix:** `src/styles/academic.css` — added `.ProseMirror { outline: none }`; the browser's default contenteditable focus outline was hugging the empty first line, rendering as a small floating box instead of a plain cursor
- **New:** `.design/ui/design-direction.md` — modern-tech chrome direction (Cursor/Antigravity/Claude reference), explicitly scoped to the app chrome only — the academic paper itself stays out of scope by design
- **Adjust:** `components/editor/toolbar.tsx` — H1/H2/H3 toggle buttons replaced with one shadcn `Select` (`components/ui/select.tsx` added) showing current block state including "Normal text"
- **Adjust:** `app/doc/[id]/page.tsx` — "Asisten AI" → "Reindex Agent"
- **Adjust:** `components/editor/document-editor.tsx` — title input enlarged (`text-lg` → `text-2xl`) with a border that appears on hover/focus instead of no boundary at all
- **Adjust:** `app/globals.css` — restored `cursor: pointer` on buttons/links/labels/select (Tailwind's preflight resets buttons to `cursor: default`)

---

### 00:36
> "oke clear, gw mau half-way sane check dulu untuk QC phase ini. gw gatau ini udh kesentuh apa blm tapi ada bbrp bug : (1) paper (page) ga keliatan di layar, nyatu sama background. (2) gw gatau current indentasi yg keselect untuk suatu body text yg mana, jd cm kek applier (harusnya kita jg tau si text indent kemana. (3) page margin masih ngasal, gada boundary kanan kiri / atas bawah, seperti masalah 1. toolbar masih kurang lengkap (liat gambar ini, ini toolbar Google Docs, harusnya bare minimum itu segini. [Image #3]). KALAU (KALAU) dari QC gw skrg ini sebenernya emg blm keimplement abaikan aja, else taro ini jadi masukan untuk next phases (masukin issue yg gw state ke phase accoridingly)."

- **Fix:** `src/styles/academic.css` — added `.doc-paper`/`.doc-canvas` classes: paper now renders as a white/card A4-width sheet with the same 3-3-3-4cm margins as the print `@page` rule, on a `bg-muted` canvas so it's no longer flush with the app background (issues 1 and 3)
- **Fix:** `src/components/editor/document-editor.tsx` — wired the new classes; removed print-only `padding`/`background`/`shadow` reset so the on-screen paper margins don't stack on top of `@page`'s print margins
- **Fix:** `src/styles/academic.css` — removed the blanket unrequested `text-indent: 1.25cm` on every paragraph (was silent/uncontrollable, contributing to issue 2's confusion); no auto-indent until real indent controls exist
- **Adjust:** Backlogged, not fixed this turn (never in Phase 1's scoped toolbar — headings/bold/italic/underline/lists/align/link/image only): adjustable per-paragraph indent controls with visible current-state feedback (issue 2), and full toolbar parity with Google Docs baseline (font family/size, paragraph-style dropdown, text/highlight color, line-spacing, checklist, indent buttons, clear-formatting, overflow menu)

---

### 00:24
> "Got in, typed, reloaded, crashed : ## Error Type\nRuntime Error\n\n## Error Message\n[CONVEX Q(documents:get)] [Request ID: 2b2fb51a16e5d535] Server Error\nUncaught Error: User not found — call ensureUser first\n    at requireUser (../../convex/model/auth.ts:27:9)\n    at async requireDocument (../../convex/model/auth.ts:41:7)\n    at async handler (../convex/documents.ts:25:31)\n\n  Called by client\n\n\n    at requireUser (../../convex/model/auth.ts:27:9)\n    at async requireDocument (../../convex/model/auth.ts:41:7)\n    at async handler (../convex/documents.ts:25:31)\n    [stack trace truncated — full trace was Next.js/Convex/React internals from the browser error overlay]\n\nNext.js version: 16.2.12 (Turbopack)"

- **Fix:** `convex/model/auth.ts` — page reload crashed with "User not found" because `documents.get` (a query) threw when the `ensureUser` mutation (fired async from a client effect) hadn't landed yet. Split `requireUser`/`requireDocument` (throwing, for mutations) from new non-throwing `getAuthenticatedUser`/`getOwnedDocument` (for queries) so a missing user row degrades to `null` instead of an uncaught error — Convex reactively reruns the query once `ensureUser` commits, since it reads the same index
- **Adjust:** `convex/documents.ts` `list`/`get`, `convex/documentFiles.ts` `listForDocument` — switched to the non-throwing helpers; `app/doc/[id]/page.tsx` — handle `doc === null` distinctly from `doc === undefined` (loading)

---

### 00:01
> "go!"

- **New:** `convex/schema.ts` (25L), `auth.config.ts` (8L), `convex.config.ts` (7L, mounts `@convex-dev/rate-limiter`), `model/auth.ts` (46L, `requireUser`/`requireDocument` — the single ownership-check chokepoint), `users.ts` (34L, `ensureUser` upsert), `documents.ts` (77L, CRUD), `documentFiles.ts` (42L, upload/attach)
- **New:** `src/lib/firebase.ts` (18L), `hooks/use-firebase-auth.ts` (37L), `hooks/use-debounced-callback.ts` (28L), `components/providers/{convex-client-provider,auth-bootstrap}.tsx` (20L/22L), `components/auth/require-auth.tsx` (26L)
- **New:** `app/sign-in/page.tsx` (143L, Google + email/password), `app/dashboard/page.tsx` (107L), `app/doc/[id]/page.tsx` (69L, editor 70% + sidebar shell 30%), `components/editor/{document-editor,toolbar}.tsx` (73L/243L), `styles/academic.css` (71L, TNR 12pt/1.5/justify + BAB counters + `@page` print)
- **New:** `.env.example` (29L, var names only)
- **Adjust:** `package.json` — `next`/`eslint-config-next` downgraded and pinned exact to `16.2.12` (MASTER_PROMPT forbids 16.3.0); added tiptap 2.27.2, `ai`@7 + `@ai-sdk/{google,groq,perplexity,react}`@4, `@convex-dev/rate-limiter`, shadcn/ui (Radix base, not the new Base UI default), zustand, next-themes, lucide-react
- **Adjust:** `app/layout.tsx` metadata + academic.css import; `app/page.tsx` replaced default scaffold; `app/globals.css` fixed circular `--font-sans` var shadcn's init left broken
- **Adjust:** `.claude/settings.json` — wired `vision-check.sh` as a second Stop hook (was written but never registered); `vision-check.sh` — its own `exit 1` fixed to `exit 2` (only 2 blocks a turn, so the hook was a no-op)
- **Fix:** disk was at 100% (132MiB free), blocking all npm installs — cleared 6.7GB `~/.npm` cache (user-approved)
- **Fix:** removed stray `@base-ui/react` dep left by an aborted shadcn init attempt before the disk-space fix

---

## 2026-08-05

### 01:06
> "adjust struktur penulisan CHANGELOG.md dong, susah bgt bacanya. fix supaya tiap timeframe ketawan apa yg terjadi dan bisa bedain yg mana yg sebelumnya dan yg current. kasih clear distinction tentang apa yg berubah dan buat supaya mudah dibaca mata manusia, tidak hanya agent ai"

- **Adjust:** `CHANGELOG.md` restructured — day headers grouping same-day entries, prompts as blockquotes, summaries as tagged bullets (New/Fix/Adjust) instead of one dense paragraph, `---` between entries
- **Adjust:** `CLAUDE.md` policy section rewritten to match the new format template

---

### 01:04
> "pindahin changelog.md ke root, naming yg best practice changelog.md atau CHANGELOG.md? adjust ya."

- **Fix:** `.claude/hooks/changelog-check.sh` repointed check from `.claude/changelog.md` to root `CHANGELOG.md` (uppercase, standard convention; file was already moved to root)
- **Adjust:** `CLAUDE.md` policy text + this file's header note updated to match the new path

---

### 00:58
> "okay listen, gw mau lu buatin claude workflow di folder .claude . gw mau tiap kali ada perubahan atau apapun sedikit adjustment pun DITAMBAHKAN ke changelog.md, changelog.md pun harus berisi apa yang user prompt 1:1 copy (rewrite exact user prompt) dan tambahin summary apa yang lu lakuin di codebase (how many lines, diff, new stuff, adjustment, fixes, semuanya) sesimple mungkin. karena gw antisipasi bakal ada banyak tambahan di changelog.md jd usahain tiap kali output log baru sesingkat mungkin, jangan terlalu yapping. buatin workflow ini ke .claude (itu udh ada tapi sempurnain aja). ask questions if uncertain"

- **New:** `.claude/settings.json` (15L, wires Stop hook); `.claude/changelog.md` (this file, later moved to root)
- **Fix:** `.claude/hooks/changelog-check.sh` (33L) — was unwired, checked wrong path (`CHANGELOG.md`/`logs/`), and `git status` without `--untracked-files=all` collapsed untracked `.claude/` into one line so per-file checks never matched
- **Adjust:** `CLAUDE.md` +12L — added Changelog Policy section (`AGENTS.md` is auto-regenerated by `next dev`, can't hold custom policy)

---
