import { put, list } from "@vercel/blob";

// --- CONFIGURATION ---
const MAL_SCRAP = "http://localhost:3000/api/mal-scraper";
const MAL_API = "https://api.myanimelist.net/v2";
const SEIYUU_ID = 11297;

// Helper: Delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ==========================================
// 1. STRICT INTERFACES UNTUK BLOB CACHE
// ==========================================
export interface CachedAnime {
  mal_id: number;
  title: string;
  status: string;
  season: string | null;
  year: number | null;
  start_date: string | null;
  end_date: string | null;
  image_url: string;
  genres: Array<{ name: string }>;
}

// ==========================================
// 2. STRICT INTERFACES UNTUK SCRAPER LOCAL
// ==========================================

export interface ScrapedVoiceRole {
  anime: { mal_id: number; title: string; image_url: string };
  character: {
    mal_id: number;
    name: string;
    image_url: string;
    favorites: number;
  };
  role: string;
}

export interface ScrapedPerson {
  mal_id: number;
  name: string;
  image_url: string;
  favorites: number;
  voices: ScrapedVoiceRole[];
}

interface ScrapedPersonResponse {
  data: ScrapedPerson;
}

export interface TopSeiyuu {
  mal_id: number;
  name: string;
  image_url: string;
  character_count: number;
  favorites: number;
}

// ==========================================
// 3. STRICT INTERFACES UNTUK MAL OFFICIAL API
// ==========================================

interface MalApiAnimeResponse {
  id: number;
  title: string;
  status: string;
  start_date?: string;
  end_date?: string;
  start_season?: {
    year: number;
    season: string;
  };
  main_picture?: { medium?: string; large?: string };
  genres?: Array<{ id: number; name: string }>;
}

// ==========================================
// 4. FUNGSI FETCH HYBRID
// ==========================================

