"use client";

import { useWallpaperStore } from "@/lib/wallpaper-store";

/**
 * Renders the active wallpaper as a background layer.
 * Used behind the New Tab Page and optionally behind the whole browser chrome.
 *
 * Supports:
 * - Gradient wallpapers (CSS background)
 * - Static wallpapers (image)
 * - Animated wallpapers (video, muted + looping)
 */
export function WallpaperBackground({ fullScreen = false }: { fullScreen?: boolean }) {
  const activeWallpaperId = useWallpaperStore((s) => s.activeWallpaperId);
  const wallpapers = useWallpaperStore((s) => s.wallpapers);
  const wallpaper = wallpapers.find((w) => w.id === activeWallpaperId);

  if (!wallpaper) return null;

  const containerStyle: React.CSSProperties = fullScreen
    ? {
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }
    : {
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      };

  return (
    <div style={containerStyle}>
      {wallpaper.type === "gradient" && wallpaper.gradientCss ? (
        <div
          className="h-full w-full"
          style={{ background: wallpaper.gradientCss }}
        />
      ) : wallpaper.type === "animated" && wallpaper.fileUrl ? (
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
          alt=""
          className="h-full w-full object-cover"
        />
      ) : null}

      {/* Dark overlay for readability (glass surfaces sit on top of this) */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(8,8,10,0.3) 0%, rgba(8,8,10,0.5) 100%)",
        }}
      />
    </div>
  );
}
