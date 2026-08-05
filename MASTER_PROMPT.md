# Reindex AI

Karya Airel Adrivano, Gathfaan Agra Pratama, dan Aryandana Pascua Patiung dari team 2030 SUKSES!

## Apa produk ini

Reindex AI adalah editor dokumen berbasis AI yang dirancang khusus untuk mahasiswa dan peneliti — bukan tools menulis umum, tapi sesuatu yang dibangun di sekitar kebutuhan spesifik penulisan skripsi, tesis, paper, dan publikasi ilmiah. AI agent-nya hidup langsung di dalam dokumen: dia bisa membaca apa yang sedang dikerjakan, mengedit langsung lewat instruksi, dan membantu riset dengan sitasi yang bisa diverifikasi ke sumber asli.

Ini aplikasi publik, tapi bukan editor kolaboratif real-time seperti Google Docs yang sebenarnya. Satu dokumen hanya dipegang satu user aktif per device dalam satu waktu (single-writer). Kalau ada yang menyebut "Google Docs clone", maksudnya pengalaman menulisnya yang familiar — rich text, terasa natural — bukan soal multiplayer-nya.

## Kenapa produk ini dibuat

Kami ngeliat pola yang sama berulang: orang pakai ChatGPT atau Claude buat riset dan menulis, tapi posisinya selalu di luar dokumen. Hasilnya di-copy-paste bolak-balik antara jendela chat dan naskah asli. Itu sendiri udah nggak efisien, tapi yang lebih berbahaya buat penulisan akademik adalah AI generik sering mengarang sitasi — sumber yang kedengeran meyakinkan tapi sebenarnya nggak nyata.

Di sisi lain, editor yang ada sekarang (Google Docs, Word) belum benar-benar AI-native. Kalaupun ada fitur AI, itu terasa seperti tempelan, bukan bagian dari alur kerja menulis itu sendiri.

reindex.ai coba nutup dua celah itu sekaligus: AI yang paham konteks dokumen yang sedang dibuka, dan sitasi yang grounded ke sumber nyata, bukan karangan.

Kalau ada ambiguitas kecil dalam implementasi — microcopy, empty state, dan semacamnya — prioritaskan konteks akademik/riset ini. Placeholder dokumen kosong misalnya, lebih pas nyebut "mulai nulis draf skripsi" daripada "mulai nulis apa aja".

## Target build kali ini

Ini sesi one-shot. Targetnya, empat fitur utama di bawah benar-benar berfungsi end-to-end di akhir sesi — bukan scaffold kosong, bukan mock implementation.

Akun dan API key (Firebase, Convex, Google AI Studio, Groq, Perplexity) sudah Kami siapkan dan ada di environment variables. Kalau ada yang belum keisi atau invalid, lebih baik berhenti dan kasih tau Kami, daripada lanjut jalan dengan credential placeholder.

`README.md` dan `.env.example` juga sudah Kami siapkan di root repo. Kalau perlu ditambah (misal env var baru), edit yang sudah ada — jangan generate versi baru dengan struktur berbeda.

### Empat fitur, urutan prioritas

1. **Core editor** — pengalaman menulis rich text yang familiar. Ini fondasi buat semuanya.
2. **Sidebar AI agent** — ini yang paling penting dari sisi diferensiasi produk. Agent membaca dokumen yang sedang kebuka (scope-nya sengaja dibatasi ke satu dokumen, bukan lintas dokumen), bisa langsung mengedit lewat tool-calling, dan punya akses ke tool riset bersitasi.
3. **Selected-text edit** — user select bagian teks, kasih instruksi, AI eksekusi perubahannya.
4. **Inline autocomplete** — saran teks yang muncul saat mengetik. Latency-nya harus rendah karena dipanggil sesering keystroke.

Ada rencana fitur kelima ("others") tapi belum ada spec-nya. Jangan dibangun dulu sampai ada arahan lebih lanjut dariku.

## Gambaran arsitektur

Client (browser) sebenarnya punya dua jalur yang berbeda, bukan semuanya lewat satu pintu:

```
Client (Next.js, browser)
 ├─→ Firebase Auth (sesi & identitas)          [akses langsung SDK]
 ├─→ Convex (database, file storage, autosave) [akses langsung SDK, reactive subscription]
 └─→ Server actions (Vercel serverless)
        ├─ verifikasi token → Firebase
        ├─ query/write → Convex
        ├─→ Gemini Flash (sidebar agent + selected-text-edit)
        │      └─→ Perplexity Sonar API (tool call, khusus buat riset bersitasi)
        └─→ Groq/Llama (autocomplete, jalur terpisah demi latency)
```

Penyimpanan dan pembacaan dokumen (autosave, dashboard) dipanggil langsung dari client ke Convex, tanpa lewat server Next.js. Ini keputusan sadar — Convex sudah dirancang buat dipanggil aman langsung dari client, jadi menambah hop lewat server di sini cuma nambah latency tanpa manfaat nyata.

Yang lewat server actions cuma yang benar-benar butuh sesuatu yang rahasia: API key ke provider AI. Itu nggak boleh nongol di browser, jadi panggilan ke Gemini, Groq, dan Perplexity semuanya diproxy lewat server.

