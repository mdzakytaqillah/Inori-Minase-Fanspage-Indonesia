import { Metadata } from "next";
import profile from "@/lib/profile.json";
import { getDashboardData, CachedAnime, TopSeiyuu } from "@/lib/syncBlob";
import GenreClient from "./GenreClient";

export const metadata: Metadata = { title: "Voice Role Statistics" };

const seiyuuMALId = profile.seiyuu_MALid;

const SeiyuuRow = ({ s, rank }: { s: TopSeiyuu; rank: number }) => (
  <a
    href={`https://myanimelist.net/people/${s.mal_id}`}
    target="_blank"
    rel="noopener noreferrer"
    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md ${
      s.mal_id === seiyuuMALId
        ? "bg-sky-50 border-sky-400"
        : "bg-white border-slate-100 hover:border-sky-200"
    }`}
  >
    <div
      className={`font-black text-xl w-10 text-center ${s.mal_id === seiyuuMALId ? "text-sky-600" : "text-slate-300"}`}
    >
      #{rank}
    </div>
    <img
      src={s.image_url}
      alt={s.name}
      className="w-14 h-14 rounded-full object-cover shadow-sm"
    />
    <div className="flex-1 min-w-0 flex items-center justify-between">
      <div>
        <p
          className={`font-bold text-lg line-clamp-1 ${s.mal_id === seiyuuMALId ? "text-sky-800" : "text-slate-800"}`}
        >
          {s.name}
        </p>
        <p className="text-sm text-slate-500 font-medium">
          {s.character_count} Karakter
        </p>
      </div>
      <div className="text-right ml-4">
        <p className="text-sm font-black text-rose-500">
          ❤️ {s.favorites.toLocaleString()}
        </p>
      </div>
    </div>
  </a>
);

export default async function StatsPage() {
  const { animeDB, personDB, topSeiyuuDB } = await getDashboardData();

  // 1. STATISTIK GENRE
  const genreMap: Record<string, CachedAnime[]> = {};

  Object.values(animeDB).forEach((anime: CachedAnime) => {
    if (!anime.genres || !Array.isArray(anime.genres)) return;

    anime.genres.forEach((g) => {
      if (!genreMap[g.name]) {
        genreMap[g.name] = [];
      }
      genreMap[g.name].push(anime);
    });
  });

  const sortedGenres = Object.entries(genreMap)
    .map(([name, animes]) => ({
      name,
      count: animes.length,
      animes,
      Id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    }))
    .sort((a, b) => b.count - a.count);

  // 2. TOP KARAKTER (Mutlak >= 1000 Favorit)
  const uniqueCharsMap = new Map();
  personDB?.voices.forEach((v) => {
    if (!uniqueCharsMap.has(v.character.mal_id)) {
      uniqueCharsMap.set(v.character.mal_id, v.character);
    }
  });

  const topChars = Array.from(uniqueCharsMap.values())
    .filter((char) => char.favorites >= 1000)
    .sort((a, b) => b.favorites - a.favorites);

  const topSeiyuus: TopSeiyuu[] = topSeiyuuDB || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12 bg-slate-50 min-h-screen">
      <header className="border-b pb-4">
        <h1 className="text-3xl font-black text-slate-800">
          Statistik Seiyuu & Karakter
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Data didapatkan dari MyAnimeList.
        </p>
      </header>

      {/* --- STATISTIK GENRE --- */}
      <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-800 mb-4">
          Statistik Genre Anime
        </h2>
        <GenreClient genres={sortedGenres} />
      </section>

      {/* --- TOP KARAKTER --- */}
      <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-extrabold text-slate-800">
            Karakter Terpopuler
          </h2>
          <p className="text-xs text-amber-600 font-semibold mt-0.5">
            *Data di bawah hanya menampilkan karakter yang memiliki jumlah
            favorit di MyAnimeList minimal 1.000 (≥ 1000).
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {topChars.map((char) => (
            <a
              key={char.mal_id}
              href={`https://myanimelist.net/character/${char.mal_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50 flex flex-col group hover:shadow-md transition-all"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-200">
                <img
                  src={char.image_url}
                  alt={char.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 bg-white flex-1 flex flex-col justify-between">
                <h4
                  className="text-xs font-bold text-slate-700 line-clamp-1"
                  title={char.name}
                >
                  {char.name}
                </h4>
                <p className="text-[11px] font-black text-rose-500 mt-1 flex items-center gap-1">
                  ❤️ {char.favorites.toLocaleString()}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* --- TOP 50 SEIYUU --- */}
      {topSeiyuus.length > 0 && (
        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-800">
              🏆 Peringkat Top Seiyuu
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              *Minimal telah memerankan 4 karakter berbeda.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Tampilkan 10 Teratas Secara Default */}
            {topSeiyuus.slice(0, 10).map((s, idx) => (
              <SeiyuuRow key={s.mal_id} s={s} rank={idx + 1} />
            ))}

            {/* List Sisanya disembunyikan dalam tag <details> */}
            {topSeiyuus.length > 10 && (
              <details className="group flex flex-col">
                <summary className="order-last pt-5 cursor-pointer list-none text-center outline-none">
                  <div className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 hover:bg-sky-600 text-white font-bold text-sm rounded-xl transition-colors shadow-sm">
                    <span className="group-open:hidden">
                      Lihat Peringkat {topSeiyuus.length} Besar ⬇️
                    </span>
                    <span className="hidden group-open:inline">
                      Tutup Peringkat ⬆️
                    </span>
                  </div>
                </summary>

                {/* Konten yang disembunyikan */}
                <div className="flex flex-col gap-3 pt-3">
                  {topSeiyuus.slice(10).map((s, idx) => (
                    <SeiyuuRow key={s.mal_id} s={s} rank={idx + 11} />
                  ))}
                </div>
              </details>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
