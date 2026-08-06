@AGENTS.md
@MASTER_PROMPT.md

## Product Alignment

`MASTER_PROMPT.md` bukan cuma referensi teknis — bagian "Apa produk ini", "Kenapa produk ini dibuat", dan "Keputusan yang sudah diambil" itu inti dari kenapa produk ini bentuknya kayak sekarang. Sebelum bikin keputusan yang nggak eksplisit ditulis di sana (nama tool baru, pendekatan implementasi yang beda dari yang dicontohin, fitur tambahan kecil), cek dulu apa itu align sama arah yang udah ditentuin — bukan cuma "apakah ini secara teknis bisa jalan".

Dua kasus yang paling gampang salah arah:

- **Nyimpang dari positioning.** Produk ini spesifik buat academic writing (mahasiswa/peneliti, prioritas ke akurasi sitasi), bukan general-purpose writing tool. Kalau ada keputusan kecil yang bikin produk kerasa lebih generic (microcopy, default behavior, prioritas fitur), itu nyimpang dari positioning meskipun secara teknis nggak salah.

- **Reintroduce sesuatu yang udah ditolak.** Liveblocks, Yjs, Clerk, Convex Auth, react-icons, vector search — semua itu udah dipertimbangkan dan sengaja nggak dipakai (lihat alasannya di `MASTER_PROMPT.md`). Kalau ada pendekatan yang diam-diam butuh salah satu dari ini balik, itu tanda perlu berhenti dan konfirmasi, bukan jalan terus karena "kelihatannya solusi paling gampang".

Ini bukan aturan blocking secara umum — kebanyakan drift semacam ini nggak bisa dideteksi script, jadi tanggung jawabnya balik ke reasoning tiap turn. Yang **bisa** dideteksi otomatis (reintroduce dependency yang eksplisit ditolak) dijaga sama hook di bawah.

## Changelog Policy

Any turn that changes the codebase (edit, new file, fix, adjustment — no matter how small) must add one entry to `CHANGELOG.md`, grouped by day (newest day on top, newest entry within a day on top):

```
## YYYY-MM-DD

### HH:MM
> "exact user prompt, copied verbatim — no paraphrasing"

- **New:** file/thing added
- **Fix:** what was broken → what changed
- **Adjust:** tweak/rename/reorg

---
```

Only include the bullet categories that actually apply, one line each — file(s) touched + line counts, no run-on prose. If a `## YYYY-MM-DD` header for today already exists, add the entry under it instead of creating a duplicate. Separate entries with `---`.

Enforced by a `Stop` hook (`.claude/hooks/changelog-check.sh`, wired in `.claude/settings.json`): it blocks the turn from ending if there are uncommitted changes and `CHANGELOG.md` wasn't touched.

## Vision Guardrail (hook-enforced)

`.claude/hooks/vision-check.sh` (wired in `.claude/settings.json` alongside the changelog hook) scans the diff for concrete reintroductions of things `MASTER_PROMPT.md` explicitly rejected — `@liveblocks`, `yjs`, `y-protocol`, `@clerk`, `ConvexProviderWithClerk`, `react-icons`, `@convex-dev/auth`. If any show up in added lines, the turn is blocked until it's confirmed with the user that this is an intentional, new decision — not an accidental regression.

This only catches the greppable cases. It's a floor, not a substitute for actually reading `MASTER_PROMPT.md` — subtler drift (positioning, scope creep into feature #5, tone that stops sounding academic-focused) isn't something a bash script can catch, and relies on the Product Alignment section above being taken seriously every turn.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