Konten dokumen (TipTap JSON) di-autosave ke Convex secara berkala. Nggak ada Yjs snapshot sync di sini — itu cuma relevan buat collaborative editing, dan produk ini memang bukan itu.

## Halaman dan alur pengguna

- `/sign-in` — login, minimal Google sign-in dan email/password lewat Firebase
- `/dashboard` — daftar dokumen milik user, tombol untuk bikin dokumen baru
- `/doc/[id]` — halaman editor utama, layout dua kolom:
  - Kiri/tengah (~70%): TipTap editor dengan toolbar rich-text lengkap
  - Kanan (~30%, collapsible): sidebar AI agent, chat-style, membaca dokumen yang sedang aktif
  - Selected-text-edit muncul sebagai floating toolbar di atas teks yang di-select
  - Autocomplete tampil sebagai ghost text inline, `Tab` untuk accept, `Esc` untuk dismiss — pattern yang sama seperti Copilot

Detail visual (warna, spacing, komponen spesifik) pakai default shadcn/ui dan Tailwind. Nggak perlu approval buat tiap keputusan kecil semacam itu.

## Stack

| Layer | Pilihan | Versi |
|---|---|---|
| Framework | Next.js, App Router | 16.2.x (stable — hindari 16.3.0, itu masih preview) |
| UI library | React | 19.2.x stable (bukan RC) |
| Bahasa | TypeScript | 5.x |
| Runtime | Node.js | 22.x LTS |
| Auth | Firebase / Identity Platform | firebase JS SDK ~12.15.0 |
| Database & file storage | Convex | ~1.42.x |
| Rich text editor | TipTap (ProseMirror) | 2.10.x |
| CSS | Tailwind CSS | 4.x |
| Component | shadcn/ui + Radix UI | latest |
| Icon | lucide-react | latest |
| Theme | next-themes | latest |
| Font | Geist / Inter via next/font | — |
| State | Zustand | 5.x |
| Form | React Hook Form + Zod | latest |
| URL state | nuqs | latest |
| AI SDK | Vercel AI SDK (`ai`) | ~7.0.x |
| Hosting | Vercel | — |
| Observability | Sentry (`@sentry/nextjs`) | latest, prioritas sekunder |
| Testing | Vitest + Playwright | latest, prioritas sekunder |

Versi-versi ini per Agustus 2026 — cek versi current saat install, terutama Next.js dan React. Keduanya sempat Kami temukan ke-pin ke versi yang salah (preview build dan release candidate), jadi ini bukan sekadar formalitas.

## Data model

Skema baseline-nya sengaja simpel, tiga tabel:

```ts
// convex/schema.ts
users: defineTable({
  firebaseUid: v.string(),   // dari Firebase ID token, sumber identitas
  email: v.string(),
  name: v.optional(v.string()),
}).index("by_firebase_uid", ["firebaseUid"]),

documents: defineTable({
  ownerId: v.id("users"),
  title: v.string(),
  content: v.any(),          // TipTap JSON (ProseMirror doc), autosaved
  updatedAt: v.number(),
}).index("by_owner", ["ownerId"]),

documentFiles: defineTable({
  documentId: v.id("documents"),
  storageId: v.id("_storage"), // Convex File Storage, buat gambar yang di-embed di editor
}).index("by_document", ["documentId"]),
```

Boleh nambah field kecil kalau memang perlu (timestamp tambahan, misalnya), tapi struktur intinya sebaiknya nggak diubah tanpa alasan yang kuat.

Alur autentikasinya: client login lewat Firebase, dapat ID token, kirim ke Convex di panggilan pertama, lalu Convex cek atau insert row di `users` berdasarkan `firebaseUid`. Ini upsert-on-first-call — nggak perlu endpoint registrasi terpisah.

Satu hal yang gampang kelewat: Convex nggak otomatis tau soal Firebase. Ini harus dikonfigurasi eksplisit di `convex/auth.config.ts` supaya Convex percaya Firebase sebagai JWT issuer (domain-nya issuer URL project Firebase, applicationID-nya project ID Firebase). Kalau ini kelewat, `ctx.auth.getUserIdentity()` di Convex functions akan selalu balikin `null` — dan itu langsung berdampak ke bagian security di bawah.

## Security

Karena client manggil Convex langsung tanpa lewat server Next.js, satu-satunya lapisan yang mencegah satu user baca atau edit dokumen user lain adalah kode yang ditulis di Convex functions itu sendiri. Ini bukan detail kecil — Convex functions di sini berfungsi sebagai backend beneran, bukan cuma database passthrough, dan harus diperlakukan sebagai trust boundary.

Setiap query dan mutation yang menyentuh `documents` atau `documentFiles` perlu:

1. Ambil identitas user dari auth context Convex (yang terisi dari Firebase token yang sudah diverifikasi lewat setup di atas)
2. Cek `document.ownerId === user._id` sebelum baca atau tulis — ini berlaku di semua operasi read/update/delete, bukan cuma di endpoint create
3. Kalau nggak match, lempar error/unauthorized — jangan diam-diam balikin data kosong

