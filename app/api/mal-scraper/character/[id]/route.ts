import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export interface ScrapedCharacter {
  mal_id: number;
  name: string;
  image_url: string;
  favorites: number;
}

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
    const res = await fetch(`https://myanimelist.net/character/${malId}`, {
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
          { error: "Karakter tidak ditemukan" },
          { status: 404 },
        );
      throw new Error(`MAL merespons dengan status ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Ekstrak Nama
    // MAL menaruh nama karakter di <h1> class title-name atau <h2>
    const name =
      $("h2.normal_header").first().text().trim() ||
      $("h1.title-name").text().trim();

    // Ekstrak Gambar
    const imageUrl =
      $("#content > table > tbody > tr > td.borderClass img")
        .first()
        .attr("data-src") ||
      $("#content > table > tbody > tr > td.borderClass img")
        .first()
        .attr("src") ||
      "";

    // Ekstrak Favorit
    let favorites = 0;
    const sidebarText = $("#content > table > tbody > tr > td.borderClass")
      .first()
      .text();
    const favMatch = sidebarText.match(/Member Favorites:\s*([\d,]+)/i);

    if (favMatch && favMatch[1]) {
      favorites = parseInt(favMatch[1].replace(/,/g, ""), 10);
    }

    const characterData: ScrapedCharacter = {
      mal_id: malId,
      name,
      image_url: imageUrl,
      favorites,
    };

    return NextResponse.json({ data: characterData });
  } catch (error) {
    console.error("Scrape Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses data dari MAL" },
      { status: 500 },
    );
  }
}
