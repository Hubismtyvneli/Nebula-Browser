"use client";

import { useWallpaperStore } from "@/lib/wallpaper-store";

/**
 * Renders the active wallpaper as a background layer.
 * Used behind the New Tab Page and optionally behind the whole browser chrome.
 *
 * Supports:
 * - Gradient wallpapers (CSS background)
 * - Static wallpapers (image — including GIFs which animate natively in <img>)
 * - Animated wallpapers (MP4/WebM video, muted + looping)
 */
export function WallpaperBackground({ fullScreen = false }: { fullScreen?: boolean }) {
  const activeWallpaperId = useWallpaperStore((s) => s.activeWallpaperId);
  const wallpapers = useWallpaperStore((s) => s.wallpapers);
  const wallpaper = wallpapers.find((w) => w.id === activeWallpaperId);

  if (!wallpaper) return null;

  const containerStyle: React.CSSProperties = fullScreen
    ? { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }
    : { position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" };

  // Check if the file is a GIF — GIFs animate natively in <img>, don't need <video>
  const isGif = wallpaper.fileUrl?.toLowerCase().endsWith(".gif") ?? false;
  const isVideo = wallpaper.type === "animated" && wallpaper.fileUrl && !isGif;

  return (
    <div style={containerStyle}>
      {wallpaper.type === "gradient" && wallpaper.gradientCss ? (
        <div className="h-full w-full" style={{ background: wallpaper.gradientCss }} />
      ) : isVideo ? (
        <video
          src={wallpaper.fileUrl}
          className="h-full w-full object-cover"
          muted
          loop
          autoPlay
          playsInline
        />
      ) : wallpaper.fileUrl ? (
        // Images AND GIFs — both render in <img>, GIFs animate automatically
        <img
          src={wallpaper.fileUrl}
          alt=""
          className="h-full w-full object-cover"
          style={{ imageRendering: "auto" }}
        />
      ) : null}

      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(8,8,10,0.3) 0%, rgba(8,8,10,0.5) 100%)",
        }}
      />
    </div>
  );
}