Tanpa ini, siapapun bisa buka browser console, panggil Convex function langsung, dan akses dokumen orang lain. Ini prasyarat sebelum fitur manapun dianggap selesai.

## AI capabilities

Semua panggilan ke model lewat Vercel AI SDK, bukan manggil SDK provider (Google/Groq/Perplexity) secara langsung. Alasannya sederhana: biar provider bisa diganti nanti tanpa perlu rewrite kode yang manggilnya.

Ada tiga model yang dipakai, masing-masing buat kebutuhan yang beda:

- **Gemini Flash** menjalankan sidebar agent dan selected-text-edit. Tool-calling buat edit dokumen dipetakan satu-satu ke command TipTap (`insert_text`, `replace_range`, `format_text`, dst), dan dieksekusi client-side langsung ke instance editor yang sedang kebuka user. Karena nggak ada collaborative editing di produk ini, nggak perlu server-side Yjs manipulation buat ini.
- **Perplexity Sonar** dipanggil oleh Gemini Flash sebagai tool, khusus buat riset bersitasi — bukan dipanggil langsung dari server actions.
- **Groq (Llama)** menjalankan autocomplete lewat jalur terpisah, karena kebutuhan latency-nya jauh beda dari sidebar agent.

Satu catatan soal Gemini: model yang dipakai di sini diakses lewat API key dari Google AI Studio dengan billing sendiri — bukan lewat subscription konsumen Gemini Pro/edu. Dua hal itu terpisah total, jangan disamain.

## Prioritas build

Definisi selesai buat sesi ini adalah empat fitur di atas berfungsi end-to-end, bukan test coverage penuh atau observability yang matang. Kalau harus milih alokasi effort:

1. Empat fitur dulu, di atas segalanya.
2. Sentry dan CI/CD pipeline formal bisa di-skip buat sekarang — kalau ada waktu sisa baru dipasang.
3. Test suite penuh (Vitest/Playwright) juga boleh di-skip, tapi tetap jalanin smoke test manual tiap fitur selesai. Bukan berarti nol verifikasi sama sekali.
4. Rate limiting di endpoint AI perlu ada dalam bentuk basic (per-user throttle sederhana cukup) — ini app publik dengan biaya per-call, jadi nggak bisa benar-benar di-skip, tapi juga nggak perlu sistem yang rumit.

## Keputusan yang sudah diambil

Beberapa pendekatan sempat dipertimbangkan dan akhirnya nggak dipakai. Kalau nemu instruksi lain yang secara implisit minta salah satu dari ini balik, lebih baik cek ke Kami dulu daripada diam-diam ditambahin lagi.

**Nggak ada realtime collaboration.** Ini konsekuensi langsung dari single-writer yang sudah dijelasin di awal — nggak ada Liveblocks, Yjs, CRDT, presence, atau collaboration-cursor. Semua itu cuma relevan kalau dua orang bisa edit dokumen yang sama secara bersamaan, dan itu bukan produk ini.

**Auth pakai Firebase, bukan Clerk.** Clerk sempat dipertimbangkan, tapi Firebase sudah jadi sumber identitas utama di seluruh sistem, jadi nambah Clerk cuma nambah kompleksitas tanpa manfaat nyata.

**Convex Auth juga nggak dipakai**, meskipun secara teori itu opsi paling "native" karena udah satu ekosistem sama database. Alasannya praktis: per pertengahan 2026, Convex Auth masih beta, dan dukungan buat Next.js SSR/server components-nya belum matang — itu risiko yang nggak sepadan buat App Router yang dipakai proyek ini.

**Belum ada vector search/RAG.** Sidebar agent scope-nya sengaja dibatasi ke dokumen yang sedang dibuka aja, bukan lintas dokumen. Karena itu vector search belum diperkenalkan — Convex sebenarnya sudah punya vector index yang tersedia, tinggal diaktifin kalau nanti scope-nya berubah.

**Icon library cuma lucide-react.** Nggak perlu nambah react-icons di atasnya — dobel icon library cuma nambah bundle size tanpa alasan yang jelas.

## Pertanyaan terbuka

Beberapa hal ini masih perlu keputusan atau konfirmasi lebih lanjut, jangan diasumsikan sendiri:

- **Isi fitur kelima ("others")** — di luar scope build ini, belum ada spec-nya.
- **Detail visual/branding** (logo, warna brand) di luar default shadcn/ui — kalau belum dikasih, pakai default neutral, jangan nebak identitas visual.
- **Tailwind v3 vs v4** — defaultnya v4 (stable saat ini, config CSS-first), tapi cek dulu apakah shadcn/ui yang dipakai sudah kompatibel v4 sebelum commit ke situ.
- **TipTap v2 vs v3** — masih di 2.x, belum ada keputusan final buat upgrade. Default-nya tetap di 2.x, karena migrasi extension API antar major version itu kerjaan tersendiri yang belum waktunya sekarang.
- **Groq free tier** — batasnya 30 request/menit dan 14.400/hari, cukup buat development tapi perlu upgrade ke Developer tier sebelum ada traffic produksi beneran. Jangan asumsikan tetap gratis pas launch.