"use client";

import { useState } from "react";
import { CachedAnime } from "@/lib/syncBlob";

interface GenreData {
  name: string;
  count: number;
  animes: CachedAnime[];
  Id: string;
}

export default function GenreClient({ genres }: { genres: GenreData[] }) {
  const [selectedGenre, setSelectedGenre] = useState<GenreData | null>(null);

  return (
    <>
      {/* DAFTAR TOMBOL GENRE */}
      <div className="flex flex-wrap gap-2.5">
        {genres.map((genre) => (
          <button
            key={genre.Id}
            onClick={() => setSelectedGenre(genre)}
            className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-xl text-xs font-bold text-sky-800 hover:bg-sky-100 hover:border-sky-300 transition-colors cursor-pointer"
          >
            <span>{genre.name}</span>
            <span className="bg-sky-600 text-white px-1.5 py-0.5 rounded-md text-[10px]">
              {genre.count}
            </span>
          </button>
        ))}
      </div>

      {/* MODAL BOX GENRE */}
      {selectedGenre && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95">
            {/* HEADER MODAL */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Daftar Anime
                </span>
                <h3 className="text-xl font-bold text-gray-800">
                  Genre: {selectedGenre.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedGenre(null)}
                className="w-8 h-8 bg-white border border-gray-200 hover:bg-gray-100 rounded-full flex justify-center items-center text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* BODY MODAL */}
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50">
              <p className="text-sm text-gray-600 mb-4">
                {selectedGenre.name} -{" "}
                <strong className="text-sky-600">{selectedGenre.count}</strong>{" "}
                Anime
              </p>

              <div className="flex flex-col gap-3">
                {selectedGenre.animes.map((anime) => {
                  // Format Tanggal
                  let releaseText = anime.start_date || "TBA";
                  if (anime.season && anime.year) {
                    releaseText = `${anime.season.charAt(0).toUpperCase() + anime.season.slice(1)} ${anime.year}`;
                  } else if (anime.year) {
                    releaseText = anime.year.toString();
                  }

                  return (
                    <a
                      key={anime.mal_id}
                      href={`https://myanimelist.net/anime/${anime.mal_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-xl hover:border-sky-300 transition-colors group"
                    >
                      <img
                        src={anime.image_url}
                        alt={anime.title}
                        className="w-12 h-16 object-cover rounded shadow-sm group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-800 line-clamp-2">
                          {anime.title}
                        </p>
                        <p className="text-xs font-bold text-sky-600 mt-1 capitalize">
                          {releaseText}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
