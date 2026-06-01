"use client";

import { useState, useTransition } from "react";

export default function RefreshButton({
  action,
  label,
}: {
  action: () => Promise<void>;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [cooldown, setCooldown] = useState(0);

  const handleRefresh = () => {
    if (cooldown > 0 || isPending) return;

    startTransition(async () => {
      await action(); // Jalankan Server Action (Fetch ulang data ke Jikan API)

      // Mulai Cooldown 5 detik setelah proses selesai
      setCooldown(5);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={cooldown > 0 || isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-sky-200 text-sky-700 text-xs font-bold rounded-lg shadow-sm hover:bg-sky-50 focus:ring-2 focus:ring-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
        className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>
      {isPending
        ? "Mengambil Data..."
        : cooldown > 0
          ? `Tunggu (${cooldown}s)`
          : label}
    </button>
  );
}
