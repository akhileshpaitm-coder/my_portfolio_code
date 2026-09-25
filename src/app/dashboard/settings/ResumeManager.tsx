"use client";

import { useRef, useState } from "react";
import { FiUpload, FiTrash2, FiEye, FiFileText } from "react-icons/fi";
import { useToast } from "@/app/components/toast";

/**
 * Admin card for managing the downloadable resume: upload/replace the PDF,
 * open the current one, or delete it. Talks to /api/admin/resume.
 */
export default function ResumeManager({ initialUrl }: { initialUrl: string }) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [resumeUrl, setResumeUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [removing, setRemoving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploaded = Boolean(resumeUrl);

  async function upload(file: File) {
    if (file.type !== "application/pdf") {
      toast.error({
        title: "PDF only",
        description: "Please choose a .pdf file for the resume.",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error({
        title: "File too large",
        description: "The resume must be 10 MB or smaller.",
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    // XHR (not fetch) for upload progress events.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/resume");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      setUploading(false);
      try {
        const data = JSON.parse(xhr.responseText) as { url?: string; error?: string };
        if (xhr.status >= 200 && xhr.status < 300 && data.url) {
          setResumeUrl(data.url);
          toast.success({
            title: "Resume updated",
            description: "The Download Resume button is live on the site.",
          });
        } else {
          toast.error({
            title: "Upload failed",
            description: data.error ?? `Server responded ${xhr.status}.`,
          });
        }
      } catch {
        toast.error({ title: "Upload failed", description: "Unexpected server response." });
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      toast.error({ title: "Upload failed", description: "Network error — try again." });
    };

    const body = new FormData();
    body.append("file", file);
    xhr.send(body);
  }

  async function remove() {
    if (!confirm("Remove the resume? The Download Resume button will disappear from the site.")) {
      return;
    }
    setRemoving(true);
    try {
      const res = await fetch("/api/admin/resume", { method: "DELETE" });
      if (res.ok) {
        setResumeUrl("");
        toast.success({
          title: "Resume removed",
          description: "The download button is now hidden.",
        });
      } else {
        toast.error({ title: "Could not remove", description: `Server responded ${res.status}.` });
      }
    } catch {
      toast.error({ title: "Could not remove", description: "Network error — try again." });
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="glass mb-10 rounded-2xl p-6 sm:p-8">
      <h3 className="mb-1 text-lg font-semibold text-zinc-100">
        Resume <span className="gradient-text">Manager</span>
      </h3>
      <p className="mb-6 text-xs text-zinc-500">
        Upload your latest resume (PDF, max 10 MB). It is served from
        /api/resume with a fresh cache-bust on every upload, so visitors always
        get the newest version.
      </p>

      {/* Drop zone / file card */}
      {!uploaded ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void upload(f);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragOver
              ? "border-cyan-500/60 bg-cyan-500/10"
              : "border-zinc-700/60 hover:border-zinc-600 hover:bg-zinc-900/40"
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
            <FiUpload className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium text-zinc-200">
            Click or drop your resume here
          </span>
          <span className="text-xs text-zinc-500">PDF up to 10 MB</span>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
        </label>
      ) : (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                <FiFileText className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-zinc-200">
                  resume.pdf
                </div>
                <div className="text-xs text-zinc-500">
                  Live at /api/resume — replaced on each upload
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
              >
                <FiEye className="h-3.5 w-3.5" /> View
              </a>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading || removing}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300 disabled:opacity-60"
              >
                <FiUpload className="h-3.5 w-3.5" /> Replace
              </button>
              <button
                type="button"
                onClick={() => void remove()}
                disabled={uploading || removing}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 disabled:opacity-60"
              >
                <FiTrash2 className="h-3.5 w-3.5" /> {removing ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
