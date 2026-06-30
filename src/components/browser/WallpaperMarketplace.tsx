"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Search, Download, Star, Check, Trash2, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { useWallpaperStore, type WallpaperType, type Wallpaper } from "@/lib/wallpaper-store";
import { useAuthStore } from "@/lib/auth-store";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const CATEGORIES: { id: WallpaperType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "gradient", label: "Gradients" },
  { id: "static", label: "Static" },
  { id: "animated", label: "Animated" },
  { id: "live", label: "Live" },
];

export function WallpaperMarketplace() {
  const isOpen = useWallpaperStore((s) => s.isMarketplaceOpen);
  const toggle = useWallpaperStore((s) => s.toggleMarketplace);
  const wallpapers = useWallpaperStore((s) => s.wallpapers);
  const activeWallpaperId = useWallpaperStore((s) => s.activeWallpaperId);
  const setActiveWallpaper = useWallpaperStore((s) => s.setActiveWallpaper);
  const addWallpaper = useWallpaperStore((s) => s.addWallpaper);
  const removeWallpaper = useWallpaperStore((s) => s.removeWallpaper);
  const incrementDownloads = useWallpaperStore((s) => s.incrementDownloads);

  const user = useAuthStore((s) => s.user);
  const isSignedIn = useAuthStore((s) => s.isSignedIn);

  const [category, setCategory] = useState<WallpaperType | "all">("all");
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = wallpapers
    .filter((w) => category === "all" || w.type === category)
    .filter((w) =>
      search.trim() === ""
        ? true
        : w.title.toLowerCase().includes(search.toLowerCase()) ||
          w.tags.some((t) => t.includes(search.toLowerCase()))
    )
    .sort((a, b) => Number(b.isBuiltin) - Number(a.isBuiltin) || b.createdAt - a.createdAt);

  const handleApply = (w: Wallpaper) => {
    setActiveWallpaper(w.id);
    if (!w.isBuiltin) incrementDownloads(w.id);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isSignedIn || !user) return;

    setIsUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const isAnimated = ["mp4", "webm"].includes(ext);
      const type: WallpaperType = isAnimated ? "animated" : "static";
      const fileId = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("wallpapers")
        .upload(fileId, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        if (uploadError.message.includes("Bucket not found")) {
          throw new Error("Storage bucket not created yet. Run the SQL migration (0002_wallpapers.sql) in your Supabase dashboard.");
        }
        throw uploadError;
      }

      const { data: urlData } = supabase.storage.from("wallpapers").getPublicUrl(fileId);
      const fileUrl = urlData.publicUrl;

      // Create wallpaper record
      const wp: Wallpaper = {
        id: Math.random().toString(36).slice(2, 12),
        title: file.name.replace(/\.[^/.]+$/, "").slice(0, 40),
        description: `Uploaded ${type} wallpaper`,
        type,
        fileUrl,
        thumbnailUrl: fileUrl,
        authorId: user.id,
        authorName: user.user_metadata?.name || user.email?.split("@")[0] || "User",
        tags: [type, "custom"],
        downloads: 0,
        rating: 0,
        isBuiltin: false,
        isPublic: false,
        createdAt: Date.now(),
      };

      addWallpaper(wp);
      setActiveWallpaper(wp.id);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Make sure you're signed in and the file is under 20MB.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggle(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md"
          />
          <motion.div
            initial={{ x: 520, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 520, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 34, mass: 0.9 }}
            className="glass-strong fixed right-0 top-0 z-50 flex h-full w-[520px] flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-4">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Wallpapers</h2>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]">
                  {wallpapers.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isSignedIn || isUploading}
                  className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--neon-soft)] px-2.5 text-[11px] font-semibold text-[var(--neon)] transition-all hover:scale-105 disabled:opacity-40"
                  title={isSignedIn ? "Upload custom wallpaper" : "Sign in to upload"}
                >
                  {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,image/gif"
                  onChange={handleUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => toggle(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="border-b border-[var(--border-hairline)] px-4 py-2">
              <div className="flex h-8 items-center gap-2 rounded-lg bg-black/10 px-2.5">
                <Search className="h-3 w-3 text-[var(--text-tertiary)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search wallpapers…"
                  className="flex-1 bg-transparent text-[12px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border-hairline)] px-4 py-2 scroll-nebula">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                    category === c.id
                      ? "bg-[var(--neon-soft)] text-[var(--neon)]"
                      : "text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Wallpaper grid */}
            <div className="flex-1 overflow-y-auto p-4 scroll-nebula">
              {filtered.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-[12px] text-[var(--text-tertiary)]">
                    No wallpapers found{search ? ` for "${search}"` : " in this category"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map((w, i) => (
                    <WallpaperCard
                      key={w.id}
                      wallpaper={w}
                      isActive={w.id === activeWallpaperId}
                      onApply={() => handleApply(w)}
                      onRemove={() => removeWallpaper(w.id)}
                      delay={i * 0.03}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer hint */}
            {!isSignedIn && (
              <div className="border-t border-[var(--border-hairline)] px-4 py-2 text-center text-[10px] text-[var(--text-tertiary)]">
                Sign in to upload and sync custom wallpapers across devices
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function WallpaperCard({
  wallpaper,
  isActive,
  onApply,
  onRemove,
  delay,
}: {
  wallpaper: Wallpaper;
  isActive: boolean;
  onApply: () => void;
  onRemove: () => void;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 320, damping: 28 }}
      whileHover={{ y: -2, scale: 1.02 }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border transition-colors",
        isActive
          ? "border-[var(--neon)] neon-ring"
          : "border-[var(--border-hairline)] hover:border-[var(--border-glass)]"
      )}
      onClick={onApply}
    >
      {/* Preview — shows gradient or image/video */}
      <div className="relative h-24 w-full overflow-hidden">
        {wallpaper.type === "gradient" && wallpaper.gradientCss ? (
          <div className="h-full w-full" style={{ background: wallpaper.gradientCss }} />
        ) : wallpaper.type === "animated" && wallpaper.fileUrl && !wallpaper.fileUrl.toLowerCase().endsWith(".gif") ? (
          <video
            src={wallpaper.fileUrl}
            className="h-full w-full object-cover"
            muted
            loop
            autoPlay
            playsInline
          />
        ) : wallpaper.fileUrl ? (
          <img
            src={wallpaper.fileUrl}
            alt={wallpaper.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-white/5 text-[var(--text-tertiary)]">
            No preview
          </div>
        )}

        {/* Active checkmark */}
        {isActive && (
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--neon)]">
            <Check className="h-3 w-3 text-[var(--bg-canvas)]" />
          </div>
        )}

        {/* Delete button for custom wallpapers */}
        {!wallpaper.isBuiltin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white/60 opacity-0 transition-opacity hover:bg-[#FF5F57] hover:text-white group-hover:opacity-100"
            title="Remove wallpaper"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}

        {/* Type badge */}
        <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/70 backdrop-blur-sm">
          {wallpaper.type}
        </span>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <div className="truncate text-[12px] font-semibold text-[var(--text-primary)]">
          {wallpaper.title}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
          {wallpaper.rating > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-[var(--neon)] text-[var(--neon)]" />
              {wallpaper.rating.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Download className="h-2.5 w-2.5" />
            {wallpaper.downloads}
          </span>
          {wallpaper.authorName && (
            <span className="truncate">· {wallpaper.authorName}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
