"use server";
import * as cheerio from "cheerio";

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

const MAL_API = "https://api.myanimelist.net/v2";

// Action: Scrape 1 Person
export async function scrapePerson(
  malId: number,
): Promise<ScrapedPerson | null> {
  const isDevelopment = process.env.NODE_ENV === "development";
  if (!isDevelopment) {
    throw new Error(`401: Unauthorized Access`);
  }

  if (isNaN(malId)) {
    throw new Error(`400: Invalid ID`);
  }

  try {
    // 1. Unduh HTML asli dari MyAnimeList
    const res = await fetch(`https://myanimelist.net/people/${malId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 404) throw new Error(`404: Not Found`);
      throw new Error(`MAL merespons dengan status ${res.status}`);
    }

    const html = await res.text();

    // 2. Muat HTML ke dalam Cheerio
    const $ = cheerio.load(html);

    // 3. Ekstrak Nama & Gambar Utama
    const name = $("h1.title-name").text().trim().replace(/,/g, "");
    const imageUrl =
      $("#content > table > tbody > tr > td.borderClass img")
        .first()
        .attr("data-src") ||
      $("#content > table > tbody > tr > td.borderClass img")
        .first()
        .attr("src") ||
      "";

    // 4. Ekstrak Jumlah Favorit (Mencari teks "Member Favorites:")
    let favorites = 0;
    const favElement = $('span:contains("Member Favorites:")').parent().text();
    if (favElement) {
      const match = favElement.match(/Member Favorites:\s*([\d,]+)/);
      if (match && match[1]) {
        favorites = parseInt(match[1].replace(/,/g, ""), 10);
      }
    }

    // 5. Ekstrak Daftar Peran Suara (Voice Acting Roles)
    const voices: ScrapedVoiceRole[] = [];

    // Mencari tabel yang letaknya di bawah header "Voice Acting Roles"
    const voiceTableRows = $('div.normal_header:contains("Voice Acting Roles")')
      .nextAll("table")
      .first()
      .find("tr");

    voiceTableRows.each((_, row) => {
      const tds = $(row).find("td");
      if (tds.length === 4) {
        // Tabel standar MAL punya 4 kolom untuk VA
        // Kolom 2: Detail Anime
        const animeAnchor = $(tds[1]).find("a").first();
        const animeHref = animeAnchor.attr("href") || "";
        const animeIdMatch = animeHref.match(/\/anime\/(\d+)/);
        const animeId = animeIdMatch ? parseInt(animeIdMatch[1], 10) : 0;
        const animeTitle = animeAnchor.text().trim();
        const animeImg =
          $(tds[0]).find("img").attr("data-src") ||
          $(tds[0]).find("img").attr("src") ||
          "";

        // Kolom 3: Detail Karakter
        const charAnchor = $(tds[2]).find("a").first();
        const charHref = charAnchor.attr("href") || "";
        const charIdMatch = charHref.match(/\/character\/(\d+)/);
        const charId = charIdMatch ? parseInt(charIdMatch[1], 10) : 0;
        const charName = charAnchor.text().trim().replace(/,/g, "");
        const charText = $(tds[2]).find("div.spaceit_pad").text().trim();
        const charImg =
          $(tds[3]).find("img").attr("data-src") ||
          $(tds[3]).find("img").attr("src") ||
          "";

        const roleMatch = charText.match(/(Main|Supporting)/i);
        const charRole = roleMatch ? roleMatch[1] : "Unknown";

        const charFavMatch = charText.match(/([\d,]+)\s*Favorites/i);
        const charFavorites = charFavMatch
          ? parseInt(charFavMatch[1].replace(/,/g, ""), 10)
          : 0;

        if (animeId > 0 && charId > 0) {
          voices.push({
            anime: {
              mal_id: animeId,
              title: animeTitle,
              image_url: animeImg.replace("/r/50x70", ""),
            },
            character: {
              mal_id: charId,
              name: charName,
              image_url: charImg.replace("/r/50x70", ""),
              favorites: charFavorites,
            },
            role: charRole,
          });
        }
      }
    });

    return { mal_id: malId, name, image_url: imageUrl, favorites, voices };
  } catch (error) {
    console.error("Scrape Error:", error);
    throw new Error(`500: Failed`);
  }
}

export async function fetchAnimeMAL(
  animeId: number,
): Promise<CachedAnime | null> {
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
    const data = await res.json();

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
      genres: (data.genres || []).map((g: { id: number; name: string }) => ({
        name: g.name,
      })),
    };
  } catch (error) {
    console.warn(`[MAL API Failed] Anime ID ${animeId}`, error);
    return null;
  }
}

export async function getTopPeopleIds(limit: number): Promise<number[]> {
  const res = await fetch(`https://myanimelist.net/people.php?limit=${limit}`, {
    cache: "no-store",
  });
  if (!res.ok)
    throw new Error(`Gagal mengambil data dari MAL. Status: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const ids: number[] = [];
  $("tr.ranking-list").each((_, row) => {
    const href = $(row).find("td.people a[href]").first().attr("href") || "";
    const match = href.match(/\/people\/(\d+)/);
    if (match) ids.push(parseInt(match[1], 10));
  });
  return ids;
}
