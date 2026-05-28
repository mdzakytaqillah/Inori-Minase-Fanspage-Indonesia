import data from "@/data.json";
import Link from "next/link";

export default function ProfilePage() {
  // Kelompokkan Official Links berdasarkan tipe
  const officialLinks = data.official_links.reduce<
    Record<string, typeof data.official_links>
  >((acc, link) => {
    acc[link.type] = acc[link.type] || [];
    acc[link.type].push(link);
    return acc;
  }, {});

  return (
    <div className="space-y-12">
      {/* SECTION 1: STORY (TIMELINE) */}
      <section>
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Perjalanan Karir
          </h2>
        </div>

        <div className="relative border-l-2 border-blue-200 ml-3 md:ml-4 space-y-10">
          {data.story.map((st, idx) => (
            <div key={idx} className="relative pl-6 md:pl-8">
              {/* Bulatan Mark Tahun */}
              <div className="absolute w-5 h-5 bg-blue-600 rounded-full -left-[11px] top-1 border-4 border-slate-50 shadow-sm"></div>

              <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-extrabold text-sm rounded-md mb-3">
                  {st.year === "0" ? "Awal Mula" : st.year}
                </span>
                <p
                  className="text-gray-600 leading-relaxed text-sm md:text-base text-justify"
                  dangerouslySetInnerHTML={{ __html: st.description }}
                ></p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: OFFICIAL LINKS */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b pb-2">
          Tautan Resmi
        </h2>
        <div className="space-y-6">
          {Object.keys(officialLinks).map((type) => (
            <div
              key={type}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100"
            >
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                {type}
              </h3>
              <div className="flex flex-wrap gap-3">
                {officialLinks[type].map((link, idx) => (
                  <Link
                    key={idx}
                    href={link.url}
                    target="_blank"
                    className="px-4 py-2 bg-slate-50 text-slate-700 hover:bg-blue-600 hover:text-white border border-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: COMMUNITY LINKS */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b pb-2">
          Tautan Komunitas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.community_links.map((link, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full"
            >
              <span className="text-[10px] uppercase font-bold text-blue-500 mb-1">
                {link.type}
              </span>
              <h4 className="font-bold text-gray-800 text-lg mb-2">
                {link.name}
              </h4>
              <p className="text-sm text-gray-500 mb-4 flex-1">
                {link.description}
              </p>

              <Link
                href={link.url}
                target="_blank"
                className="mt-auto w-full text-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Kunjungi Portal
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
