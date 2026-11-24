# Buku Belanja: pengira perbelanjaan peribadi

Web app untuk seorang pengguna merekod perbelanjaan dalam RM, melihat jumlah harian, mingguan dan bulanan, dan mendapat amaran apabila bajet bulanan hampir habis.

Stack: Next.js · Supabase (Postgres + Auth + Row Level Security) · Tailwind · Vitest

- Design: `docs/superpowers/specs/2026-11-24-expense-tracker-design.md`
- Plan: `docs/superpowers/plans/2026-11-24-expense-tracker.md`
- Mockup: `docs/design/mockup.png`

## Setup Supabase (sekali sahaja)

1. Daftar di <https://supabase.com> dan buat projek baru (pelan percuma).
2. **SQL Editor**: tampal isi `supabase/migrations/0001_init.sql`, kemudian tekan **Run**.
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

## Deploy ke Vercel (untuk buka dari telefon)

1. Pastikan kod sudah di-push ke repo GitHub private anda.
2. Di <https://vercel.com>: **Add New → Project → Import** repo `expense-tracker`.
3. **Environment Variables**: masukkan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`, kemudian **Deploy**.
   (Kedua-duanya mesti diisi *sebelum* build, kerana CSP dibina dengan URL Supabase.)
4. Supabase → **Authentication → URL Configuration**: set **Site URL** kepada URL Vercel anda (contoh `https://expense-tracker-xxx.vercel.app`).
5. Buka URL itu di telefon, log masuk, dan tambah satu belanja. Di Chrome/Safari, pilih "Add to Home Screen" supaya ia jadi macam app.

## Struktur

- `src/lib/`: logik (wang, tarikh KL, bajet, validasi) dan `core.ts` (akses data, diuji tanpa rangkaian)
- `src/app/actions/`: Server Actions, yang merupakan pembalut nipis kepada `core.ts`
- `src/app/`: halaman `/`, `/expenses`, `/settings`, `/login`
- `supabase/migrations/`: SQL untuk ditampal ke Supabase
- `supabase/__tests__/`: ujian RLS menggunakan PGlite
