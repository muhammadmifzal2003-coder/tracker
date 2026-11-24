# Buku Belanja: pengira perbelanjaan peribadi

Web app untuk seorang pengguna merekod perbelanjaan dalam RM, melihat jumlah harian, mingguan dan bulanan, dan mendapat amaran apabila bajet bulanan hampir habis.

Stack: Next.js · Supabase (Postgres + Auth + Row Level Security) · Tailwind · Vitest

- Design: `docs/superpowers/specs/2026-11-24-expense-tracker-design.md`
- Plan: `docs/superpowers/plans/2026-11-24-expense-tracker.md`
- Mockup: `docs/design/mockup.png`

## Setup Supabase (sekali sahaja)

1. Daftar di <https://supabase.com> dan buat projek baru (pelan percuma).
2. **SQL Editor**: tampal isi `supabase/migrations/0001_init.sql` dan tekan **Run**. Kemudian buat perkara yang sama untuk `0002_expense_sum.sql`.
3. Masih dalam SQL Editor: jalankan `supabase/checks/0001_rls_check.sql`.
   Hasil yang betul: `rls_tables = 3`, `policies = 12`.
4. **Authentication → Sign In / Providers → Email**: matikan **"Allow new users to sign up"**.
5. **Authentication → Users → Add user**: masukkan e-mel dan kata laluan anda, dan tandakan **Auto Confirm User**.
6. **Project Settings → API**: salin **Project URL** dan **anon public key**.

> ⚠️ Jangan sekali-kali guna kunci `service_role` dalam app ini.

## Jalankan secara lokal

```bash
cp .env.example .env.local    # isi URL dan anon key dari langkah 6
npm install
npm run dev
```

## Keselamatan

```bash
npm test        # unit test + ujian RLS (PGlite)
npm run scan    # Semgrep + gitleaks — wajib bersih sebelum push
git config core.hooksPath .githooks   # gitleaks pada setiap commit
```

- `.env.local` di-ignore oleh git. Hanya `.env.example` (tanpa nilai) yang di-commit.
- Row Level Security pada semua jadual: setiap baris hanya boleh dibaca oleh pemiliknya.
- Tiada halaman sign-up. Pendaftaran ditutup dalam Supabase.

## Deploy ke Netlify (untuk buka dari telefon)

Live: <https://tracker-1rr0.netlify.app>

1. <https://app.netlify.com>: **Add new project → Import an existing project → GitHub →** pilih repo `tracker`.
2. Biarkan build command `npm run build` (Netlify mengesan Next.js secara automatik).
3. **Environment variables**: `NEXT_PUBLIC_SUPABASE_URL` (tanpa `/rest/v1/`) dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon atau publishable key).
   Kedua-duanya mesti diisi *sebelum* build, kerana CSP dibina dengan URL Supabase.
4. **Site configuration → Access & security → Visitor access**: tetapkan **No protection**. App ada login sendiri.
5. Supabase → **Authentication → URL Configuration**: set **Site URL** kepada URL Netlify.
6. Setiap push ke `main` akan deploy semula secara automatik.

> Vercel juga boleh digunakan dengan langkah yang sama, tetapi pendaftarannya mungkin meminta nombor telefon.

## Struktur

- `src/lib/`: logik (wang, tarikh KL, bajet, validasi) dan `core.ts` (akses data, diuji tanpa rangkaian)
- `src/app/actions/`: Server Actions, yang merupakan pembalut nipis kepada `core.ts`
- `src/app/`: halaman `/`, `/expenses`, `/settings`, `/login`
- `supabase/migrations/`: SQL untuk ditampal ke Supabase
- `supabase/__tests__/`: ujian RLS menggunakan PGlite
