import type { DownloadKind } from "./browser-store";

const EXT_MAP: Record<string, DownloadKind> = {
  // images
  jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image",
  svg: "image", bmp: "image", ico: "image", avif: "image",
  // pdf
  pdf: "pdf",
  // text
  txt: "text", md: "text", rtf: "text", csv: "text", log: "text",
  // video
  mp4: "video", mov: "video", avi: "video", mkv: "video", webm: "video",
  // audio
  mp3: "audio", wav: "audio", flac: "audio", aac: "audio", ogg: "audio",
  // archive
  zip: "archive", rar: "archive", "7z": "archive", tar: "archive", gz: "archive",
  // code
  js: "code", ts: "code", tsx: "code", jsx: "code", py: "code", rb: "code",
  go: "code", rs: "code", java: "code", c: "code", cpp: "code", h: "code",
  html: "code", css: "code", scss: "code", json: "code", yaml: "code", yml: "code",
  sh: "code", sql: "code",
};

export function classifyFile(name: string, mime?: string): DownloadKind {
  if (mime) {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    if (mime === "application/pdf") return "pdf";
    if (mime.startsWith("text/")) return "text";
    if (mime.includes("zip") || mime.includes("compressed") || mime.includes("tar")) return "archive";
  }
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MAP[ext] ?? "file";
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export const DOWNLOAD_KIND_LABEL: Record<DownloadKind, string> = {
  image: "Image",
  pdf: "PDF",
  text: "Text",
  video: "Video",
  audio: "Audio",
  archive: "Archive",
  code: "Code",
  file: "File",
};

export const DOWNLOAD_KIND_ICON: Record<DownloadKind, string> = {
  image: "🖼",
  pdf: "📄",
  text: "📝",
  video: "🎬",
  audio: "🎵",
  archive: "📦",
  code: "⌘",
  file: "📄",
};

/** Returns true if a file's content can be previewed inline (as text or image). */
export function isPreviewable(kind: DownloadKind): boolean {
  return kind === "image" || kind === "text" || kind === "code" || kind === "pdf";
}

/** Returns true if a file's text content can be read and attached to AI. */
export function isAiAttachable(kind: DownloadKind): boolean {
  return kind === "text" || kind === "code";
}
