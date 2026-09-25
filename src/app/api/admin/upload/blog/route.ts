import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const IMAGE_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * Admin-only upload endpoint for blog images (featured images + images
 * inside article content). Files are stored under public/uploads/blog and
 * served at /uploads/blog/<name>.
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

  if (!(file.type in IMAGE_TYPES)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PNG, JPG, WebP or GIF." },
      { status: 415 }
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 413 });
  }

  const ext = IMAGE_TYPES[file.type];
  // Unique filename: timestamp + random suffix (original name is never kept).
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;

  const dir = path.join(process.cwd(), "public", "uploads", "blog");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({
    url: `/uploads/blog/${safeName}`,
    kind: "image",
  });
}
