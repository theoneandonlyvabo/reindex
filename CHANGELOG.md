# Changelog

Auto-enforced by `.claude/hooks/changelog-check.sh` (Stop hook) — see CLAUDE.md > Changelog Policy. Grouped by day, newest day and newest entry on top.

## 2026-08-07

### 23:40
> "## Error Type\nRuntime Error\n\n## Error Message\nDatabase is closing/hidden\n... [Firebase IndexedDBLocalPersistence stack trace, thrown from setCurrentUser during sign-in] ... also : karena ini untuk lomba, kasih safety meassures deh EXPLICIT ERROR message kalo token abis blg sorry limit ai nya abis (maaf karena gratisan)"

- **Fix (root cause):** `src/lib/firebase.ts` — the earlier persistence fallback chain (17:05 entry) only protects `initializeAuth`'s one-time startup choice; it doesn't cover a runtime write failing on an already-open connection, which is what this crash actually was (thrown from `setCurrentUser` during sign-in, not from init). IndexedDB's connection can be closed out from under an in-flight write on tab-visibility races/multi-tab conflicts — a known upstream Firebase JS SDK fragility, not something our try/catch at init time could ever catch. Reordered the persistence chain to put `browserLocalPersistence` (localStorage, synchronous, no async-connection failure mode) first instead of `indexedDBLocalPersistence` — sidesteps the whole bug class rather than catching it after the fact. IndexedDB kept as a fallback for environments without localStorage
- **Adjust:** `src/lib/ai/error-message.ts` — `describeAiError()`'s 429/quota message rewritten to be explicit and apologetic per request ("Sorry — we've hit today's AI usage limit. This demo runs on a free-tier API key..."), since this is competition-facing. Already the single source of truth wired into chat, rewrite, and complete — no per-route changes needed. Autocomplete's client (`use-autocomplete.ts`) still discards this message and fails silently by design (a popup on every failed keystroke-triggered ghost-text request would be worse UX than no suggestion) — the explicit apology surfaces on the two visible/deliberate AI actions (sidebar chat, selection-toolbar rewrite), not the passive background one

---

### 23:10
> "oke checks passed, continue phase selanjutnya dulu" (Phase 4: inline autocomplete) + "[Image #7] ini ga sejajar garisnya, benerin" (toolbar/sidebar-header border misalignment)

