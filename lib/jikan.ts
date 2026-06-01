// Jikan API - Unofficial MyAnimeList API Wrapper

// --- DEFINISI INTERFACE ---
export interface JikanImage {
  image_url: string;
  small_image_url?: string;
}

export interface JikanAnime {
  mal_id: number;
  title: string;
  images: {
    jpg: JikanImage;
  };
  season?: string | null;
  year?: number | null;
  aired?: {
    string?: string;
  };
}

export interface JikanCharacter {
  mal_id: number;
  name: string;
  url: string;
  images: {
    jpg: JikanImage;
  };
}

export interface VoiceRole {
  role: string;
  anime: JikanAnime;
  character: JikanCharacter;
}

// --- FUNGSI FETCHING ---
const REVALIDATE_TIME = 3600; // Cache 1 jam

async function fetchWithRetry(url: string, tags: string[] = [], retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        next: { revalidate: REVALIDATE_TIME, tags },
      });
      if (res.ok) return await res.json();

      if (res.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      break;
    } catch (error) {
      console.error(`Fetch error on ${url}:`, error);
      break;
    }
  }
  return null;
}

async function fetchMultiPage(baseUrl: string, tags: string[] = []) {
  const allData: JikanAnime[] = [];
  let currentPage = 1;
  let targetMaxPage = 1;

  while (currentPage <= targetMaxPage) {
    const json = await fetchWithRetry(`${baseUrl}?page=${currentPage}`, tags);

    // Berhenti jika data sudah kosong
    if (!json || !json.data || json.data.length === 0) break;

    allData.push(...json.data);

    // Pada halaman pertama, baca max page dari API dan lebihkan 1 (fail-safe)
    if (
      currentPage === 1 &&
      json.pagination &&
      json.pagination.last_visible_page
    ) {
      targetMaxPage = json.pagination.last_visible_page + 1;
    }

    currentPage++;

    // Jeda 1 detik sebelum fetch next page
    if (currentPage <= targetMaxPage) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return { data: allData };
}

export async function getInoriProfile() {
  return fetchWithRetry("https://api.jikan.moe/v4/people/11297", [
    "inori-profile",
  ]);
}

export async function getInoriVoices() {
  return fetchWithRetry("https://api.jikan.moe/v4/people/11297/voices", [
    "inori-voices",
  ]);
}

export async function getAiringAnime() {
  return fetchMultiPage("https://api.jikan.moe/v4/seasons/now", [
    "airing-anime",
  ]);
}

export async function getUpcomingAnime() {
  return fetchMultiPage("https://api.jikan.moe/v4/seasons/upcoming", [
    "upcoming-anime",
  ]);
}
