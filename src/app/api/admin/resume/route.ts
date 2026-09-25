import { NextResponse } from "next/server";
import { mkdir, readdir, rm, writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { getSiteSettings, updateSettings } from "@/lib/settings";

export const runtime = "nodejs";

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Admin-only resume management. The resume lives at
 * public/uploads/resume/resume.pdf and is tracked in site settings via the
 * resume_url key (public path), so uploads survive redeploys of the code but
 * are intentionally not committed (see public/uploads/resume/.gitignore).
 *
 * POST   — replace the resume with an uploaded PDF
 * DELETE — remove the resume (button disappears from the site)
 * GET    — current resume info for the dashboard card
 */

function resumeDir(): string {
  return path.join(process.cwd(), "public", "uploads", "resume");
}

function resumePath(): string {
  return path.join(resumeDir(), "resume.pdf");
}

async function resumeExists(): Promise<boolean> {
  const settings = await getSiteSettings();
  if (!settings.resume_url) return false;
  try {
    await readdir(resumeDir());
    return true; // settings say present; file check is cheap on download
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getSiteSettings();
  return NextResponse.json({
    resume_url: settings.resume_url,
    uploaded: Boolean(settings.resume_url),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF resumes are supported." },
      { status: 415 }
    );
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json(
      { error: "Resume must be 10 MB or smaller." },
      { status: 413 }
    );
  }

  await mkdir(resumeDir(), { recursive: true });

  // Atomic-ish replace: write to a temp name then rename over the target.
  const tmpPath = path.join(resumeDir(), `.tmp-${Date.now()}.pdf`);
  await writeFile(tmpPath, Buffer.from(await file.arrayBuffer()));
  await rm(resumePath(), { force: true });
  await (await import("fs/promises")).rename(tmpPath, resumePath());

  const publicUrl = `/uploads/resume/resume.pdf?v=${Date.now()}`;
  await updateSettings({ resume_url: publicUrl });

  return NextResponse.json({ url: publicUrl, size: file.size });
}

export async function DELETE() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await rm(resumePath(), { force: true });
  await updateSettings({ resume_url: "" });

  return NextResponse.json({ ok: true });
}
