# Inori Minase Fanspage Indonesia

Sebuah platform penggemar berbasis website yang didedikasikan untuk pengisi suara (seiyuu) dan penyanyi asal Jepang, [**Inori Minase (水瀬いのり/Minase Inori)**](https://www.inoriminase.com). Website ini berfungsi sebagai wadah bagi saya sebagai fans untuk membahas dan membagikan informasi tentang Inori Minase dari berbagai sumber.

## Fitur Utama

- **Arsitektur Data Lokal:** Sebagian besar data konten pada website ini disimpan dalam satu file lokal `data.json`. Sebagian lainnya disimpan pada Vercel Blob Storage.
- **Halaman Beranda:** Menampilkan foto Inori Minase, informasi pribadi Inori Minase, lini masa (timeline) vertikal interaktif perjalanan karir Inori Minase, disandingkan dengan kumpulan tautan resmi dan forum komunitas yang relevan. Terdapat pula fitur countdown hari ulang tahun Inori Minase yang aktif ketika mendekati hari ulang tahunnya (<= 90 hari)
- **Halaman Diskografi:** Menampilkan daftar lengkap lagu yang dimiliki Inori Minase.
  - Kalkulasi jumlah lagu dengan menghindari perhitungan redudansi pada lagu yang dirilis dua kali atau lebih.
  - Fitur filter kategori dinamis untuk memisahkan tampilan antara **Semua Rilisan**, **Album**, dan **Single**.
  - Manajemen daftar lagu (tracklist) yang dilengkapi sistem **Kredit Kreator** untuk melacak riwayat komposer, penulis lirik, dan aransemen secara akurat.
- **Halaman Blog:** Menyajikan blog dengan kontrol navigasi halaman (pagination) serta integrasi skrip pihak ketiga yang adaptif untuk merender embed YouTube, Facebook, Twitter, TikTok, dan Instagram.
- **Halaman Voicing:** Menampilkan berbagai informasi berkaitan dengan Inori Minase sebagai seorang pengisi suara.
- Statistik Top Character yang diperankan Inori Minase, menampilkan karakter dengan jumlah favorit sebanyak >= 1000 dari pengguna [MyAnimeList (MAL)](https://myanimelist.net/people/11297).
- Statistik Top Genre Anime, menampilkan genre dari anime yang melibatkan Inori Minase, diurutkan berdasarkan jumlah terbanyak.
- Statistik Top Seiyuu, menampilkan Top 50 Seiyuu dengan jumlah favorit terbanyak dari pengguna [MyAnimeList (MAL)](https://myanimelist.net/people.php) dengan menetapkan kriteria seiyuu minimal memiliki peran 4 karakter berbeda.
- Informasi terkait peran karakter Inori Minase yang sedang dan/atau akan tayang dengan menyediakan informasi nama dan foto karakter serta nama dan waktu penayangan anime tersebut.
  Data pada halaman ini berasal dari platform [MyAnimeList (MAL)](https://myanimelist.net) yang diperoleh dari penggabungan data dari sumber API resmi MAL (untuk data detail anime) dan penggunaan teknik website scraping (untuk data peran Inori Minase dan data Top Seiyuu).

Pembuatan MyAnimeList Scraper terinspirasi oleh [@nattadasu](https://github.com/nattadasu/miribyou) yang mereplikasi fungsi dari [Jikan API](https://github.com/jikan-me/jikan-rest) (Unofficial Public MyAnimeList API).

## Komponen Teknologi (Tech Stack)

- **Framework:** [Next.js](https://nextjs.org) (App Router) - dibangun dengan [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)
- **Bahasa Pemrograman:** TypeScript
- **Styling:** Tailwind CSS
- **Sumber Data:** File JSON Lokal (`data.json`) untuk data Halaman Beranda, Diskografi, dan Blog serta penggabungan data dari [Official MyAnimeList API](https://myanimelist.net/apiconfig) dengan [MAL Website Scraping](app/api/mal-scraper/) untuk data Halaman Voicing. Hasil Fetch API dan Website Scraping disimpan pada [Vercel Blob Storage](https://vercel.com/docs/vercel-blob).

## ⚠️ Disclaimer ⚠️

Penggunaan API MyAnimeList dan Website Scraping MyAnimeList hanya dilakukan pada lingkup local development server dan hanya untuk memenuhi kebutuhan data pada website ini. Proses fetch API MyAnimeList dan Website Scraping MyAnimeList dilakukan secara manual.

## Akses Website

Anda dapat mengaksesnya [disini](https://inorifans-id.vercel.app)

## Deploy Mandiri

Pertama, clone repository ini pada direktori lokal perangkat anda

```bash
git clone https://github.com/mdzakytaqillah/Inori-Minase-Fanspage-Indonesia.git
```

Jalankan development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Pada umumnya, server akan berjalan pada localhost:3000. Buka [http://localhost:3000](http://localhost:3000) menggunakan browser anda.

Untuk menunjang fungsi dari Halaman Voicing, anda perlu menyiapkan [Vercel Blob Storage](https://vercel.com/docs/vercel-blob). Ambil value BLOB_STORE_ID serta BLOB_READ_WRITE_TOKEN lalu simpan pada file `.env.local`. Selain itu, kalian juga harus mendaftarkan akses [API MyAnimeList](https://myanimelist.net/apiconfig) untuk mendapatkan MAL_CLIENT_ID yang juga disimpan pada file `.env.local`.

**`.env.local`**

```bash
BLOB_STORE_ID="YOUR_STORE_ID"
BLOB_READ_WRITE_TOKEN="YOUR_BLOB_TOKEN"
MAL_CLIENT_ID="YOUR_MAL_CLIENT_ID"
```

Jalankan proses fetch dan scraping data anime dengan membuka [http://localhost:3000/sync-data](http://localhost:3000/sync-data) pada browser, pengambilan data anime pertama kali akan memakan waktu cukup lama, untuk pengambilan data anime setelahnya dapat berlangsung lebih cepat karena mengabaikan anime yang telah selesai tayang yang sudah disimpan datanya pada saat proses pengambilan data anime pertama kali. Setelah proses pengambilan data anime selesai, jalankan kembali proses fetch dan scraping data top seiyuu dengan membuka [http://localhost:3000/sync-data?type=topseiyuu](http://localhost:3000/sync-data?type=topseiyuu) pada browser, pengambilan data top seiyuu berlangsung cukup lama karena harus memeriksa data person satu persatu hingga didapatkan 50 seiyuu yang memenuhi kriteria.

## About Next.js (from Next.js Documentation)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel (from Next.js Documentation)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
