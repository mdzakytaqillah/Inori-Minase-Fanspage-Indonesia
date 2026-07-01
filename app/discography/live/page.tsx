"use client";

import data from "@/data.json";
import Link from "next/link";

export default function LiveHistoryPage() {
  const liveData = data.live_history;

  // Fungsi pengaman format tanggal
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "TBA";
    const dateObj = new Date(dateStr);
    return isNaN(dateObj.getTime())
      ? dateStr
      : dateObj.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
  };

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
        <Link
          href="/discography"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          💿 Kembali ke Discography
        </Link>
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
                    <p
                      className={`font-bold text-sm ${item.bluray_release[0] ? "text-gray-800" : "text-gray-400"}`}
                    >
                      {formatDate(item.bluray_release[0])}
                    </p>
                    <p
                      className={`text-xs text-purple-500 font-mono font-bold mt-1 ${item.bluray_release && item.bluray_release.length > 0 ? "" : "hidden"}`}
                    >
                      {item.bluray_release[1]}
                    </p>
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
                    <p
                      className={`font-bold text-sm ${item.audio_release ? "text-gray-800" : "text-gray-400"}`}
                    >
                      {formatDate(item.audio_release)}
                    </p>
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
                        className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100"
                      >
                        <span className="font-extrabold text-sky-600 text-sm min-w-[130px]">
                          {formatDate(l.date)}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">
                          {l.place}
                        </span>
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
    </div>
  );
}
