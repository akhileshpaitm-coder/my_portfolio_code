import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

const IMAGE_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

/**
 * Admin-only upload endpoint for project screenshots (images) and
 * demo videos. Files are stored under public/uploads/projects and served
 * at /uploads/projects/<name>.
 */
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

  const isImage = file.type in IMAGE_TYPES;
  const isVideo = file.type in VIDEO_TYPES;
  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PNG, JPG, WebP, GIF, MP4, WebM or MOV." },
      { status: 415 }
    );
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 413 });
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: "Video must be 100 MB or smaller." }, { status: 413 });
  }

  const ext = isImage ? IMAGE_TYPES[file.type] : VIDEO_TYPES[file.type];
  const kind = isImage ? "shots" : "videos";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;

  const dir = path.join(process.cwd(), "public", "uploads", "projects", kind);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({
    url: `/uploads/projects/${kind}/${safeName}`,
    kind: isImage ? "image" : "video",
  });
}
