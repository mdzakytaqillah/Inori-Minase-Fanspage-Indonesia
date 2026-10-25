# Inori Minase Fanspage Indonesia

Platform situs web komunitas dan pusat informasi penggemar yang didedikasikan untuk pengisi suara (*Seiyuu*) sekaligus penyanyi asal Jepang, [**Inori Minase (水瀬いのり/Minase Inori)**](https://www.inoriminase.com). Situs web ini menyajikan profil perjalanan karier, katalog diskografi & riwayat konser bebas redundansi, blog terintegrasi media sosial, hingga statistik peran suara berbasis data [MyAnimeList (MAL)](https://myanimelist.net/people/11297).

🔗 **Akses Website Live:** [https://inorifans-id.vercel.app](https://inorifans-id.vercel.app)

---

## Fitur Utama

### 1. Halaman Beranda (Home)
* Menampilkan profil personal Inori Minase, linimasa (*timeline*) vertikal interaktif perjalanan karier, serta direktori tautan resmi dan forum komunitas yang relevan.
* **Conditional Birthday Countdown:** Fitur hitung mundur otomatis yang aktif ketika mendekati hari ulang tahun Inori Minase ($\le 90$ hari).

### 2. Halaman Diskografi & Riwayat Konser (Discography & LIVE)
* **Kalkulasi Lagu Unik Bebas Redundansi:** Dilengkapi *badge* penghitung jumlah lagu yang secara otomatis mengeliminasi perhitungan ganda pada lagu yang dirilis lebih dari satu kali (misalnya pada *Single* dan *Album*), serta dapat diklik untuk menampilkan daftar seluruh lagu satuan.
* **Filter Kategori Dinamis:** Memisahkan tampilan rilisan berdasarkan **Semua Rilisan**, **Album**, dan **Single**.
* **Manajemen Tracklist & Kredit Kreator:** Menampilkan daftar lagu di setiap rilisan lengkap dengan pencatatan riwayat **Penulis Lirik**, **Komposer**, dan **Aransemen**.
* **Arsip Lengkap LIVE Concerts:** Menyajikan statistik konser, nama tur/konser, jadwal dan lokasi pelaksanaan, *setlist/tracklist* di setiap konser, serta informasi perilisan media *Blu-Ray* dan *Audio*.

### 3. Halaman Blog Interaktif
* Menyajikan artikel dan pembaruan informasi dengan sistem navigasi halaman (*pagination*).
* **Integrasi Multi-Platform Embed Adaptif:** Memuat skrip pihak ketiga secara dinamis untuk merender tampilan *embed* dari **YouTube**, **Facebook**, **Twitter (X)**, **TikTok**, dan **Instagram**.

### 4. Halaman Analitik Pengisian Suara (Voicing Analytics)
Menyajikan visualisasi dan pengolahan data peran suara Inori Minase yang bersumber dari penggabungan **Official MyAnimeList API** dan **Custom Web Scraper**:
* **Statistik Top Character:** Menampilkan daftar karakter ikonik yang diperankan Inori Minase dengan jumlah favorit $\ge 1.000$ pengguna di MyAnimeList.
* **Statistik Top Genre Anime:** Mengagregasi dan mengurutkan distribusi genre dari seluruh judul anime yang melibatkan Inori Minase.
* **Leaderboard Top 50 Seiyuu:** Menampilkan peringkat 50 *Seiyuu* dengan jumlah favorit tertinggi di MyAnimeList menggunakan filter kelayakan minimal memiliki 4 peran karakter berbeda.
* **Pelacak Anime Sedang & Akan Tayang (*Airing & Upcoming*):** Menampilkan informasi karakter dan jadwal penayangan anime terbaru yang sedang atau akan dibintangi oleh Inori Minase.
  *(Data pada halaman ini berasal dari platform [MyAnimeList (MAL)](https://myanimelist.net) yang diperoleh dari penggabungan data dari sumber API resmi MAL (untuk data detail anime) dan penggunaan teknik website scraping (untuk data peran Inori Minase dan data Top Seiyuu). Pengembangan modul scraper MyAnimeList ini terinspirasi dari proyek [@nattadasu/miribyou](https://github.com/nattadasu/miribyou) yang mereplikasi fungsi [Jikan API](https://github.com/jikan-me/jikan-rest) (Unofficial Public MyAnimeList API)).*

---

## Tech Stack & Arsitektur Data

* **Framework:** [Next.js](https://nextjs.org) (App Router)
* **Bahasa Pemrograman:** TypeScript
* **Styling:** Tailwind CSS
* **Data Fetching & Parsing:** [Official MyAnimeList API](https://myanimelist.net/apiconfig) & [Cheerio (HTML Scraper)](lib/getDataMAL.ts)
* **Cloud Storage:** [Vercel Blob Storage](https://vercel.com/docs/vercel-blob) (`@vercel/blob`) untuk [menyimpan](lib/syncBlob.ts) hasil fetch dan parsing
* **Arsitektur Sumber Data:**
  1. **Basis Data JSON Lokal (`lib/`):**
     * [`profile.json`](lib/profile.json): Data profil utama dan ID MyAnimeList Inori Minase.
     * [`info.json`](lib/info.json): Data linimasa karier dan tautan pada Halaman Beranda.
     * [`blog.json`](lib/blog.json): Konten artikel dan sematan media pada Halaman Blog.
     * [`discography.json`](lib/discography.json) & [`live_history.json`](lib/live_history.json): Katalog lagu, kredit kreator, dan riwayat konser pada Halaman Diskografi.
  2. **Sinkronisasi Hybrid MAL API + Web Scraper ke Vercel Blob (`lib/getDataMAL.ts` & `lib/syncBlob.ts`):**
     * `person_db.json`: Data profil *Seiyuu* dan daftar seluruh karakter yang diperankan (Sample data [disini](lib/person_db.json)).
     * `anime_db.json`: Metadata lengkap seluruh anime terkait (status tayang, musim, tahun, dan daftar genre) (Sample data [disini](lib/anime_db.json)).
     * `topseiyuu_db.json`: Data peringkat *Top 50 Seiyuu* (Sample data [disini](lib/topseiyuu_db.json)).

---

## ⚠️ Disclaimer ⚠️

Penggunaan *Official API* dan teknik *website scraping* MyAnimeList hanya dijalankan secara manual pada lingkup *local development server* semata-mata untuk memperbarui basis data statis pada situs web ini.

---

## Panduan Deploy & Sinkronisasi Mandiri

1. Kloning repositori ini ke perangkat lokal Anda:
   ```bash
   git clone https://github.com/mdzakytaqillah/Inori-Minase-Fanspage-Indonesia.git
   cd Inori-Minase-Fanspage-Indonesia
   ```
2. Instal seluruh dependensi:
   ```bash
   npm install
   ```
3. Siapkan variabel lingkungan pada file `.env.local` dengan mendaftarkan [Vercel Blob Storage](https://vercel.com/docs/vercel-blob) dan [MyAnimeList API Client ID](https://myanimelist.net/apiconfig):
   ```env
   BLOB_STORE_ID="YOUR_STORE_ID"
   BLOB_READ_WRITE_TOKEN="YOUR_BLOB_TOKEN"
   MAL_CLIENT_ID="YOUR_MAL_CLIENT_ID"
   ```
4. Jalankan *development server*:
   ```bash
   npm run dev
   ```
   Pada umumnya, server akan berjalan pada localhost:3000. Buka [http://localhost:3000](http://localhost:3000) pada peramban Anda.
5. Untuk melakukan sinkronisasi data Halaman Voicing, akses dasbor khusus di [http://localhost:3000/sync-data](http://localhost:3000/sync-data):
   * **Sync Semua Anime:** Mengambil seluruh data awal anime (sinkronisasi pertama kali akan memakan waktu cukup lama, sinkronisasi berikutnya berjalan lebih cepat karena hanya memperbarui anime berstatus *currently airing* dan *upcoming*).
   * **Sync Top Seiyuu:** Memindai dan menyaring peringkat *Seiyuu* terpopuler sesuai kriteria (sinkronisasi membutuhkan waktu cukup lama karena harus memeriksa data person satu persatu hingga didapatkan sejumlah seiyuu yang memenuhi kriteria).
   * **Sync Anime Manual:** Memperbarui data satu judul anime secara spesifik berdasarkan ID (Proses akan dihentikan jika anime tersebut belum terdata dalam daftar peran, silahkan jalankan _Sync Semua Anime_ jika ini adalah peran baru).
   * **Backup Data ke Local:** Mengunduh salinan data dari Vercel Blob ke direktori lokal [`lib/`](lib/).
