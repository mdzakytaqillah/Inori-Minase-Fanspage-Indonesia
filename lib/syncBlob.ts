"use server";
import { put, head } from "@vercel/blob";
import { revalidateTag } from "next/cache";
import fs from "fs";
import path from "path";

// ==========================================
// STRICT INTERFACES
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

export interface TopSeiyuu {
  mal_id: number;
  name: string;
  image_url: string;
  character_count: number;
  favorites: number;
}

// ==========================================
// FUNGSI UTILITAS BLOB
// ==========================================
async function readJsonFromBlob<T>(
  filename: string,
  defaultValue: T,
): Promise<T> {
  try {
    const blobDetails = await head(filename).catch(() => null);
    if (!blobDetails) return defaultValue;

    const res = await fetch(blobDetails.url, { cache: "no-store" });
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
  revalidateTag(filename, "max");
}

// Utilitas untuk membaca seluruh data
export async function getDashboardData() {
  const animeDB = await readJsonFromBlob<Record<number, CachedAnime>>(
    "anime_db.json",
    {},
  );
  const personDB = await readJsonFromBlob<ScrapedPerson | null>(
    "person_db.json",
    null,
  );
  const topSeiyuuDB = await readJsonFromBlob<TopSeiyuu[]>(
    "topseiyuu_db.json",
    [],
  );
  return { animeDB, personDB, topSeiyuuDB };
}

// Action: Simpan Data Voice Role
export async function saveAnimeSync(
  person: ScrapedPerson,
  animeDB: Record<number, CachedAnime>,
) {
  await writeJsonToBlob("person_db.json", person);
  await writeJsonToBlob("anime_db.json", animeDB);
}

// Action: Simpan Data Top Seiyuu
export async function saveTopSeiyuuDB(data: TopSeiyuu[]) {
  await writeJsonToBlob("topseiyuu_db.json", data);
}

// Action: Download Data
export async function downloadBlobToLocal() {
  // Hanya izinkan berjalan di environment development
  if (process.env.NODE_ENV !== "development") {
    throw new Error(
      "Akses ditolak: Hanya dapat dijalankan di mode development.",
    );
  }

  const filesToDownload = [
    "anime_db.json",
    "person_db.json",
    "topseiyuu_db.json",
  ];
  const logsSummary: string[] = [];

  for (const filename of filesToDownload) {
    try {
      // 1. Dapatkan detail URL dari Vercel Blob menggunakan head()
      const blobDetails = await head(filename).catch(() => null);
      if (!blobDetails) {
        logsSummary.push(
          `⚠️ ${filename} tidak ditemukan di Vercel Blob Store.`,
        );
        continue;
      }

      // 2. Fetch data aslinya dari URL Blob
      const res = await fetch(blobDetails.url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Gagal fetch HTTP ${res.status}`);
      const data = await res.json();

      // 3. Tentukan target lokasi folder lib/
      // process.cwd() akan mengarah pada root project Next.js Anda
      const targetPath = path.join(process.cwd(), "lib", filename);

      // 4. Tulis file secara fisik ke local storage disk
      fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), "utf-8");
      logsSummary.push(`📥 Berhasil mengunduh dan menyimpan: lib/${filename}`);
    } catch (error) {
      logsSummary.push(`❌ Gagal memproses ${filename}: ${error}`);
    }
  }

  return {
    success: true,
    logs: logsSummary,
  };
}
