import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ==========================================
// 1. STRICT INTERFACES
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

// ==========================================
// 2. LIVE HTML SCRAPER
// ==========================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const hasValidSecret =
    request.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;

  if (!isDevelopment && !hasValidSecret) {
    return NextResponse.json({ error: "Unauthorized Access" }, { status: 401 });
  }
  const resolvedParams = await params;
  const malId = parseInt(resolvedParams.id, 10);
  if (isNaN(malId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
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
      if (res.status === 404)
        return NextResponse.json(
          { error: "Data people tidak ditemukan" },
          { status: 404 },
        );
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

    // 6. Rangkai menjadi JSON utuh
    const personData: ScrapedPerson = {
      mal_id: malId,
      name,
      image_url: imageUrl,
      favorites,
      voices,
    };

    return NextResponse.json({ data: personData });
  } catch (error) {
    console.error("Scrape Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses data dari MAL" },
      { status: 500 },
    );
  }
}