- **New:** Phase 4 (inline autocomplete), checkpoint complete per the original plan:
  - `src/app/api/complete/route.ts` (51L) — Groq `llama-3.1-8b-instant` via `generateText`, deliberately a separate model/provider from the Gemini routes (latency budget, fires on every typing pause). Takes `{ context }` (caller-truncated to the preceding text), server also caps to last 2000 chars defensively. Same `checkRateLimit(token, "complete")` gate, same `describeAiError` 429/502 mapping as chat/rewrite
  - `src/components/editor/extensions/autocomplete.ts` (98L) — ghost text as a ProseMirror widget decoration (never real doc content until accepted, so it's outside selection/undo history). `showSuggestion`/`hideSuggestion`/`acceptSuggestion` commands; `Tab` accepts (explicitly re-positions the cursor after the inserted text via `TextSelection.create`, since default step-mapping bias could otherwise leave it before the insertion), `Escape` dismisses. The decoration plugin's own `apply(tr, value)` clears on ANY `docChanged`/`selectionSet` — that's the stale-suggestion guard, enforced at the transaction level rather than via an external listener
  - `src/hooks/use-autocomplete.ts` (54L) — debounced (350ms) trigger, wired into the *existing* `onUpdate` in `use-document-editor.ts` (not a second `editor.on("update", ...)` listener). Aborts a still-in-flight fetch when a newer one starts (`AbortController`); drops a response if the cursor has since moved or a newer request has started (`requestId` ref) — belt-and-suspenders with the abort, since a slow response could theoretically still resolve after being superseded
  - `.ai-ghost-text` CSS in `globals.css` — muted, `pointer-events: none`
  - Verified: `tsc`, `eslint`, `next build` all clean; `/api/complete` registered as a dynamic route alongside `/api/chat` and `/api/rewrite`
- **Fix (root cause):** `src/components/editor/toolbar.tsx` — the editor toolbar's bottom border sat lower than the sidebar header's, because the toolbar has ~17 controls and was `flex-wrap`, so it silently wrapped to 2 rows once the viewport narrowed with the sidebar open (the sidebar header is always 1 row). Changed to `flex-nowrap overflow-x-auto` — toolbar now stays a fixed single-row height and scrolls horizontally instead, guaranteeing both borders line up regardless of viewport width. The parent chain already had the `min-w-0` needed for the scroll to actually engage (`document-workspace.tsx`'s `min-w-0 flex-1 basis-[70%]` column), so no other layout change was needed

---

### 22:20
> "add ke backlog : onboarding screen (replace [Image #5]), beberapa page isinya hrs ngestate problem statement, bridging, "why use reindex?", showcase fature, and "get started"." + "[Image #6] why is the logo not centered? center it"

- **New:** `BACKLOG.md` — onboarding screen noted (not built): replace the bare `/` home page with problem statement → bridging → "why use Reindex?" → feature showcase → get-started CTA. Not scheduled, no code changes
- **Fix (root cause):** `src/app/sign-in/page.tsx` — logo sat flush-left in the card header despite `items-center`. shadcn's `CardHeader` (`src/components/ui/card.tsx`) is CSS Grid, not flexbox — `items-center` sets `align-items` (the grid's vertical axis), not horizontal centering. `CardTitle`/`CardDescription` only *looked* centered because they're full-width blocks with `text-center`; the logo `<Image>` has an explicit `width={40}`, so as a grid item with a definite size it defaulted to `justify-items: start`. Changed to `justify-items-center` (the correct grid property for centering items with an intrinsic size along the inline axis) — checked for the same `CardHeader className="items-center` pattern elsewhere in the codebase, this was the only instance

---

### 19:05
> "[Image #1] problem" (sidebar chat: "Something went wrong. An error occurred." after a `search_web` call) + "[Image #2] ini jg" (rewrite toolbar: "The AI request failed. Please try again.") + "fitur ini kalo misal kita abis select text kemudian pindah fokus ke prompt box nya, selectionnya ilang, we dont want that, bikin supaya terus ada selama ai ngeprompt even ampe output ai udh masuk. also enter icon nya gausah icon ai juga, dibikin icon arrow right aja." + [browser NotFoundError: removeChild] + "the popup ai prompter is also not working"

- **Fix (root cause, both error surfaces):** both bug reports traced to the same external cause — Google AI Studio's free-tier daily quota for `gemini-3.5-flash` (20 requests/day/model) exhausted from testing, confirmed via `429 RESOURCE_EXHAUSTED` in server logs. Not fixable in code, but a real bug rode along: both routes were swallowing the actual reason. `src/lib/ai/error-message.ts` (new, 9L) — `describeAiError()`, single source of truth distinguishing a 429/quota error from other failures. Wired into `app/api/chat/route.ts` (`toUIMessageStreamResponse({ onError: describeAiError })` — the AI SDK masks stream errors as generic "An error occurred." by default) and `app/api/rewrite/route.ts` (previously had zero error handling around `generateText`, so a provider failure became an opaque Next.js 500 — now caught, mapped to 429 or 502 with a real message). `selection-toolbar.tsx` updated to render the server's actual response text instead of a hardcoded string
- **New:** `src/components/editor/extensions/pending-selection.ts` (79L) — the native browser text-selection highlight dims/disappears the instant focus leaves the editor's contenteditable (e.g. clicking into the toolbar's instruction input, which also has `autoFocus`), so the requested "keep selection visible through the whole AI request" needed a focus-independent marker. Same ProseMirror-decoration pattern as the existing `FlashHighlight` extension: pinned on `Input`'s `onFocus`, cleared once the request settles. CSS in `globals.css` (`.ai-pending-selection`)
- **Fix (root cause):** the first version cleared the pin via an `editor.on("selectionUpdate", ...)` listener calling `editor.commands.clearPendingSelection()` — dispatching a new ProseMirror transaction from inside another transaction's own dispatch cycle. That re-entrant `view.dispatch()` is very likely what caused the `Uncaught NotFoundError: Failed to execute 'removeChild'` crash (tiptap's `BubbleMenu` detaches its DOM node into a tippy popper outside React's tree; a corrupted update cycle leaves React holding a stale reference) and the toolbar becoming non-functional afterward. Moved the auto-clear into the decoration plugin's own `apply(tr, value)` (`tr.selectionSet && tr.selection.empty → null`) — clears as part of the *same* transaction instead of a second one; the `useEffect`/listener in `selection-toolbar.tsx` was deleted entirely, not patched
- **Adjust:** `selection-toolbar.tsx` — submit button icon `Sparkles` → `ArrowRight` (kept `Sparkles` as the decorative left-side indicator; only the send/submit affordance changed, per "enter icon nya gausah icon ai juga")
- Verified: `tsc --noEmit` and `eslint` clean on all touched files. `next build` not re-run this turn (prior attempt was interrupted by the user mid-investigation) — worth a final build check before calling this settled

