"use client";

import data from "@/data.json";
import { useState, useEffect } from "react";

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: () => void;
      };
    };
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

export default function BlogPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedBlog, setSelectedBlog] = useState<
    (typeof data.blog)[number] | null
  >(null);

  const blogs = data.blog;
  const totalPages = Math.ceil(blogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBlogs = blogs.slice(startIndex, startIndex + itemsPerPage);

  // Efek untuk memuat script pihak ketiga saat modal embed dibuka
  useEffect(() => {
    if (!selectedBlog || !selectedBlog.embed) return;

    const type = selectedBlog.embed.type;

    // Load TikTok Script
    if (type === "tiktok-embed") {
      if (!document.getElementById("tiktok-script")) {
        const script = document.createElement("script");
        script.id = "tiktok-script";
        script.src = "https://www.tiktok.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }

    // Load Twitter Script & Re-render
    if (type === "twitter-tweet") {
      if (!document.getElementById("twitter-script")) {
        const script = document.createElement("script");
        script.id = "twitter-script";
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        document.body.appendChild(script);
      } else if (window.twttr) {
        window.twttr.widgets.load();
      }
    }

    // Load Instagram Script & Re-render
    if (type === "instagram-media") {
      if (!document.getElementById("instagram-script")) {
        const script = document.createElement("script");
        script.id = "instagram-script";
        script.src = "//www.instagram.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
      } else if (window.instgrm) {
        window.instgrm.Embeds.process();
      }
    }
  }, [selectedBlog]);

  // Komponen Reusable untuk Pagination
  const renderPaginationControls = () => (
    <div className="flex justify-between items-center bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 my-4">
      <span className="text-sm text-gray-500">
        Hal <span className="font-bold text-gray-800">{currentPage}</span> /{" "}
        {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="px-2 py-1.5 text-gray-600 bg-slate-50 border rounded hover:bg-slate-100 disabled:opacity-50"
        >
          «
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm text-gray-600 bg-slate-50 border rounded hover:bg-slate-100 disabled:opacity-50"
        >
          Prev
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="px-2 py-1.5 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          »
        </button>
      </div>
    </div>
  );

  // Komponen Reusable untuk Merender Jenis Embed
  const renderEmbedContent = (embed: { type: string; source: string }) => {
    switch (embed.type) {
      case "youtube-embed":
        return (
          <div className="aspect-video w-full rounded overflow-hidden shadow-sm">
            <iframe
              width="100%"
              height="100%"
              src={embed.source}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>
        );
      case "facebook-embed":
        // Konversi link mentah menjadi link plugin facebook
        const fbUrl = `https://www.facebook.com/plugins/video.php?height=314&href=${encodeURIComponent(
          embed.source,
        )}`;
        return (
          <div className="w-full flex justify-center bg-white rounded overflow-hidden shadow-sm">
            <iframe
              src={fbUrl}
              width="560"
              height="314"
              style={{ border: "none", overflow: "hidden" }}
              scrolling="no"
              frameBorder="0"
              allowFullScreen={true}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            ></iframe>
          </div>
        );
      case "tiktok-embed":
        // Ekstrak Video ID dari URL Tiktok
        const tiktokVideoId = embed.source.split("/").pop();
        return (
          <div className="w-full flex justify-center">
            <blockquote
              className="tiktok-embed"
              cite={embed.source}
              data-video-id={tiktokVideoId}
              style={{ maxWidth: "605px", minWidth: "325px" }}
            >
              <section></section>
            </blockquote>
          </div>
        );
      case "twitter-tweet":
        return (
          <div className="w-full flex justify-center">
            <blockquote className="twitter-tweet">
              <a href={embed.source}></a>
            </blockquote>
          </div>
        );
      case "instagram-media":
        return (
          <div className="w-full flex justify-center">
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={embed.source}
              data-instgrm-version="14"
              style={{
                background: "#FFF",
                border: "0",
                borderRadius: "3px",
                boxShadow:
                  "0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)",
                margin: "1px",
                maxWidth: "540px",
                minWidth: "326px",
                padding: "0",
                width: "99.375%",
              }}
            >
              {/* Konten Placeholder (Akan digantikan oleh Script Instagram) */}
              <div style={{ padding: "16px" }}>
                <a
                  href={embed.source}
                  style={{
                    background: "#FFFFFF",
                    lineHeight: 0,
                    padding: 0,
                    textAlign: "center",
                    textDecoration: "none",
                    width: "100%",
                  }}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="text-blue-500 font-bold text-sm py-10">
                    View this post on Instagram
                  </div>
                </a>
              </div>
            </blockquote>
          </div>
        );
      default:
        return (
          <a
            href={embed.source}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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
            Buka Tautan Media
          </a>
        );
    }
  };

  return (
    <div>
      <div className="flex justify-between items-end border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Blog
        </h2>

        {/* Atur Batas Halaman */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <label>Tampilkan:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-400"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {renderPaginationControls()}

      {/* LIST BLOG */}
      <div className="grid gap-4">
        {currentBlogs.map((blog, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col"
          >
            <div className="flex flex-wrap gap-2 mb-2">
              {blog.category.map((cat, cIdx) => (
                <span
                  key={cIdx}
                  className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded"
                >
                  {cat}
                </span>
              ))}
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(blog.date).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {blog.title}
            </h3>

            {/* Tampilkan deskripsi dipotong (line-clamp-3) */}
            <div
              className="text-gray-600 text-sm line-clamp-3 mb-4 pointer-events-none"
              dangerouslySetInnerHTML={{ __html: blog.description }}
            />

            <button
              onClick={() => setSelectedBlog(blog)}
              className="mt-auto self-start text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              Baca Selengkapnya &rarr;
            </button>
          </div>
        ))}
      </div>

      {renderPaginationControls()}

      {/* MODAL BACA SELENGKAPNYA */}
      {selectedBlog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95">
            {/* Tombol Tutup Floating */}
            <button
              onClick={() => setSelectedBlog(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
            >
              ✕
            </button>

            <div className="p-6 md:p-8">
              <span className="text-sm text-gray-400 block mb-2">
                {new Date(selectedBlog.date).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-6">
                {selectedBlog.title}
              </h2>

              {/* Full Description */}
              <div
                className="prose prose-sm md:prose-base prose-blue text-gray-700 max-w-none text-justify"
                dangerouslySetInnerHTML={{ __html: selectedBlog.description }}
              />

              {/* Embed Handling */}
              {selectedBlog.embed && selectedBlog.embed.source && (
                <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase">
                    Media Terlampir ({selectedBlog.embed.type})
                  </h4>

                  {/* Panggil fungsi render embed disini */}
                  {renderEmbedContent(selectedBlog.embed)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
