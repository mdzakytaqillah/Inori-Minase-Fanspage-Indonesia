import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ==========================================
// 1. VARIABEL KONFIGURASI
// ==========================================
const MIN_CHARACTERS = 4;
const TARGET_TOTAL = 50;

// ==========================================
// 2. STRICT INTERFACES
// ==========================================
interface VoiceRole {
  character: { mal_id: number };
}

interface PersonResponse {
  data?: {
    name: string;
    image_url: string;
    favorites: number;
    voices: VoiceRole[];
  };
}

interface SeiyuuData {
  mal_id: number;
  name: string;
  image_url: string;
  favorites: number;
  character_count: number;
}

export async function GET(request: NextRequest) {
  // 🔒 KEAMANAN: Pastikan hanya berjalan di lokal atau memiliki Secret
  const isDevelopment = process.env.NODE_ENV === "development";
  const hasValidSecret =
    request.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;

  if (!isDevelopment && !hasValidSecret) {
    return NextResponse.json({ error: "Unauthorized Access" }, { status: 401 });
  }

  // Mendapatkan URL origin lokal (misal: http://localhost:3000) agar dinamis
  const origin = request.nextUrl.origin;

  const baseUrl = "https://myanimelist.net/people.php";
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
  };

  const validSeiyuu: Array<{
    mal_id: number;
    name: string;
    image_url: string;
    favorites: number;
    character_count: number;
  }> = [];
  let limit = 0;

  console.log(
    `\n🚀 [TOP SEIYUU SCRAPER] Memulai pencarian ${TARGET_TOTAL} Seiyuu...`,
  );

  try {
    while (validSeiyuu.length < TARGET_TOTAL) {
      console.log(`\n📄 Membaca halaman Top People (Limit: ${limit})...`);

      // 1. Ambil Halaman Tabel Top People dari MAL
      const listResponse = await fetch(`${baseUrl}?limit=${limit}`, {
        headers,
        cache: "no-store",
      });
      if (!listResponse.ok)
        throw new Error(
          `Gagal mengambil data dari MAL. Status: ${listResponse.status}`,
        );

      const listHtml = await listResponse.text();
      const $list = cheerio.load(listHtml);
      const rankingRows = $list("tr.ranking-list").toArray();

      if (rankingRows.length === 0) {
        console.log("🛑 Tidak ada data orang lagi di MAL. Berhenti.");
        break;
      }

      // 2. Iterasi per orang dari tabel
      for (const row of rankingRows) {
        if (validSeiyuu.length >= TARGET_TOTAL) break;

        const aTag = $list(row).find("td.people a[href]").first();
        const href = aTag.attr("href") || "";
        const matchId = href.match(/\/people\/(\d+)/);

        if (!matchId) continue;

        const malId = parseInt(matchId[1], 10);
        const tempName = $list(row)
          .find("td.people a:not(:has(img))")
          .text()
          .trim()
          .replace(/,/g, "");

        // 3. JEDA WAKTU: Menghindari blokir IP dari MAL dan antrian lokal
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // 4. MEMANGGIL ENDPOINT LOKAL (/api/mal-scraper/people/[id])
        const personRes = await fetch(
          `${origin}/api/mal-scraper/people/${malId}`,
          {
            // Teruskan header
            headers: hasValidSecret
              ? { "x-admin-secret": process.env.ADMIN_SECRET || "" }
              : {},
            cache: "no-store",
          },
        );

        if (!personRes.ok) {
          console.log(
            `❌ [ERROR] Gagal membaca endpoint internal untuk ID: ${malId}`,
          );
          continue;
        }

        const personJson = (await personRes.json()) as PersonResponse;
        const voices = personJson?.data?.voices || [];
        const imageUrl = personJson.data?.image_url || "";
        const fav = personJson.data?.favorites || 0;
        const finalName = personJson.data?.name || tempName;

        // 5. Hitung Karakter Unik (by char MAL ID)
        const uniqueCharacterIds = new Set(
          voices.map((v) => v.character.mal_id),
        );
        const charCount = uniqueCharacterIds.size;

        // 6. Filter berdasarkan Kriteria
        if (charCount >= MIN_CHARACTERS) {
          validSeiyuu.push({
            mal_id: malId,
            name: finalName,
            image_url: imageUrl,
            favorites: fav,
            character_count: charCount,
          });
          console.log(
            `✅ [LOLOS] ${finalName} - ${fav} Fav. - Memiliki peran sebanyak ${charCount} karakter (Total: ${validSeiyuu.length}/${TARGET_TOTAL})`,
          );
        } else if (charCount == 0) {
          console.log(
            `❌ [SKIP] ${finalName} bukan seiyuu dan tidak pernah memiliki peran karakter.`,
          );
        } else {
          console.log(
            `⏭️ [SKIP] ${finalName} bukan seiyuu - Hanya memiliki peran sebanyak ${charCount} karakter.`,
          );
        }
      }

      // Pindah ke Halaman MAL selanjutnya (+50)
      limit += 50;
    }

    console.log(
      `\n🎉 [SELESAI] Berhasil mengumpulkan ${validSeiyuu.length} Top Seiyuu!`,
    );

    return NextResponse.json({
      success: true,
      message: `Berhasil mengumpulkan ${validSeiyuu.length} Top Seiyuu`,
      data: validSeiyuu,
    });
  } catch (error: unknown) {
    console.error("Scraper Error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan yang tidak diketahui";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