// Fetch ke MAL Scraper
async function fetchScrapMAL<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${MAL_SCRAP}${endpoint}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Local Scraping Error: ${res.status}`);
    return (await res.json()) as T;
  } catch (error) {
    console.warn(`[Local Scraping Failed] ${endpoint}`, error);
    return null;
  }
}

// Fetch ke Official MAL API
async function fetchOfficialMAL(animeId: number): Promise<CachedAnime | null> {
  try {
    const res = await fetch(
      `${MAL_API}/anime/${animeId}?fields=id,title,main_picture,status,start_season,genres,start_date,end_date`,
      {
        headers: {
          "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID || "",
        },
        cache: "no-store",
      },
    );

    if (!res.ok) throw new Error(`MAL API Error: ${res.status}`);
    const data = (await res.json()) as MalApiAnimeResponse;

    // Mapping response MAL API ke format CachedAnime
    return {
      mal_id: data.id,
      title: data.title,
      status: data.status,
      season: data.start_season?.season || null,
      year: data.start_season?.year || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      image_url: data.main_picture?.large || data.main_picture?.medium || "",
      genres: (data.genres || []).map((g) => ({ name: g.name })),
    };
  } catch (error) {
    console.warn(`[MAL API Failed] Anime ID ${animeId}`, error);
    return null;
  }
}

// ==========================================
// 5. FUNGSI UTILITAS BLOB
// ==========================================
async function readJsonFromBlob<T>(
  filename: string,
  defaultValue: T,
  bypassCache: boolean = false,
): Promise<T> {
  try {
    const { blobs } = await list({ prefix: filename });
    const targetBlob = blobs.find((b) => b.pathname === filename);
    if (!targetBlob) return defaultValue;

    const fetchOptions: RequestInit = bypassCache
      ? { cache: "no-store" }
      : { next: { tags: [filename], revalidate: 3600 } };

    const res = await fetch(targetBlob.url, fetchOptions);
    if (!res.ok) return defaultValue;
    return (await res.json()) as T;
  } catch {
    return defaultValue;
  }
}

async function writeJsonToBlob<T>(filename: string, data: T): Promise<void> {
  await put(filename, JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// ==========================================
// 6. SMART HYBRID SYNC
// ==========================================
export async function runSmartSync(): Promise<{ success: boolean }> {
  console.log("Memulai Hybrid Sync (Local Scraper + Official MAL)...");

  // 1. Dapatkan peran suara dari Scraper Lokal
  const personRes = await fetchScrapMAL<ScrapedPersonResponse>(
    `/people/${SEIYUU_ID}`,
  );
  if (!personRes?.data) {
    console.error("❌ Gagal menarik daftar peran dari Scraper Lokal.");
    return { success: false };
  }
  const person = personRes.data;

  const uniqueAnimeIds = Array.from(
    new Set(person.voices.map((v) => v.anime.mal_id)),
  );

  const animeDB = await readJsonFromBlob<Record<number, CachedAnime>>(
    "anime_db.json",
    {},
    true,
  );

  // 2. Sync Anime menggunakan OFFICIAL MAL API
  for (const id of uniqueAnimeIds) {
    const existing = animeDB[id];
    // Tarik jika belum ada atau statusnya masih/belum tayang
    if (
      !existing ||
      existing.status === "currently_airing" ||
      existing.status === "not_yet_aired"
    ) {
      await delay(500); // Jeda aman untuk MAL API
      const animeData = await fetchOfficialMAL(id);
      if (animeData) {
        animeDB[id] = animeData;
        console.log(`✅ [MAL API] Synced Anime: ${animeData.title}`);
      }
    }
  }

  // 3. Simpan ke Vercel Blob
  await writeJsonToBlob("anime_db.json", animeDB);
  await writeJsonToBlob("person_db.json", person);
  console.log("🚀 Hybrid Sync Selesai!");

  return { success: true };
}

export async function getTopSeiyuu(): Promise<{ success: boolean }> {
  console.log("Memulai Pencarian Top Seiyuu");

  const topSeiyuuRes = await fetchScrapMAL<ScrapedPersonResponse>(`/topseiyuu`);
  if (!topSeiyuuRes?.data) {
    console.error("❌ Gagal menarik Top Seiyuu dari Scraper Lokal.");
    return { success: false };
  }
  const topSeiyuu = topSeiyuuRes.data;
  await writeJsonToBlob("topseiyuu_db.json", topSeiyuu);
  console.log("Data Top Seiyuu telah berhasil disimpan");

  return { success: true };
}

// ==========================================
// 7. MANUAL OVERRIDE (JALUR BELAKANG)
// ==========================================

export async function manualSyncAnime(
  id: number,
): Promise<{ success: boolean; message: string }> {
  console.log(`[Manual Sync] Memvalidasi Anime ID: ${id}...`);

  // Baca Person DB untuk validasi
  const personDB = await readJsonFromBlob<ScrapedPerson | null>(
    "person_db.json",
    null,
    true,
  );

  if (!personDB || !personDB.voices) {
    return {
      success: false,
      message:
        "Database Seiyuu kosong. Silakan lakukan Full Sync terlebih dahulu.",
    };
  }

  // Cegah injeksi data jika anime tidak ada dalam daftar peran
  const isAnimeExist = personDB.voices.some((v) => v.anime.mal_id === id);
  if (!isAnimeExist) {
    return {
      success: false,
      message: `Akses ditolak: Anime ID ${id} tidak ditemukan dalam daftar peran. Jika ini adalah anime baru, silakan lakukan Full Sync.`,
    };
  }

  // Jika valid, lanjutkan proses
  console.log(`[Manual Sync] Menarik Anime ID: ${id}...`);
  const animeDB = await readJsonFromBlob<Record<number, CachedAnime>>(
    "anime_db.json",
    {},
    true,
  );

  // Tarik via Official MAL API
  const animeData = await fetchOfficialMAL(id);

  if (animeData) {
    animeDB[id] = animeData;
    await writeJsonToBlob("anime_db.json", animeDB);
    console.log(
      `✅ [Manual Sync] Anime '${animeData.title}' berhasil ditambahkan/diperbarui!`,
    );
    return {
      success: true,
      message: `Anime '${animeData.title}' (ID: ${id}) tersimpan ke Blob.`,
    };
  }

  return {
    success: false,
    message: `Gagal menarik Anime ID: ${id} dari MAL API.`,
  };
}

// Utilitas untuk membaca data di UI
export async function getDashboardData() {
  const animeDB = await readJsonFromBlob<Record<number, CachedAnime>>(
    "anime_db.json",
    {},
  );
  const personDB = await readJsonFromBlob<ScrapedPerson | null>(
    "person_db.json",
    null,
    false,
  );
  const topSeiyuuDB = await readJsonFromBlob<TopSeiyuu[]>(
    "topseiyuu_db.json",
    [],
    false,
  );
  return { animeDB, personDB, topSeiyuuDB };
}
