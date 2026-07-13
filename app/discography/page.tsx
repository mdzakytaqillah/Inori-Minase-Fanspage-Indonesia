"use client";

import discography from "@/lib/discography.json";
import profile from "@/lib/profile.json";
import { useState, useMemo } from "react";
import Link from "next/link";

interface Track {
  title: string;
  lyricist: string[];
  composer: string[];
  arranger: string[];
  note: string;
}

interface DiscButton {
  text: string;
  href: string;
}

interface DiscItem {
  id: string;
  title: string;
  numbering: string;
  stock_number: string;
  release_date: string;
  image_path: string;
  description: string;
  trackList: Track[];
  additional: string;
  buttons: DiscButton[];
  discType: "ALBUM" | "SINGLE";
}

interface IncludedDisc {
  type: string;
  title: string;
}

interface UniqueSongDetail {
  title: string;
  firstReleaseDate: string;
  firstReleaseType: string;
  firstReleaseTitle: string;
  includedIn: IncludedDisc[];
}

interface Involvement {
  discTitle: string[];
  trackTitle: string;
  roles: string[];
}

export default function DiscographyPage() {
  const [expandedTracks, setExpandedTracks] = useState<Record<string, boolean>>(
    {},
  );
  const [filterType, setFilterType] = useState<"ALL" | "ALBUM" | "SINGLE">(
    "ALL",
  );
  const [creditModal, setCreditModal] = useState<{
    name: string;
    involvements: Involvement[];
  } | null>(null);

  const [isSongModalOpen, setIsSongModalOpen] = useState<boolean>(false);

  // MENGOLAH DATA
  const { combinedDiscs, uniqueSongsList } = useMemo(() => {
    const albums = discography.album.map((d) => ({
      ...d,
      discType: "ALBUM" as const,
    }));
    const singles = discography.single.map((d) => ({
      ...d,
      discType: "SINGLE" as const,
    }));

    // Gabung dan urutkan dari yang terbaru (Descending)
    const combined: DiscItem[] = [...albums, ...singles].sort(
      (a, b) =>
        new Date(b.release_date).getTime() - new Date(a.release_date).getTime(),
    );

    const chronologicalDiscs = [...combined].reverse();
    const songMap = new Map<string, UniqueSongDetail>();

    chronologicalDiscs.forEach((disc) => {
      disc.trackList.forEach((track) => {
        const songTitle = track.title.trim();
        if (!songMap.has(songTitle)) {
          // Jika lagu ini baru pertama kali muncul
          songMap.set(songTitle, {
            title: songTitle,
            firstReleaseDate: disc.release_date,
            firstReleaseType: disc.discType,
            firstReleaseTitle: disc.title,
            includedIn: [],
          });
        } else {
          // Jika lagu sudah pernah dirilis, catat sebagai 'disertakan kembali'
          songMap.get(songTitle)!.includedIn.push({
            type: disc.discType,
            title: disc.title,
          });
        }
      });
    });

    return {
      combinedDiscs: combined,
      uniqueSongsList: Array.from(songMap.values()),
    };
  }, []);

  // FUNGSI FILTER ALBUM / SINGLE
  const filteredDiscs = useMemo(() => {
    if (filterType === "ALL") return combinedDiscs;
    return combinedDiscs.filter((disc) => disc.discType === filterType);
  }, [combinedDiscs, filterType]);

  // FUNGSI MENCARI KETERLIBATAN KREATOR
  const openCreditInfo = (name: string) => {
    const involvementsMap = new Map<
      string,
      { discTitle: Set<string>; roles: Set<string> }
    >();

    const reversedDiscs = combinedDiscs.slice().reverse();

    reversedDiscs.forEach((disc) => {
      disc.trackList.forEach((track) => {
        const roles: string[] = [];
        if (track.lyricist.includes(name)) roles.push("Lyricist");
        if (track.composer.includes(name)) roles.push("Composer");
        if (track.arranger.includes(name)) roles.push("Arranger");

        if (roles.length > 0) {
          if (!involvementsMap.has(track.title)) {
            involvementsMap.set(track.title, {
              discTitle: new Set(),
              roles: new Set(),
            });
          }
          const inv = involvementsMap.get(track.title)!;
          inv.discTitle.add(disc.title); // Tambahkan nama album/single ke daftar set
          roles.forEach((r) => inv.roles.add(r)); // Tambahkan role
        }
      });
    });

    const involvements: Involvement[] = Array.from(involvementsMap.entries())
      .map(([trackTitle, data]) => ({
        trackTitle,
        discTitle: Array.from(data.discTitle),
        roles: Array.from(data.roles),
      }))
      .reverse();
    setCreditModal({ name, involvements });
  };

  const toggleTracklist = (id: string) => {
    setExpandedTracks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-4 mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Discography
          </h2>
          <p className="text-sm text-gray-500">
            Daftar lengkap rilisan single dan album lagu {profile.name_global}.
          </p>
        </div>

        {/* INFO LIVE & TOTAL LAGU */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/discography/live"
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            🎤 Riwayat LIVE Concerts
          </Link>

          <button
            onClick={() => setIsSongModalOpen(true)}
            className="bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-colors px-4 py-2 rounded-xl flex items-center gap-3 text-left shadow-sm group"
          >
            <div className="bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold text-sm">
              {uniqueSongsList.length}
            </div>
            <div>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                Total Rilisan
              </p>
              <p className="text-xs font-bold text-gray-700">
                Lagu {profile.nickname_romanized}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* FILTER TYPE BUTTON */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterType("ALL")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterType === "ALL"
              ? "bg-slate-800 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Semua Rilisan
        </button>
        <button
          onClick={() => setFilterType("ALBUM")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterType === "ALBUM"
              ? "bg-purple-600 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Album
        </button>
        <button
          onClick={() => setFilterType("SINGLE")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterType === "SINGLE"
              ? "bg-teal-600 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Single
        </button>
      </div>

      {/* LIST ALBUM & SINGLE */}
      <div className="space-y-6">
        {filteredDiscs.map((disc) => {
          // Logika Kalkulasi Countdown hari perilisan
          let isUpcoming = false;
          let isToday = false;
          let diffDays = 0;

          const releaseDate = new Date(disc.release_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (releaseDate >= today) {
            const rDate = new Date(releaseDate.getTime());
            rDate.setHours(0, 0, 0, 0);

            const diffTime = rDate.getTime() - today.getTime();
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            isToday = diffDays === 0;
            isUpcoming = diffDays > 0 && diffDays <= 30;
          }

          return (
            <div
              key={disc.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6">
                {/* Cover Thumbnail */}
                <div className="relative w-full md:w-40 aspect-square bg-slate-100 rounded-lg flex-shrink-0 border border-slate-200 flex flex-col items-center justify-center text-slate-300 overflow-hidden group">
                  {disc.image_path ? (
                    <img
                      src={disc.image_path}
                      alt={disc.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
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
                      <span className="text-[10px] mt-2">
                        Cover Unavailable
                      </span>
                    </>
                  )}

                  {/* Overlay Tombol Play Digital */}
                  {disc.buttons.find(
                    (btn) => btn.text.toUpperCase() === "DIGITAL",
                  ) && (
                    <a
                      href={
                        disc.buttons.find(
                          (btn) => btn.text.toUpperCase() === "DIGITAL",
                        )?.href
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-2 right-2 w-10 h-10 bg-black/30 hover:bg-black/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all shadow-md"
                      title="Play Digital"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                        className="ml-0.5"
                      >
                        <path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" />
                      </svg>
                    </a>
                  )}
                </div>

                {/* Disc Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${disc.discType === "ALBUM" ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-teal-700"}`}
                    >
                      {disc.discType}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold uppercase rounded">
                      {disc.numbering}
                    </span>
                    {/* Info Rilis & Countdown */}
                    <span className="text-xs font-medium text-gray-400 ml-auto flex items-center gap-2">
                      {isUpcoming && (
                        <span className="bg-pink-50 text-pink-600 border border-pink-200 px-2 py-0.5 rounded-full font-bold animate-pulse text-[10px]">
                          ⏳ Rilis {diffDays} Hari Lagi!
                        </span>
                      )}
                      {isToday && (
                        <span className="bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded-full font-bold animate-pulse text-[10px]">
                          🎉 Rilis Hari Ini!
                        </span>
                      )}
                      Rilis:{" "}
                      {releaseDate.toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 mb-1">
                    {disc.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 font-mono">
                    {disc.stock_number}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 mt-auto">
                    <button
                      onClick={() => toggleTracklist(disc.id)}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
                    >
                      {expandedTracks[disc.id]
                        ? "Sembunyikan Tracks"
                        : `Lihat ${disc.trackList.length} Tracks`}
                    </button>

                    {/* Button */}
                    {disc.buttons
                      .filter((btn) => btn.text.toUpperCase() !== "DIGITAL")
                      .map((btn, bIdx) => (
                        <a
                          key={bIdx}
                          href={btn.href}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          {btn.text}
                        </a>
                      ))}
                  </div>
                </div>
              </div>

              {/* TRACKLIST TOGGLE SECTION */}
              {expandedTracks[disc.id] && (
                <div className="bg-slate-50 border-t border-slate-100 p-5 md:p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-3">
                    {disc.trackList.map((track, tIdx) => (
                      <div
                        key={tIdx}
                        className="p-4 bg-white rounded border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div>
                          <h4 className="font-bold text-gray-800 text-base mb-1">
                            <span className="text-gray-400 font-normal mr-2">
                              {(tIdx + 1).toString().padStart(2, "0")}.
                            </span>
                            {track.title}
                          </h4>
                          {track.note && (
                            <p className="text-xs text-blue-600 font-medium mb-2">
                              {track.note}
                            </p>
                          )}
                        </div>

                        {/* Credits */}
                        <div className="flex flex-col gap-1 text-[11px] md:text-xs">
                          <div className="flex items-start">
                            <span className="text-gray-400 w-16 flex-shrink-0">
                              Lyricist:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {track.lyricist.length === 0
                                ? "-"
                                : track.lyricist.map((name, i) => (
                                    <button
                                      key={i}
                                      onClick={() => openCreditInfo(name)}
                                      className="text-gray-700 hover:text-blue-600 hover:underline"
                                    >
                                      {name}
                                    </button>
                                  ))}
                            </div>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-400 w-16 flex-shrink-0">
                              Composer:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {track.composer.length === 0
                                ? "-"
                                : track.composer.map((name, i) => (
                                    <button
                                      key={i}
                                      onClick={() => openCreditInfo(name)}
                                      className="text-gray-700 hover:text-blue-600 hover:underline"
                                    >
                                      {name}
                                    </button>
                                  ))}
                            </div>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-400 w-16 flex-shrink-0">
                              Arranger:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {track.arranger.length === 0
                                ? "-"
                                : track.arranger.map((name, i) => (
                                    <button
                                      key={i}
                                      onClick={() => openCreditInfo(name)}
                                      className="text-gray-700 hover:text-blue-600 hover:underline"
                                    >
                                      {name}
                                    </button>
                                  ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL KREDIT (Keterlibatan Kreator) */}
      {creditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Kredit Kreator
                </span>
                <h3 className="text-xl font-bold text-gray-800">
                  {creditModal.name}
                </h3>
              </div>
              <button
                onClick={() => setCreditModal(null)}
                className="w-8 h-8 bg-white border border-gray-200 hover:bg-gray-100 rounded-full flex justify-center items-center text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <p className="text-sm text-gray-600 mb-4">
                Terlibat dalam produksi{" "}
                <strong className="text-blue-600">
                  {creditModal.involvements.length}
                </strong>{" "}
                lagu {profile.nickname_romanized}:
              </p>

              <div className="space-y-3">
                {creditModal.involvements.map((inv, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-gray-200 rounded-lg bg-white"
                  >
                    <p className="font-bold text-sm text-gray-800 mb-1">
                      {inv.trackTitle}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      Album/Single:{" "}
                      <span className="italic text-gray-600 font-medium">
                        {inv.discTitle.join(", ")}
                      </span>
                    </p>
                    <div className="flex gap-1.5">
                      {inv.roles.map((r, ri) => (
                        <span
                          key={ri}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] uppercase font-bold rounded-full"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIST SELURUH LAGU (TABEL) */}
      {isSongModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95">
            {/* Header Modal */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Daftar Seluruh Lagu {profile.name_global} (
                  {uniqueSongsList.length} Lagu)
                </h3>
              </div>
              <button
                onClick={() => setIsSongModalOpen(false)}
                className="flex-shrink-0 w-8 h-8 bg-white border border-gray-200 hover:bg-gray-100 rounded-full flex justify-center items-center text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Konten Tabel */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-white sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-100">
                  <tr>
                    <th className="py-3 px-4 text-slate-400 font-bold border-b border-slate-200 w-12 text-center">
                      No
                    </th>
                    <th className="py-3 px-4 text-slate-500 font-bold border-b border-slate-200 w-1/3">
                      Judul Lagu
                    </th>
                    <th className="py-3 px-4 text-slate-500 font-bold border-b border-slate-200">
                      Keterangan Historis
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueSongsList.map((song, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4 text-slate-300 font-black text-center align-top">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800 align-top">
                        {song.title}
                      </td>
                      <td className="py-4 px-4 text-slate-600 align-top">
                        <p className="leading-relaxed">
                          Dirilis tanggal{" "}
                          <strong className="text-sky-600">
                            {new Date(song.firstReleaseDate).toLocaleDateString(
                              "id-ID",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </strong>{" "}
                          pada {song.firstReleaseType.toLowerCase()}{" "}
                          <strong className="text-slate-800 italic">
                            {song.firstReleaseTitle}
                          </strong>
                        </p>

                        {song.includedIn.length > 0 && (
                          <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                              Disertakan kembali pada:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-slate-500 text-xs">
                              {song.includedIn.map((inc, i) => (
                                <li key={i}>
                                  {inc.type.toLowerCase()}{" "}
                                  <span className="font-semibold text-slate-700 italic">
                                    {inc.title}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
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
