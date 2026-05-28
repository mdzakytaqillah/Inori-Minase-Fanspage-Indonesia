# Inori Minase Fanspage Indonesia

Sebuah platform penggemar berbasis website yang didedikasikan untuk pengisi suara (seiyuu) dan penyanyi asal Jepang, **Inori Minase (水瀬いのり)**. Website ini berfungsi sebagai wadah bagi saya sebagai fans untuk membahas dan membagikan informasi tentang Inori Minase dari berbagai sumber.

## Fitur Utama

- **Arsitektur Data Lokal:** Seluruh data konten pada website ini disimpan dalam satu file lokal `data.json` untuk efisiensi dan kemudahan dalam melakukan pembaruan data.
- **Halaman Beranda:** Menampilkan lini masa (timeline) vertikal interaktif perjalanan karir Inori Minase, disandingkan dengan kumpulan tautan resmi dan forum komunitas yang relevan.
- **Halaman Diskografi:** Menampilkan daftar lengkap lagu yang dimiliki Inori Minase.
  - Kalkulasi jumlah lagu dengan menghindari perhitungan redudansi pada lagu yang dirilis dua kali atau lebih.
  - Fitur filter kategori dinamis untuk memisahkan tampilan antara **Semua Rilisan**, **Album**, dan **Single**.
  - Manajemen daftar lagu (tracklist) yang dilengkapi sistem **Kredit Kreator** untuk melacak riwayat komposer, penulis lirik, dan aransemen secara akurat.
- **Halaman Blog:** Menyajikan blog dengan kontrol navigasi halaman (pagination) serta integrasi skrip pihak ketiga yang adaptif untuk merender embed YouTube, Facebook, Twitter, TikTok, dan Instagram.

## Komponen Teknologi (Tech Stack)

- **Framework:** Next.js (App Router)
- **Bahasa Pemrograman:** TypeScript
- **Styling:** Tailwind CSS
- **Sumber Data (Database):** Berbasis File JSON Lokal (`data.json`)

Anda dapat mengaksesnya [disini](https://inorifans-id.vercel.app)

## Memulai Proyek

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
