"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getDashboardData,
  saveAnimeSync,
  saveTopSeiyuuDB,
  downloadBlobToLocal,
  TopSeiyuu,
} from "@/lib/syncBlob";
import { scrapePerson, fetchAnimeMAL, getTopPeopleIds } from "@/lib/getDataMAL";
import profile from "@/lib/profile.json";

export default function SyncDataDashboard() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [animeId, setAnimeId] = useState<string>("");
  const [MIN_CHARACTERS, setMinCharacters] = useState<number>(4);
  const [TARGET_TOTAL, setTargetTotal] = useState<number>(50);

  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="p-8 bg-white rounded-2xl shadow-sm text-center border border-red-100 max-w-md">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            🔒
          </div>
          <h1 className="text-2xl font-black text-red-600 mb-2">
            Akses Ditolak
          </h1>
          <p className="text-slate-600 font-medium leading-relaxed">
            Halaman Dashboard Sync Data ini dikunci dan hanya dapat diakses saat
            aplikasi berjalan pada mode{" "}
            <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">
              development
            </code>
            .
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sky-600 font-bold hover:underline"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString("id-ID", { hour12: false });
    const formattedMessage = `[${time}] ${message}`;
    setLogs((prev) => [...prev, formattedMessage]);
    console.log(formattedMessage);
  };

  const clearLogs = () => setLogs([]);

  const handleDownloadToLocal = async () => {
    setIsLoading(true);
    addLog(
      "⏳ Memulai proses pengunduhan seluruh basis data dari Vercel Blob...",
    );

    try {
      const result = await downloadBlobToLocal();

      result.logs.forEach((logMessage) => {
        addLog(logMessage);
      });

      addLog("🎉 Proses download selesai!");
    } catch (error) {
      addLog(`❌ Terjadi kesalahan: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // FUNGSI SINKRONISASI
  // ==========================================

  // 1. Sync Manual 1 Anime
  const handleSyncManual = async () => {
    if (!animeId.trim()) {
      addLog("⚠️ Peringatan: ID Anime tidak boleh kosong.");
      return;
    }
    const id = parseInt(animeId, 10);
    if (isNaN(id)) {
      addLog("⚠️ Peringatan: ID Anime tidak valid.");
      return;
    }
    setIsLoading(true);
    addLog(`⏳ Memulai sync manual untuk Anime ID: ${animeId}...`);

    try {
      const { animeDB, personDB } = await getDashboardData();
      if (!personDB)
        throw new Error(
          "Data Person kosong. Lakukan Sync Semua Anime terlebih dahulu.",
        );

      const isExist = personDB.voices.some((v) => v.anime.mal_id === id);
      if (!isExist) throw new Error("Anime ini tidak ada dalam riwayat peran.");

      addLog(`🔄 Menarik data dari Official MAL API...`);
      const animeData = await fetchAnimeMAL(id);

      if (animeData) {
        animeDB[id] = animeData;
        addLog(`⏳ Menyimpan ke Vercel Blob...`);
        await saveAnimeSync(personDB, animeDB);
        addLog(`✅ Berhasil! Anime '${animeData.title}' tersimpan.`);
        setAnimeId("");
      } else {
        throw new Error("Data tidak ditemukan di MAL.");
      }
    } catch (error: unknown) {
      addLog(`❌ Gagal sync Anime ID ${animeId}: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Sync Top Seiyuu
  const handleSyncTopSeiyuuData = async () => {
    setIsLoading(true);
    addLog(
      `⏳ Memulai proses scraping Top ${TARGET_TOTAL} Seiyuu (Min. Peran: ${MIN_CHARACTERS})...`,
    );
    addLog(
      `ℹ️ Proses ini mengeksekusi banyak halaman, mohon tunggu beberapa saat.`,
    );

    try {
      const validSeiyuu: TopSeiyuu[] = [];
      let limit = 0;

      while (validSeiyuu.length < TARGET_TOTAL) {
        addLog(`🔄 Mengambil tabel peringkat halaman ${limit / 50 + 1}...`);
        const ids = await getTopPeopleIds(limit);
        if (ids.length === 0) {
          addLog(
            "⚠️ Tidak ada lagi data seiyuu yang ditemukan di MyAnimeList.",
          );
          break;
        }

        for (const id of ids) {
          if (validSeiyuu.length >= TARGET_TOTAL) break;

          const person = await scrapePerson(id);
          if (person) {
            const charCount = new Set(
              person.voices.map((v) => v.character.mal_id),
            ).size;

            if (charCount >= MIN_CHARACTERS) {
              validSeiyuu.push({
                mal_id: person.mal_id,
                name: person.name,
                image_url: person.image_url,
                favorites: person.favorites,
                character_count: charCount,
              });
              addLog(
                `  ✅ [LOLOS] ${person.name} (${validSeiyuu.length}/${TARGET_TOTAL}) - ${person.favorites} Fav. - Memiliki peran sebanyak ${charCount} karakter`,
              );
            } else if (charCount == 0) {
              addLog(
                `  ❌ [SKIP] ${person.name} bukan seiyuu dan tidak pernah memiliki peran karakter.`,
              );
            } else {
              addLog(
                `  ❌ [SKIP] ${person.name} bukan seiyuu - Hanya memiliki peran sebanyak ${charCount} karakter.`,
              );
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        limit += 50;
      }

      addLog(`⏳ Menyimpan database Top Seiyuu ke Vercel Blob...`);
      await saveTopSeiyuuDB(validSeiyuu);
      addLog(`🎉 Sinkronisasi Top Seiyuu Selesai!`);
    } catch (error: unknown) {
      addLog(`❌ Gagal sync Top Seiyuu: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Sync Semua Anime
  const handleSyncAllAnime = async () => {
    setIsLoading(true);
    addLog(`⏳ Memulai sync SEMUA data anime...`);

    try {
      addLog(`🔄 Mengambil cache database lokal dari Blob...`);
      const { animeDB } = await getDashboardData();

      if (isNaN(profile.seiyuu_MALid)) {
        addLog("⚠️ Peringatan: Konfigurasi ID Person tidak valid / kosong.");
        return;
      }
      addLog(
        `🔄 Menarik profil & peran ${profile.name_global} (ID: ${profile.seiyuu_MALid}) dari MAL...`,
      );
      const person = await scrapePerson(profile.seiyuu_MALid);
      if (!person)
        throw new Error(
          `Gagal menarik data profile ID:${profile.seiyuu_MALid} dari MAL.`,
        );

      const uniqueAnimeIds = Array.from(
        new Set(person.voices.map((v) => v.anime.mal_id)),
      );
      addLog(`✅ Ditemukan ${uniqueAnimeIds.length} judul anime terkait.`);

      let updatedCount = 0;

      for (let i = 0; i < uniqueAnimeIds.length; i++) {
        const id = uniqueAnimeIds[i];
        const existing = animeDB[id];

        if (
          existing &&
          existing.status !== "currently_airing" &&
          existing.status !== "not_yet_aired"
        ) {
          continue; // Skip anime yang sudah selesai tayang dan sudah tersimpan, hanya melakukan fetch data anime baru / ongoing / upcoming
        }

        addLog(
          `🔄 [${i + 1}/${uniqueAnimeIds.length}] Menarik Data Anime ID: ${id}...`,
        );
        const animeData = await fetchAnimeMAL(id);

        if (animeData) {
          animeDB[id] = animeData;
          updatedCount++;
          addLog(`  ✅ Berhasil ditarik: ${animeData.title}`);
        }

        // Jeda waktu agar tidak spam API MAL
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      addLog(
        `⏳ Menyimpan ${updatedCount} anime yang diperbarui ke Vercel Blob...`,
      );
      await saveAnimeSync(person, animeDB);
      addLog(`🎉 Data peran anime berhasil disimpan.`);
    } catch (error: unknown) {
      addLog(`❌ Terjadi kesalahan sistem: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 md:p-10 min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Administrator Dashboard
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Pusat kontrol sinkronisasi data MyAnimeList ke Vercel Blob.
          </p>
        </div>
        <Link
          href="/"
          className="px-5 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold rounded-xl text-sm transition-colors"
        >
          Kembali ke Web
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PANEL KONTROL KIRI */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              Sync Semua Anime
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              Melakukan sinkronisasi pembaruan peran karakter untuk seluruh ID
              Anime yang ada di dalam database secara iteratif.
            </p>
            <button
              onClick={handleSyncAllAnime}
              disabled={isLoading}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              Mulai Sync Semua Anime
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              Sync Top {TARGET_TOTAL} Seiyuu
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              Memicu scraper untuk memperbarui daftar peringkat Seiyuu dari MAL
              (Syarat minimal memiliki {MIN_CHARACTERS} peran karakter berbeda).
              Proses memakan waktu cukup lama.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Target Total
                </label>
                <input
                  type="number"
                  value={TARGET_TOTAL}
                  onChange={(e) =>
                    setTargetTotal(
                      Math.max(1, parseInt(e.target.value, 10) || 0),
                    )
                  }
                  disabled={isLoading}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Min. Karakter
                </label>
                <input
                  type="number"
                  value={MIN_CHARACTERS}
                  onChange={(e) =>
                    setMinCharacters(
                      Math.max(1, parseInt(e.target.value, 10) || 0),
                    )
                  }
                  disabled={isLoading}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleSyncTopSeiyuuData}
              disabled={isLoading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              Mulai Sync Top Seiyuu
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              Sync Anime Manual
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              Tarik dan sinkronkan data secara spesifik hanya untuk 1 judul
              Anime.
            </p>
            <div className="flex flex-col gap-3">
              <input
                type="number"
                value={animeId}
                onChange={(e) => setAnimeId(e.target.value)}
                placeholder="MAL Anime ID (Misal: 28725)"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all"
              />
              <button
                onClick={handleSyncManual}
                disabled={isLoading || !animeId}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Sync Anime Ini
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              Backup Data ke Lokal
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              Mengunduh data JSON terupdate dari Vercel Blob dan menyimpannya ke
              dalam folder lokal Anda.
            </p>
            <button
              onClick={handleDownloadToLocal}
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              Download Data
            </button>
          </div>
        </div>

        {/* PANEL TERMINAL KANAN */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex flex-col h-[600px]">
          <div className="bg-slate-950 px-5 py-3 flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">
                Terminal Logs
              </span>
            </div>
            <button
              onClick={clearLogs}
              disabled={isLoading}
              className="text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
            >
              Clear Logs
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1 font-mono text-sm space-y-1.5 custom-scrollbar">
            {logs.length === 0 ? (
              <span className="text-slate-600">
                Menunggu eksekusi sinkronisasi...
              </span>
            ) : (
              logs.map((log, idx) => {
                let colorClass = "text-green-400";
                if (log.includes("❌")) colorClass = "text-red-400 font-bold";
                if (log.includes("✅")) colorClass = "text-sky-400";
                if (
                  log.includes("⏳") ||
                  log.includes("ℹ️") ||
                  log.includes("🔄")
                )
                  colorClass = "text-yellow-400";

                return (
                  <div
                    key={idx}
                    className={`${colorClass} break-words leading-relaxed`}
                  >
                    {log}
                  </div>
                );
              })
            )}
            {isLoading && (
              <div className="text-slate-500 animate-pulse mt-2">
                _ Sedang berjalan...
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
