import { NextResponse, NextRequest } from "next/server";
import { runSmartSync, getTopSeiyuu, manualSyncAnime } from "@/lib/syncBlob";

export async function GET(request: NextRequest) {
  // Keamanan: Hanya bisa dijalankan di Localhost
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Tangkap parameter dari URL
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const idParam = searchParams.get("id");

  // ==========================================
  // MODE MANUAL
  // ==========================================
  if (type) {
    if (type === "anime" && idParam) {
      const id = parseInt(idParam, 10);

      if (isNaN(id)) {
        return NextResponse.json(
          { error: "ID harus berupa angka valid" },
          { status: 400 },
        );
      }
      const result = await manualSyncAnime(id);
      return NextResponse.json(result);
    } else if (type === "topseiyuu") {
      const result = await getTopSeiyuu();
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        {
          error:
            "Tipe tidak valid. Gunakan ?type=anime&id=(idAnime) atau ?type=topseiyuu",
        },
        { status: 400 },
      );
    }
  }

  // ==========================================
  // MODE FULL SYNC
  // ==========================================
  const result = await runSmartSync();
  return NextResponse.json({
    message: "Sinkronisasi Penuh Selesai",
    detail: result,
  });
}
