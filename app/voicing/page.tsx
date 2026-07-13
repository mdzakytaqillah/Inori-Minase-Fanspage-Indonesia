import { Metadata } from "next";
import Link from "next/link";
import profile from "@/lib/profile.json";
import {
  getDashboardData,
  CachedAnime,
  ScrapedVoiceRole,
  TopSeiyuu,
} from "@/lib/syncBlob";

export const metadata: Metadata = { title: "Voicing Data" };

// --- INTERFACES & HELPER COMPONENTS ---

interface MappedAnimeRole {
  title: string;
  role: string;
  id: number;
}

interface MappedAnimeBanner {
  title: string;
  season: string | null;
  year: number | null;
  start_date: string | null;
  end_date: string | null;
  images: {
    jpg: {
      small_image_url: string;
    };
  };
}

interface MappedCharacter {
  id: number;
  name: string;
  image: string;
  url: string;
  animes: MappedAnimeRole[];
  airingAnime?: MappedAnimeBanner;
  upcomingAnime?: MappedAnimeBanner;
}

const CharacterCard = ({
  char,
  animeBanner,
  sectionType,
}: {
  char: MappedCharacter;
  animeBanner?: MappedAnimeBanner;
  sectionType?: "airing" | "upcoming";
}) => {
  let releaseText = "";

  if (animeBanner && animeBanner.start_date) {
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    // Fungsi kecil untuk memecah string YYYY-MM-DD dengan aman
    const parseDate = (dateStr: string) => {
      const parts = dateStr.split("-");
      return {
        y: parts[0],
        m: parts[1] ? months[parseInt(parts[1], 10) - 1] : "",
        d: parts[2] ? parseInt(parts[2], 10).toString() : "", // ParseInt membuang angka 0 di depan (05 -> 5)
      };
    };

    const start = parseDate(animeBanner.start_date);

    // Hanya proses jika data tanggalnya benar-benar lengkap (Tahun, Bulan, Hari)
    if (start.y && start.m && start.d) {
      if (animeBanner.end_date) {
        const end = parseDate(animeBanner.end_date);

        if (end.y && end.m && end.d) {
          if (start.y === end.y && start.m === end.m && start.d === end.d) {
            // Kasus 1: Film, Start dan End lengkap dan persis sama
            releaseText = `${start.d} ${start.m} ${start.y}`;
          } else if (start.y === end.y) {
            // Kasus 2: Start dan End lengkap dan pada tahun yang sama
            releaseText = `${start.d} ${start.m} - ${end.d} ${end.m} ${start.y}`;
          } else {
            // Kasus 3: Start dan End lengkap tapi beda tahun
            releaseText = `${start.d} ${start.m} ${start.y} - ${end.d} ${end.m} ${end.y}`;
          }
        }
      }

      // Kasus 4: Jika end_date tidak ada (atau tidak lengkap), tapi start_date lengkap
      if (!releaseText) {
        releaseText = `${start.d} ${start.m} ${start.y}`;
      }
    }
  }

  if (animeBanner) {
    if (sectionType === "upcoming") {
      const season = animeBanner.season;
      const year = animeBanner.year;
      const airedString = releaseText;

      if (season && year && airedString.length > 0) {
        releaseText = `${season.charAt(0).toUpperCase() + season.slice(1)} ${year} (${airedString})`;
      } else if (season && year) {
        releaseText = `${season.charAt(0).toUpperCase() + season.slice(1)} ${year}`;
      } else if (year) {
        releaseText = year.toString();
      } else {
        releaseText = "TBA";
      }
    }
  }

  return (
    <a
      href={char.url}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-sky-300 transition-all h-full group"
    >
      <div className="relative w-full aspect-[3/4] bg-slate-100 flex-shrink-0">
        <img
          src={char.image}
          alt={char.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {animeBanner && animeBanner.images.jpg.small_image_url && (
          <div className="absolute bottom-0 left-0 w-full bg-slate-900/85 backdrop-blur-sm text-white p-2 flex items-center gap-2">
            <img
              src={animeBanner.images.jpg.small_image_url}
              alt={animeBanner.title}
              className="w-6 h-6 object-cover rounded shadow flex-shrink-0"
            />
            <span className="text-[10px] font-bold line-clamp-2 leading-tight">
              {animeBanner.title}
            </span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1 bg-white z-10">
        <h4
          className="font-extrabold text-gray-800 text-sm line-clamp-1 mb-1"
          title={char.name}
        >
          {char.name}
        </h4>
        {releaseText && (
          <p className="text-[10px] text-sky-600 font-bold mb-2 capitalize">
            {releaseText}
          </p>
        )}

        <div
          className={`bg-slate-50 border border-slate-100 rounded-md p-2 flex-1 overflow-y-auto custom-scrollbar ${releaseText ? "max-h-20" : "max-h-24"}`}
        >
          {char.animes.map((anime: MappedAnimeRole, i: number) => (
            <div key={i} className="mb-2 last:mb-0">
              <p className="text-[10px] font-bold text-sky-700 leading-tight mb-0.5">
                {anime.title}
              </p>
              <p className="text-[10px] text-gray-500 italic leading-none">
                ({anime.role})
              </p>
            </div>
          ))}
        </div>
      </div>
    </a>
  );
};

// --- HALAMAN UTAMA ---
export default async function VoicingPage() {
  // 1. Ambil data dari Blob
  const { animeDB, personDB, topSeiyuuDB } = await getDashboardData();
  const voices: ScrapedVoiceRole[] = personDB?.voices || [];
  const topSeiyuus: TopSeiyuu[] = topSeiyuuDB || [];
  const seiyuuMALId = profile.seiyuu_MALid;

  // 2. Kalkulasi Sekilas Statistik
  const genreCounts: Record<string, number> = {};
  Object.values(animeDB).forEach((anime: CachedAnime) => {
    anime.genres?.forEach((g) => {
      genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
    });
  });

  const top5Genres = Object.entries(genreCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const uniqueCharsMap = new Map();
  voices.forEach((v) => {
    if (!uniqueCharsMap.has(v.character.mal_id)) {
      uniqueCharsMap.set(v.character.mal_id, v.character);
    }
  });

  const top3Chars = Array.from(uniqueCharsMap.values())
    .sort(
      (a: { favorites: number }, b: { favorites: number }) =>
        b.favorites - a.favorites,
    )
    .slice(0, 3);

  // Cari posisi seiyuu target dalam ranking
  const seiyuuIndex = topSeiyuus.findIndex((s) => s.mal_id === seiyuuMALId);
  let adjacentSeiyuus: (TopSeiyuu & { rank: number })[] = [];
  if (seiyuuIndex !== -1) {
    let start = seiyuuIndex - 1;
    let end = seiyuuIndex + 1;

    // Edge Cases: Jika peringkat 1 atau peringkat paling bawah
    if (start < 0) {
      start = 0;
      end = Math.min(topSeiyuus.length - 1, 2);
    } else if (end >= topSeiyuus.length) {
      end = topSeiyuus.length - 1;
      start = Math.max(0, topSeiyuus.length - 3);
    }

    for (let i = start; i <= end; i++) {
      if (topSeiyuus[i]) {
        adjacentSeiyuus.push({ ...topSeiyuus[i], rank: i + 1 });
      }
    }
  } else {
    adjacentSeiyuus = [];
  }

  // 3. Mapping Relasi (Karakter -> Riwayat Anime)
  const charAnimesMap = new Map<number, MappedAnimeRole[]>();
  voices.forEach((v) => {
    const animeId = v.anime.mal_id;
    const charId = v.character.mal_id;
    const animeInfo = animeDB[animeId];

    if (!animeInfo) return;

    if (!charAnimesMap.has(charId)) charAnimesMap.set(charId, []);

    const existing = charAnimesMap.get(charId)!;
    if (!existing.some((a) => a.id === animeId)) {
      existing.push({
        title: animeInfo.title,
        role: v.role,
        id: animeId,
      });
    }
  });

  // 4. Pembagian Airing dan Upcoming dari Blob
  const airingMap = new Map<number, MappedCharacter>();
  const upcomingMap = new Map<number, MappedCharacter>();
  const nowYear = new Date().getFullYear();

  voices.forEach((voice) => {
    const anime = animeDB[voice.anime.mal_id];
    const char = voice.character;

    if (!anime || !char) return;

    // Mapping
    const mappedAnimeBanner: MappedAnimeBanner = {
      title: anime.title,
      season: anime.season,
      year: anime.year,
      start_date: anime.start_date,
      end_date: anime.end_date,
      images: { jpg: { small_image_url: anime.image_url } },
    };

    if (anime.status === "currently_airing") {
      if (anime.year && anime.year >= nowYear - 1) {
        if (!airingMap.has(char.mal_id)) {
          airingMap.set(char.mal_id, {
            id: char.mal_id,
            name: char.name,
            image: char.image_url,
            url: `https://myanimelist.net/character/${char.mal_id}`,
            animes: charAnimesMap.get(char.mal_id) || [],
            airingAnime: mappedAnimeBanner,
          });
        }
      }
    } else if (anime.status === "not_yet_aired") {
      if (!upcomingMap.has(char.mal_id)) {
        upcomingMap.set(char.mal_id, {
          id: char.mal_id,
          name: char.name,
          image: char.image_url,
          url: `https://myanimelist.net/character/${char.mal_id}`,
          animes: charAnimesMap.get(char.mal_id) || [],
          upcomingAnime: mappedAnimeBanner,
        });
      }
    }
  });

  const airingChars = Array.from(airingMap.values());
  const upcomingChars = Array.from(upcomingMap.values());

  // 5. Mengetahui musim sekarang
  let nowSeason;
  // Filter hanya anime yang sedang tayang max 2 tahun terakhir dan memiliki kelengkapan data season & year
  const currentlyAiringAnimes = Object.values(animeDB).filter(
    (a) =>
      a.status === "currently_airing" &&
      a.season &&
      a.year &&
      a.year >= nowYear - 1,
  );

  if (currentlyAiringAnimes.length > 0) {
    // Bobot untuk sorting (Fall adalah kuartal 4/terbaru dalam setahun, Winter adalah kuartal 1/terlama)
    const seasonWeight: Record<string, number> = {
      winter: 1,
      spring: 2,
      summer: 3,
      fall: 4,
    };

    // Urutkan berdasarkan Tahun (Menurun) lalu Musim (Menurun)
    currentlyAiringAnimes.sort((a, b) => {
      const yearA = a.year || 0;
      const yearB = b.year || 0;

      // Prioritas 1: Tahun terbaru
      if (yearB !== yearA) {
        return yearB - yearA;
      }

      // Prioritas 2: Jika tahun sama, cari musim terbaru
      const weightA = seasonWeight[(a.season || "").toLowerCase()] || 0;
      const weightB = seasonWeight[(b.season || "").toLowerCase()] || 0;

      return weightB - weightA;
    });

    // Ambil anime urutan pertama (yang paling baru dirilis)
    const latestAiring = currentlyAiringAnimes[0];
    if (latestAiring && latestAiring.season) {
      const seasonText =
        latestAiring.season.charAt(0).toUpperCase() +
        latestAiring.season.slice(1) +
        " " +
        latestAiring.year;
      nowSeason = seasonText;
    }
  }

  return (
    <div className="space-y-12 pb-10">
      <section className="bg-slate-50 dark:bg-sky-50 border border-sky-100 p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Peran Karakter
        </h2>
        <p className="text-sm text-gray-600">
          Seluruh data pada halaman ini didapatkan secara hibrida melalui
          Scraper MyAnimeList Lokal dan Official MyAnimeList API.
        </p>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* ========================================== */}
          {/* KOLOM KIRI: Karakter & Genre               */}
          {/* ========================================== */}
          <div className="flex flex-col justify-between gap-8 h-full">
            {/* --- Top 3 Karakter Favorit --- */}
            <div>
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">
                🔥 Top 3 Karakter Favorit
              </h3>
              <div className="flex flex-col gap-3">
                {top3Chars.map((c, idx) => (
                  <a
                    href={`https://myanimelist.net/character/${c.mal_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={c.mal_id}
                    className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 hover:border-sky-300 transition-colors group"
                  >
                    <div className="font-extrabold text-slate-300 w-6 text-center">
                      #{idx + 1}
                    </div>
                    <img
                      src={c.image_url}
                      className="w-10 h-10 rounded-full object-cover group-hover:scale-105 transition-transform"
                      alt={c.name}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">
                        {c.name}
                      </p>
                      <p className="text-[10px] font-bold text-rose-500">
                        ❤️ {c.favorites.toLocaleString()}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* --- Top 5 Genre Anime --- */}
            <div>
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">
                🎬 Top 5 Genre Anime
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {top5Genres.map((genre, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 shadow-sm"
                  >
                    {genre.name}{" "}
                    <span className="text-sky-500 ml-1">{genre.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* KOLOM KANAN: Ranking Seiyuu & Tombol       */}
          {/* ========================================== */}
          <div className="flex flex-col justify-between gap-8 h-full">
            {/* --- Ranking Seiyuu --- */}
            <div>
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">
                🏆 Ranking Seiyuu
              </h3>
              <div className="flex flex-col gap-3">
                {adjacentSeiyuus.map((s) => (
                  <a
                    href={`https://myanimelist.net/people/${s.mal_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={s.mal_id}
                    className={`flex items-center gap-3 p-2 rounded-xl border transition-colors group ${
                      s.mal_id === seiyuuMALId
                        ? "bg-sky-100 border-sky-400 shadow-sm"
                        : "bg-white border-slate-200 hover:border-sky-300"
                    }`}
                  >
                    <div
                      className={`font-extrabold w-6 text-center ${
                        s.mal_id === seiyuuMALId
                          ? "text-sky-600"
                          : "text-slate-300"
                      }`}
                    >
                      #{s.rank}
                    </div>
                    <img
                      src={s.image_url}
                      className="w-10 h-10 rounded-full object-cover group-hover:scale-105 transition-transform"
                      alt={s.name}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold line-clamp-1 ${
                          s.mal_id === seiyuuMALId
                            ? "text-sky-800"
                            : "text-slate-800"
                        }`}
                      >
                        {s.name}
                      </p>
                      <p className="text-[10px] font-bold text-rose-500">
                        ❤️ {s.favorites.toLocaleString()}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* --- Tombol Full Statistik --- */}
            <div className="mt-6 md:mt-0 self-start md:self-end">
              <Link
                href="/voicing/stats"
                className="inline-flex items-center justify-center bg-slate-900 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-sky-600 transition-colors shadow-sm"
              >
                Lihat Full Statistik 📊
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEDANG TAYANG */}
      <section>
        <div className="flex items-center gap-2 mb-6 px-1">
          <div className="w-2 h-6 bg-sky-500 rounded-full animate-pulse"></div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Sedang Tayang{" "}
            {nowSeason && nowSeason.length > 0 ? "- " + nowSeason : ""}
          </h3>
        </div>

        {airingChars.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {airingChars.map((char) => (
              <CharacterCard
                key={char.id}
                char={char}
                animeBanner={char.airingAnime}
                sectionType="airing"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Tidak ada karakter yang sedang tayang saat ini.
          </p>
        )}
      </section>

      {/* AKAN DATANG */}
      <section>
        <div className="flex items-center gap-2 mb-6 px-1">
          <div className="w-2 h-6 bg-pink-500 rounded-full"></div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Akan Datang
          </h3>
        </div>

        {upcomingChars.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {upcomingChars.map((char) => (
              <CharacterCard
                key={char.id}
                char={char}
                animeBanner={char.upcomingAnime}
                sectionType="upcoming"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Tidak ada karakter yang akan datang saat ini.
          </p>
        )}
      </section>
    </div>
  );
}
