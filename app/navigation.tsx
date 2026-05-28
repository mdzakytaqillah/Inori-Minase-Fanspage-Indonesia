"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

export default function Navigation() {
  const pathname = usePathname();

  // Fungsi pembantu untuk mengecek halaman aktif
  const isActive = (path: string) => pathname === path;

  return (
    <nav
      className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex flex-row items-center justify-around h-[72px] z-50
                        md:relative md:w-24 md:h-screen md:flex-col md:border-r md:border-t-0 shadow-sm transition-all"
    >
      <div className="flex flex-row w-full items-center justify-around md:flex-col md:h-full md:justify-center md:pt-24 md:gap-8">
        {/* Nav: Info */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 hover:scale-110 transition-transform ${isActive("/") ? "text-blue-600" : "text-slate-400 hover:text-blue-600"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          <span className="text-[11px] font-medium">Info</span>
        </Link>

        {/* Nav: Blog */}
        <Link
          href="/blog"
          className={`flex flex-col items-center gap-1 hover:scale-110 transition-all ${isActive("/blog") ? "text-blue-600" : "text-slate-400 hover:text-blue-600"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
          <span className="text-[11px] font-medium">Blog</span>
        </Link>

        {/* Nav: Discography */}
        <Link
          href="/discography"
          className={`flex flex-col items-center gap-1 hover:scale-110 transition-all ${isActive("/discography") ? "text-blue-600" : "text-slate-400 hover:text-blue-600"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
          </svg>
          <span className="text-[11px] font-medium">Music</span>
        </Link>
      </div>
    </nav>
  );
}
