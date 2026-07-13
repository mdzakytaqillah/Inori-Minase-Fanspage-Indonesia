import { Metadata } from "next";
import Navigation from "./navigation";
import { ReactNode } from "react";
import profile from "@/lib/profile.json";
import "./globals.css";
//
export const metadata: Metadata = {
  title: {
    template: `%s | ${profile.name_global} Fanspage Indonesia`,
    default: `${profile.name_global} Fanspage Indonesia`,
  },
  description: `Situs ensiklopedia penggemar Indonesia untuk ${profile.name_global} (${profile.name}).`,
  keywords: [
    `${profile.name}`,
    `${profile.nickname}`,
    `${profile.name_global}`,
    `${profile.name_romanized}`,
    `${profile.nickname_romanized}`,
    "Fanspage",
    "Ensiklopedia",
    "Indonesia",
    "Seiyuu",
    "Voice Actress",
    "Voice Actor",
    "Singer",
    "Actress",
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="flex h-screen overflow-hidden font-sans">
        <Navigation />

        {/* AREA KONTEN UTAMA */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header Biru Opsional */}
          <header className="flex-none h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 flex items-center px-6 z-40">
            <h1 className="text-xl font-bold text-blue-600 tracking-tight">
              {profile.name_global} Fanspage Indonesia
            </h1>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8">
            <div className="max-w-6xl mx-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
