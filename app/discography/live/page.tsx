"use client";

import data from "@/data.json";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";

// ==========================================
// STRICT INTERFACES
// ==========================================
interface LiveEvent {
  date: string;
  place: string;
  tracklist?: string[];
}

interface ButtonLink {
  name: string;
  href: string;
}

interface LiveHistoryItem {
  name: string;
  live: LiveEvent[];
  bluray_release?: string[];
  audio_release?: string;
  image_path: string[];
  buttons?: ButtonLink[];
}

interface LiveEventColumn {
  id: string;
  name: string;
  year: string;
  firstDate: Date;
}

interface SongLiveStat {
  title: string;
  releaseDate: Date;
  globalOrder: number;
  totalPerformances: number;
  performances: Record<string, "FIXED" | "ROTATION">;
}

interface Track {
  title: string;
}

interface DiscItem {
  release_date: string;
  trackList: Track[];
}

// ==========================================
// FUNGSI ALGORITMA DIFFING (LCS)
// ==========================================
// Berfungsi untuk mencocokkan array tracklist berdasarkan value dibandingkan komparasi absolut berdasarkan index.
const getTrackDiffs = (prev: string[], curr: string[]): boolean[] => {
  const m = prev.length;
  const n = curr.length;
  // Membuat matriks untuk dynamic programming
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (prev[i - 1] === curr[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Melacak kembali (backtrack) untuk menemukan lagu yang sama
  const isMatched = Array(n).fill(false);
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (prev[i - 1] === curr[j - 1]) {
      isMatched[j - 1] = true; // Lagu ini sama dan posisinya sesuai alur
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  // Jika tidak match, berarti itu lagu baru/berbeda/pindah urutan (True = Diff)
  return isMatched.map((matched) => !matched);
};

export default function LiveHistoryPage() {
  const liveData: LiveHistoryItem[] = data.live_history;

  // State untuk Modal Tracklist
  const [selectedLive, setSelectedLive] = useState<LiveHistoryItem | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<number>(0);
  const [prevTab, setPrevTab] = useState<number | null>(null);

  // State untuk Modal Tabel Statistik Lagu
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [sortConfig, setSortConfig] = useState<{
    by: "RELEASE" | "FREQUENCY";
    order: "ASC" | "DESC";
  }>({
    by: "RELEASE",
    order: "ASC",
  });

  // Kunci Scroll Halaman Saat Modal Terbuka
  useEffect(() => {
    if (selectedLive || isStatsModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedLive, isStatsModalOpen]);

  // Fungsi pengaman format tanggal
  const formatDate = (dateStr: string, type: "long" | "short" = "long") => {
    if (!dateStr) return "TBA / None";

    const dateObj = new Date(dateStr);

    // Jika format tanggal dari JSON tidak valid, kembalikan string aslinya
    if (isNaN(dateObj.getTime())) return dateStr;

    if (type === "short") {
      // Format pendek: DD-MM-YY
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = String(dateObj.getFullYear()).slice(-2);

      return `${day}-${month}-${year}`;
    }

    // Format panjang (Default): DD MMMM YYYY
    return dateObj.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Handler saat beralih hari di modal
  const handleTabChange = (newIdx: number) => {
    setPrevTab(activeTab); // Simpan value tab sebelumnya untuk perbandingan
    setActiveTab(newIdx);
  };

  // Handler untuk menutup modal
  const closeTracklistModal = () => {
    setSelectedLive(null);
    setActiveTab(0);
    setPrevTab(null);
  };
  const closeStatsModal = () => {
    setIsStatsModalOpen(false);
    setSortConfig({ by: "RELEASE", order: "ASC" });
  };

  const { liveColumns, songStatsMap } = useMemo(() => {
    const songStatsMap = new Map<string, SongLiveStat>();

    // Ekstrak dari Discography Resmi (Untuk Rilis & Urutan Track)
    const allDiscs: DiscItem[] = [
      ...data.discography[0].album,
      ...data.discography[0].single,
    ];
    allDiscs.sort(
      (a, b) =>
        new Date(a.release_date).getTime() - new Date(b.release_date).getTime(),
    );

    let globalCounter = 0;

    allDiscs.forEach((disc) => {
      const rDate = new Date(disc.release_date);
      disc.trackList.forEach((track) => {
        const t = track.title.trim();
        if (!songStatsMap.has(t)) {
          songStatsMap.set(t, {
            title: t,
            releaseDate: rDate,
            globalOrder: globalCounter++,
            totalPerformances: 0,
            performances: {},
          });
        }
      });
    });

    // Ekstrak Riwayat Live
    const columns: LiveEventColumn[] = [];
    const chronologicalLive = [...liveData].reverse();

    chronologicalLive.forEach((live) => {
      const validDays = live.live.filter(
        (l) => l.tracklist && l.tracklist.length > 0,
      );
      if (validDays.length === 0) return;

      const firstDateStr = live.live[0].date;
      const firstDate = new Date(firstDateStr);
      const year = isNaN(firstDate.getTime())
        ? "-"
        : firstDate.getFullYear().toString();

      const col: LiveEventColumn = {
        id: live.name,
        name: live.name,
        year,
        firstDate,
      };
      columns.push(col);

      const totalDays = validDays.length;
      const trackCounts = new Map<string, number>();

      validDays.forEach((day) => {
        // Gunakan Set per-hari agar jika dinyanyikan 2x di hari yang sama (misal medley/encore), dihitung 1 penayangan hari itu
        const uniqueSongsInDay = new Set(day.tracklist!.map((t) => t.trim()));
        uniqueSongsInDay.forEach((song) => {
          trackCounts.set(song, (trackCounts.get(song) || 0) + 1);
        });
      });

      trackCounts.forEach((count, song) => {
        if (!songStatsMap.has(song)) {
          // Jika lagu belum rilis (cover/belum terdaftar), letakkan di urutan paling belakang
          songStatsMap.set(song, {
            title: song,
            releaseDate: new Date("9999-12-31"),
            globalOrder: 999999 + globalCounter++,
            totalPerformances: 0,
            performances: {},
          });
        }

        const stat = songStatsMap.get(song)!;
        stat.totalPerformances += 1;
        // Jika jumlah hari dibawakan = total hari live tersebut, maka TETAP (FIXED)
        stat.performances[col.id] = count === totalDays ? "FIXED" : "ROTATION";
      });
    });

    return { liveColumns: columns, songStatsMap };
  }, [liveData]);

  const sortedSongStats = useMemo(() => {
    const statsArray = Array.from(songStatsMap.values());

    return statsArray.sort((a, b) => {
      let comparison = 0;
      if (sortConfig.by === "RELEASE") {
        comparison = a.globalOrder - b.globalOrder;
      } else if (sortConfig.by === "FREQUENCY") {
        if (a.totalPerformances !== b.totalPerformances) {
          comparison = a.totalPerformances - b.totalPerformances;
        } else {
          // Jika seri jumlah dibawakan, urutkan berdasarkan rilis
          comparison = a.globalOrder - b.globalOrder;
        }
      }
      return sortConfig.order === "ASC" ? comparison : -comparison;
    });
  }, [songStatsMap, sortConfig]);

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-4 mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Live History
          </h2>
          <p className="text-sm text-gray-500">
            Daftar lengkap riwayat konser dan pertunjukan Live Inori Minase.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsStatsModalOpen(true)}
            className="px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            📊 Statistik Lagu
          </button>
          <Link
            href="/discography"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            💿 Kembali ke Discography
          </Link>
        </div>
      </div>

      {/* LIST KARTU LIVE HISTORY */}
      <div className="space-y-8">
        {liveData.map((item, idx) => {
          const liveInfoBtn = item.buttons?.find((b) => b.name === "LIVE Info");
          const blurayInfoBtn = item.buttons?.find(
            (b) => b.name === "BluRay Info",
          );
          const audioInfoBtn = item.buttons?.find(
            (b) => b.name === "Audio Info",
          );
          const audioPlayBtn = item.buttons?.find(
            (b) => b.name === "Audio Digital",
          );
          const otherBtns = item.buttons?.filter(
            (b) =>
              ![
                "LIVE Info",
                "BluRay Info",
                "Audio Info",
                "Audio Digital",
              ].includes(b.name),
          );
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row group"
            >
              {/* Banner Section (Responsif) */}
              <div className="w-full md:w-2/5 lg:w-1/3 relative bg-slate-100 border-r border-gray-100 overflow-hidden">
                {item.image_path.length > 0 ? (
                  <img
                    src={item.image_path[0]}
                    alt={item.name}
                    className="w-full h-full object-cover aspect-video md:aspect-auto group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback logic: Jika gambar pertama error, gunakan gambar cadangan [1]
                      if (item.image_path[1]) {
                        e.currentTarget.src = item.image_path[1];
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center text-slate-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" />
                      <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                    </svg>
                    <span className="text-[10px] mt-2 font-bold uppercase tracking-wider">
                      No Image
                    </span>
                  </div>
                )}
              </div>

              {/* Informasi Konser Section */}
              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <h3 className="text-2xl font-black text-gray-800 leading-tight">
                    {item.name}
                  </h3>
                  {liveInfoBtn && (
                    <a
                      href={liveInfoBtn.href}
                      target="_blank"
                      rel="noreferrer"
                      title="Lihat Detail Live"
                      className="flex-shrink-0 mt-1 w-8 h-8 flex items-center justify-center bg-sky-100 text-sky-600 hover:bg-sky-600 hover:text-white rounded-full transition-colors shadow-sm"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"
                        />
                        <path
                          fillRule="evenodd"
                          d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"
                        />
                      </svg>
                    </a>
                  )}
                </div>

                {/* Box Rilis Media (Blu-ray & Audio) */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[140px] bg-purple-50/50 p-4 rounded-xl border border-purple-100 relative">
                    {blurayInfoBtn && (
                      <a
                        href={blurayInfoBtn.href}
                        target="_blank"
                        rel="noreferrer"
                        title="Info Blu-ray"
                        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center bg-purple-200 text-purple-600 hover:bg-purple-600 hover:text-white rounded-full transition-colors shadow-sm"
                      >
                        <span className="font-serif italic font-bold text-xs">
                          i
                        </span>
                      </a>
                    )}
                    <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1 pr-6">
                      💿 Blu-ray Release
                    </h4>
                    {item.bluray_release && item.bluray_release.length > 0 ? (
                      <>
                        <p
                          className={`font-bold text-sm ${item.bluray_release[0] ? "text-gray-800" : "text-gray-400"}`}
                        >
                          {formatDate(item.bluray_release[0])}
                        </p>
                        <p
                          className={`text-xs text-purple-500 font-mono font-bold mt-1`}
                        >
                          {item.bluray_release[1]}
                        </p>
                      </>
                    ) : (
                      <p className="font-bold text-gray-400 text-sm">TBA</p>
                    )}
                  </div>

                  <div className="flex-1 min-w-[140px] bg-teal-50/50 p-4 rounded-xl border border-teal-100 relative">
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {audioPlayBtn && (
                        <a
                          href={audioPlayBtn.href}
                          target="_blank"
                          rel="noreferrer"
                          title="Play Audio"
                          className="w-6 h-6 flex items-center justify-center bg-teal-200 text-teal-600 hover:bg-teal-600 hover:text-white rounded-full transition-colors shadow-sm"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                            className="ml-0.5"
                          >
                            <path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" />
                          </svg>
                        </a>
                      )}
                      {audioInfoBtn && (
                        <a
                          href={audioInfoBtn.href}
                          target="_blank"
                          rel="noreferrer"
                          title="Info Audio"
                          className="w-6 h-6 flex items-center justify-center bg-teal-200 text-teal-600 hover:bg-teal-600 hover:text-white rounded-full transition-colors shadow-sm"
                        >
                          <span className="font-serif italic font-bold text-xs">
                            i
                          </span>
                        </a>
                      )}
                    </div>
                    <h4 className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1 pr-16">
                      🎧 Audio Release
                    </h4>
                    {item.audio_release && item.audio_release.length > 0 ? (
                      <>
                        <p className={`font-bold text-gray-800 text-sm`}>
                          {formatDate(item.audio_release)}
                        </p>
                      </>
                    ) : (
                      <p className="font-bold text-gray-400 text-sm">TBA</p>
                    )}
                  </div>
                </div>

                {/* Detail Jadwal Live */}
                <div className="mb-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    📅 Jadwal & Lokasi Pelaksanaan
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {item.live.map((l, i) => (
                      <li
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 flex-1">
                          <span className="font-extrabold text-sky-600 text-sm min-w-[130px]">
                            {formatDate(l.date)}
                          </span>
                          <span className="text-sm font-semibold text-slate-700">
                            {l.place}
                          </span>
                        </div>
                        {l.tracklist && l.tracklist.length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedLive(item);
                              setActiveTab(i); // Langsung buka Tab hari yang di-klik
                              setPrevTab(null);
                            }}
                            className="flex-shrink-0 w-full sm:w-auto px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase rounded-md hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors shadow-sm"
                          >
                            📋 Tracklist
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Deretan Tombol Aksi */}
                {otherBtns && otherBtns.length > 0 && (
                  <div className="mt-auto pt-5 border-t border-gray-100 flex flex-wrap gap-3">
                    {otherBtns.map((btn, bIdx) => (
                      <a
                        key={bIdx}
                        href={btn.href}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700 transition-colors shadow-sm"
                      >
                        {btn.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* ========================================== */}
      {/* MODAL TRACKLIST (SISTEM DIFFING)           */}
      {/* ========================================== */}
      {selectedLive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95">
            {/* Header Modal */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Daftar Lagu (Tracklist)
                </span>
                <h3 className="text-xl font-bold text-gray-800 line-clamp-1">
                  {selectedLive.name}
                </h3>
              </div>
              <button
                onClick={closeTracklistModal}
                className="flex-shrink-0 w-8 h-8 bg-white border border-gray-200 hover:bg-gray-100 rounded-full flex justify-center items-center text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Tab Navigasi Hari */}
            {selectedLive.live.length > 1 && (
              <div className="flex overflow-x-auto gap-2 px-4 pt-4 border-b border-gray-100 bg-white custom-scrollbar flex-shrink-0">
                {selectedLive.live.map((l, idx) => {
                  if (!l.tracklist || l.tracklist.length === 0) return null;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleTabChange(idx)}
                      className={`px-6 py-2.5 whitespace-nowrap rounded-t-lg text-sm font-bold transition-all border-b-2 ${
                        activeTab === idx
                          ? "bg-slate-50 border-sky-600 text-sky-700"
                          : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                    >
                      D-{idx + 1}{" "}
                      <span className="font-normal opacity-80 text-xs ml-1">
                        ({formatDate(l.date, "short")})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* List Konten */}
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50 relative">
              {/* Detail Info Hari Terpilih */}
              <div className="mb-4 p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col gap-1">
                <p className="text-xs font-bold text-sky-600">
                  {formatDate(selectedLive.live[activeTab].date)}
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  📍 {selectedLive.live[activeTab].place}
                </p>
              </div>

              {selectedLive.live[activeTab].tracklist ? (
                (() => {
                  const currTracklist = selectedLive.live[activeTab].tracklist!;
                  const prevTracklist =
                    prevTab !== null && selectedLive.live[prevTab].tracklist
                      ? selectedLive.live[prevTab].tracklist!
                      : [];

                  // Panggil algoritma Diffing
                  const diffArray =
                    prevTracklist.length > 0
                      ? getTrackDiffs(prevTracklist, currTracklist)
                      : Array(currTracklist.length).fill(false);

                  return (
                    <ul className="flex flex-col gap-2">
                      {currTracklist.map((track, tIdx) => {
                        const isDiff = diffArray[tIdx];
                        const trackStat = songStatsMap.get(track);
                        const isFixed =
                          trackStat?.performances[selectedLive.name] ===
                          "FIXED";

                        return (
                          <li
                            key={tIdx}
                            className={`flex items-center gap-3 md:gap-4 p-3 rounded-xl border transition-all duration-300 ${
                              isDiff
                                ? "bg-amber-50 border-amber-300 shadow-sm transform scale-[1.01]"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            <span
                              className={`font-black w-6 text-right ${isDiff ? "text-amber-500" : "text-slate-300"}`}
                            >
                              {tIdx + 1}
                            </span>

                            <span
                              className={`flex-1 text-sm font-bold leading-tight ${isDiff ? "text-amber-900" : "text-slate-700"}`}
                            >
                              {track}
                            </span>

                            {/* Kumpulan Badge */}
                            <div className="flex flex-col sm:flex-row gap-1.5 flex-shrink-0 items-end">
                              {selectedLive.live.length > 1 && (
                                <span
                                  className={`text-[9px] uppercase font-bold px-2 py-1 rounded-md text-center ${
                                    isFixed
                                      ? "bg-slate-100 text-slate-500 border border-slate-200"
                                      : "bg-purple-100 text-purple-600 border border-purple-200"
                                  }`}
                                >
                                  {isFixed ? "📌 Tetap" : "🔀 Rotasi"}
                                </span>
                              )}

                              {isDiff && (
                                <span className="text-[9px] uppercase font-bold text-amber-600 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-md text-center animate-pulse">
                                  ✨ Berbeda
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <p className="font-bold">
                    Tracklist belum tersedia untuk hari ini.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL MATRIKS STATISTIK LAGU               */}
      {/* ========================================== */}
      {isStatsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
            {/* Header Modal */}
            <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Riwayat Penampilan
                </span>
                <h3 className="text-xl font-bold text-gray-800">
                  Matriks Frekuensi Lagu (Live Events)
                </h3>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto">
                {/* TOMBOL KONTROL SORTING */}
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                  <select
                    value={sortConfig.by}
                    onChange={(e) =>
                      setSortConfig((prev) => ({
                        ...prev,
                        by: e.target.value as "RELEASE" | "FREQUENCY",
                      }))
                    }
                    className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer pl-2 pr-1"
                  >
                    <option value="RELEASE">Urut: Album & Rilis</option>
                    <option value="FREQUENCY">Urut: Total Dibawakan</option>
                  </select>
                  <div className="w-[1px] h-4 bg-gray-200"></div>
                  <button
                    onClick={() =>
                      setSortConfig((prev) => ({
                        ...prev,
                        order: prev.order === "ASC" ? "DESC" : "ASC",
                      }))
                    }
                    className="text-xs font-bold text-sky-600 hover:text-sky-800 px-2 flex items-center justify-center min-w-[50px] transition-colors"
                  >
                    {sortConfig.order === "ASC" ? "ASC ⬇" : "DESC ⬆"}
                  </button>
                </div>

                <button
                  onClick={closeStatsModal}
                  className="flex-shrink-0 w-8 h-8 bg-white border border-gray-200 hover:bg-gray-100 rounded-full flex justify-center items-center text-gray-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Keterangan / Legend */}
            <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-wrap gap-x-6 gap-y-2 text-[11px] md:text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-3.5 h-3.5 rounded-full bg-sky-500"></div>
                <span>
                  <strong>Tetap:</strong> Dibawakan di setiap hari pada event
                  tersebut.
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-purple-500"></div>
                <span>
                  <strong>Rotasi:</strong> Hanya dibawakan pada hari tertentu
                  dalam event tersebut.
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-4 h-4 bg-slate-100 border border-slate-200 diagonal-stripes rounded-sm"></div>
                <span>
                  <strong>Belum Rilis:</strong> Lagu resmi dirilis{" "}
                  <i>setelah</i> event berlangsung.
                </span>
              </div>
            </div>

            {/* Tabel Konten */}
            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="py-3 px-4 text-slate-400 font-bold border-b border-r border-slate-200 w-12 text-center bg-slate-50">
                      No
                    </th>
                    {/* Kolom Nama Lagu dibuat sticky agar mudah melihat matriks ke kanan */}
                    <th className="py-3 px-4 text-slate-700 font-bold border-b border-r border-slate-200 sticky left-0 bg-slate-50 z-30 shadow-[1px_0_0_0_#e2e8f0]">
                      Judul Lagu
                    </th>
                    <th className="py-3 px-4 text-sky-700 font-bold border-b border-r border-slate-200 text-center bg-slate-50">
                      Total
                    </th>
                    {liveColumns.map((col) => (
                      <th
                        key={col.id}
                        className="py-3 px-3 text-slate-500 font-bold border-b border-r border-slate-200 text-center bg-slate-50 w-16"
                        title={col.name} // Tooltip Nama Event Lengkap
                      >
                        {col.year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedSongStats.map((song, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 hover:bg-sky-50/50 transition-colors"
                    >
                      <td className="py-2 px-4 text-slate-300 font-black text-center border-r border-slate-100">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-4 font-bold text-slate-700 border-r border-slate-200 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-sky-50/50">
                        {song.title}
                      </td>
                      <td className="py-2 px-4 font-black text-sky-600 text-center border-r border-slate-100">
                        {song.totalPerformances > 0
                          ? song.totalPerformances
                          : "-"}
                      </td>

                      {/* Pemetaan Matriks Marker */}
                      {liveColumns.map((col) => {
                        const status = song.performances[col.id];
                        // Grayout jika event live terjadi (tanggal pertama) SEBELUM lagu dirilis secara resmi
                        const isUnreleased =
                          col.firstDate.getTime() < song.releaseDate.getTime();

                        return (
                          <td
                            key={col.id}
                            className={`py-2 px-3 text-center border-r border-slate-100 ${isUnreleased ? "bg-slate-100" : ""}`}
                            title={
                              isUnreleased
                                ? "Lagu belum dirilis saat event ini"
                                : ""
                            }
                          >
                            {status === "FIXED" && (
                              <div
                                className="w-3.5 h-3.5 rounded-full bg-sky-500 mx-auto"
                                title="Tetap"
                              ></div>
                            )}
                            {status === "ROTATION" && (
                              <div
                                className="w-3.5 h-3.5 rounded-full border-2 border-purple-500 mx-auto"
                                title="Rotasi"
                              ></div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