---

### 18:20
> "continue last plan from phase 3"

- **New:** `src/app/api/rewrite/route.ts` (39L) — Phase 3 (selected-text edit): non-streaming Gemini call taking `{ selectedText, instruction }`, returns `{ text }`. Same bearer-token + `checkRateLimit(token, "rewrite")` gate as `/api/chat` (the `rewrite` bucket was already provisioned in `convex/rateLimit.ts` back in Phase 2, unused until now)
- **New:** `src/components/editor/selection-toolbar.tsx` (99L) — floating instruction toolbar via TipTap's `BubbleMenu` (`shouldShow: !state.selection.empty`), shown on any non-empty text selection. Captures `{ from, to }` at submit time (not read live) so the applied range can't drift if the selection changes while the request is in flight. Applies the result as a single `insertContentAt({from, to}, replacement)` transaction — one Ctrl+Z undoes it
- **Adjust:** `src/lib/ai/prompts.ts` — added `rewriteSystemPrompt()` (plain-text-only replacement, matches source language/register)
- **Adjust:** `src/components/editor/document-editor.tsx` — mounted `<SelectionToolbar editor={editor} />` next to `EditorContent`
- Verified: `tsc --noEmit` and `next build` both clean, `/api/rewrite` registered as a dynamic route, correctly rejects unauthenticated `POST` with 401 against the running dev server. No Chrome extension connected this session, so the full signed-in click-through (select text → instruction → replacement applied) was not exercised in-browser — flagging this rather than claiming it, since it's the one thing build/typecheck can't confirm

---

### 17:50
> "logo reindexnya centered, 'Google OAUTH' button tambahin logo google nya, bikin tombol show password" + "add '+' icon on New Draft, Sign out should just be an icon no text." + "dashboard reindex should look like this, tapi sesuain ke color palette dan style design current, ambil komposisi dan komponen dari screenshot gw aja" (Google Docs homepage reference) + "section ini boxnya dibikin 1:1.75 aja potrait jgn landscape"

- **Adjust:** `sign-in/page.tsx` — logo centered in card header; Google button gets the real 4-color "G" mark (inline SVG); password field gets a show/hide toggle (`Eye`/`EyeOff`, `field-sizing` untouched)
- **Adjust:** `dashboard/page.tsx` — rebuilt following the Google-Docs-homepage composition the user referenced (top bar with logo/search/sign-out, "Start a new draft" card, "Recent documents" grid), reskinned to the app's own warm palette and 2px-radius sharp style rather than copying Google's look. Search filters client-side by title. Document cards are portrait-oriented grid tiles instead of the old stacked list; "New draft" got a `Plus` icon, "Sign out" is now icon-only
- Caught my own mistake mid-edit: initially used `rounded-full` on the new search input, which directly contradicts the earlier "every radius is exactly 2px" instruction — fixed before it shipped

---

### 17:18
> "kok logo reindex ada bg putihnya? kan png log knp bs ada putihnya"

- **Fix:** `public/reindex-logo.png` — the previous rasterization (macOS `qlmanage` thumbnail generator) baked an opaque white backdrop into the PNG despite it having an alpha channel (confirmed via pixel check: corner alpha was 255, not 0) — QuickLook's thumbnailer composites onto white by design, it doesn't preserve source transparency. Re-rendered via headless Chrome (`--default-background-color=00000000`, native 1080×1080 to avoid clipping), then cropped to content and resized to 512×512 with Pillow. Corner alpha now 0; no code changes needed since it's the same filename in `public/`

---

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
