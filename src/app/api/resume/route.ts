import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getSiteSettings } from "@/lib/settings";

export const runtime = "nodejs";

/**
 * GET /api/resume — public download of the latest uploaded resume.
 * Serves the file with a friendly filename and no-store so visitors always
 * get the newest version after an admin re-upload. 404 when no resume is
 * uploaded (the hero button is hidden in that case anyway).
 */
export async function GET() {
  const settings = await getSiteSettings();
  if (!settings.resume_url) {
    return NextResponse.json({ error: "Resume not available." }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", "resume", "resume.pdf");
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not a file");
    const data = await readFile(filePath);

    const year = new Date().getFullYear();
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(info.size),
        "Content-Disposition": `attachment; filename="Akhilesh_Prajapati_Resume_${year}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Resume not available." }, { status: 404 });
  }
}
