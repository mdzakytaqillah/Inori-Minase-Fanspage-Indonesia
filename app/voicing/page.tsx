import { Metadata } from "next";
import { Suspense } from "react";
import {
  getInoriVoices,
  getAiringAnime,
  getUpcomingAnime,
  VoiceRole,
  JikanAnime,
} from "@/lib/jikan";
import RefreshButton from "./RefreshButton";
import { refreshAiringData, refreshUpcomingData } from "./actions";

export const metadata: Metadata = { title: "Voicing Data" };

// --- INTERFACES & HELPER COMPONENTS ---
interface JikanVoicesResponse {
  data: VoiceRole[];
}
interface JikanAnimeResponse {
  data: JikanAnime[];
}
interface MappedAnimeRole {
  title: string;
  role: string;
  id: number;
}
interface MappedCharacter {
  id: number;
  name: string;
  image: string;
  url: string;
  animes: MappedAnimeRole[];
  airingAnime?: JikanAnime;
  upcomingAnime?: JikanAnime;
}

const CharacterCard = ({
  char,
  animeBanner,
  sectionType,
}: {
  char: MappedCharacter;
  animeBanner?: JikanAnime;
  sectionType?: "airing" | "upcoming";
}) => {
  let releaseText = "";

  if (animeBanner) {
    if (sectionType === "upcoming") {
      const season = animeBanner.season;
      const year = animeBanner.year;
      const airedString = animeBanner.aired?.string;

      if (season && year) {
        releaseText = `${season.charAt(0).toUpperCase() + season.slice(1)} ${year}`;
      } else if (year) {
        releaseText = year.toString();
      } else if (airedString && /\d/.test(airedString)) {
        releaseText = airedString;
      } else {
        releaseText = "TBA";
      }
    } else if (sectionType === "airing") {
      const airedString = animeBanner.aired?.string;

      if (airedString && /\d/.test(airedString)) {
        releaseText = airedString;
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

function SectionSkeleton({ title }: { title: string }) {
  return (
    <section>
      <div className="flex justify-between items-center border-b pb-2 mb-6">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <div className="h-8 w-24 bg-slate-200 animate-pulse rounded-lg"></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full"
          >
            <div className="w-full aspect-[3/4] bg-slate-200 animate-pulse flex-shrink-0"></div>
            <div className="p-3 flex flex-col flex-1">
              <div className="h-4 w-3/4 bg-slate-200 animate-pulse rounded mb-2"></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- KOMPONEN DINAMIS 1: AIRING ANIME ---
async function AiringSection({
  fetchPromise,
}: {
  fetchPromise: Promise<[JikanVoicesResponse, JikanAnimeResponse]>;
}) {
  // Menerima Promise dari luar dan mengeksekusinya
  const [voicesData, nowData] = await fetchPromise;

  const voices: VoiceRole[] = voicesData?.data || [];
  const airingAnimeIds = new Set<number>(
    nowData?.data?.map((a: JikanAnime) => a.mal_id) || [],
  );

  // Filter peran yang masuk ke musim tayang saat ini
  const airingVoices = voices.filter((v) => airingAnimeIds.has(v.anime.mal_id));
  const airingCharacterIds = new Set(
    airingVoices.map((v) => v.character.mal_id),
  );

  // Kumpulkan data karakter dan seluruh riwayat animenya
  const charsMap = new Map<number, MappedCharacter>();

  voices.forEach((v) => {
    // Cek apakah karakter ini termasuk karakter yang sedang tayang
    if (airingCharacterIds.has(v.character.mal_id)) {
      if (!charsMap.has(v.character.mal_id)) {
        const voiceAnimeId = airingVoices.find(
          (av) => av.character.mal_id === v.character.mal_id,
        )?.anime.mal_id;
        const bannerAnime = nowData.data.find(
          (a: JikanAnime) => a.mal_id === voiceAnimeId,
        );

        charsMap.set(v.character.mal_id, {
          id: v.character.mal_id,
          name: v.character.name,
          image: v.character.images.jpg.image_url,
          url: v.character.url,
          animes: [],
          airingAnime: bannerAnime,
        });
      }
      // Masukkan semua anime yang pernah ada karakter ini ke dalam list
      charsMap.get(v.character.mal_id)!.animes.push({
        title: v.anime.title,
        role: v.role,
        id: v.anime.mal_id,
      });
    }
  });

  const chars = Array.from(charsMap.values());

  let sectionTitle = "Sedang Tayang";
  const firstValidAnime = nowData?.data?.find(
    (a: JikanAnime) => a.season && a.year,
  );
  if (firstValidAnime && firstValidAnime.season) {
    const seasonCapitalized =
      firstValidAnime.season.charAt(0).toUpperCase() +
      firstValidAnime.season.slice(1);
    sectionTitle = `Sedang Tayang - ${seasonCapitalized} ${firstValidAnime.year}`;
  }

  return (
    <section>
      <div className="flex justify-between items-center border-b pb-2 mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {sectionTitle}
        </h3>
        <RefreshButton action={refreshAiringData} label="Refresh" />
      </div>
      {chars.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {chars.map((char) => (
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
  );
}

// --- KOMPONEN DINAMIS 2: UPCOMING ANIME ---
async function UpcomingSection({
  waitPromise,
}: {
  waitPromise: Promise<unknown>;
}) {
  // Tunggu proses Airing selesai
  try {
    await waitPromise;
  } catch (e) {
    // Berhasil ataupun tidak proses airing, tetap lanjut ke proses upcoming
  }

  // Jalankan fetch Upcoming
  const [voicesData, upcomingData] = await Promise.all([
    getInoriVoices(),
    getUpcomingAnime(),
  ]);

  const voices: VoiceRole[] = voicesData?.data || [];
  const upcomingAnimeIds = new Set<number>(
    upcomingData?.data?.map((a: JikanAnime) => a.mal_id) || [],
  );

  // Filter peran yang masuk ke musim akan datang
  const upcomingVoices = voices.filter((v) =>
    upcomingAnimeIds.has(v.anime.mal_id),
  );
  const upcomingCharacterIds = new Set(
    upcomingVoices.map((v) => v.character.mal_id),
  );

  // Kumpulkan data karakter dan seluruh riwayat animenya
  const charsMap = new Map<number, MappedCharacter>();

  voices.forEach((v) => {
    // Cek apakah karakter ini termasuk karakter yang akan datang
    if (upcomingCharacterIds.has(v.character.mal_id)) {
      if (!charsMap.has(v.character.mal_id)) {
        const voiceAnimeId = upcomingVoices.find(
          (uv) => uv.character.mal_id === v.character.mal_id,
        )?.anime.mal_id;
        const bannerAnime = upcomingData.data.find(
          (a: JikanAnime) => a.mal_id === voiceAnimeId,
        );

        charsMap.set(v.character.mal_id, {
          id: v.character.mal_id,
          name: v.character.name,
          image: v.character.images.jpg.image_url,
          url: v.character.url,
          animes: [],
          upcomingAnime: bannerAnime,
        });
      }
      // Masukkan semua anime yang pernah ada karakter ini ke dalam list
      charsMap.get(v.character.mal_id)!.animes.push({
        title: v.anime.title,
        role: v.role,
        id: v.anime.mal_id,
      });
    }
  });

  const chars = Array.from(charsMap.values());

  return (
    <section>
      <div className="flex justify-between items-center border-b pb-2 mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Akan Datang
        </h3>
        <RefreshButton action={refreshUpcomingData} label="Refresh" />
      </div>
      {chars.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {chars.map((char) => (
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
  );
}

// --- HALAMAN UTAMA ---
export default function VoicingPage() {
  const airingFetchPromise = Promise.all([getInoriVoices(), getAiringAnime()]);

  return (
    <div className="space-y-12 pb-10">
      <section className="bg-slate-50 dark:bg-sky-50 border border-sky-100 p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Peran Karakter
        </h2>
        <p className="text-sm text-gray-600">
          Seluruh data pada halaman ini didapatkan melalui{" "}
          <a
            href="https://jikan.moe"
            target="_blank"
            rel="noreferrer"
            className="text-sky-600 hover:underline font-bold"
          >
            Jikan API,{" "}
          </a>
          Unofficial{" "}
          <a
            href="https://myanimelist.net"
            target="_blank"
            className="text-sky-600 hover:underline font-bold"
          >
            MyAnimeList
          </a>{" "}
          API.
        </p>
      </section>

      {/* Eksekusi Promise Airing */}
      <Suspense fallback={<SectionSkeleton title="Sedang Tayang" />}>
        <AiringSection fetchPromise={airingFetchPromise} />
      </Suspense>

      {/* Oper Promise Airing sebagai "Lampu Merah" untuk Upcoming */}
      <Suspense fallback={<SectionSkeleton title="Akan Datang" />}>
        <UpcomingSection waitPromise={airingFetchPromise} />
      </Suspense>
    </div>
  );
}
