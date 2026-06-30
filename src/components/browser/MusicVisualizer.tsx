"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Music visualizer that shows animated neon bars on the New Tab Page
 * when audio is playing in any webview (YouTube, Spotify, etc.).
 *
 * Uses Electron's media-started-playing / media-paused events to detect
 * when audio is active. Bars animate with randomized heights for a
 * reactive feel. When audio stops, bars fade to a flat line.
 */
export function MusicVisualizer() {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.nebulaDesktop?.onMediaPlaying) return;
    const unsub = window.nebulaDesktop.onMediaPlaying((playing) => {
      setIsPlaying(playing);
    });
    return unsub;
  }, []);

  if (!isPlaying) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-16 left-1/2 z-20 flex -translate-x-1/2 items-end gap-1 rounded-full glass-strong px-4 py-2"
    >
      {/* Animated bars — each has a different animation delay and randomized height */}
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full"
          style={{
            background: i % 3 === 0 ? "var(--neon)" : "var(--neon-soft)",
            boxShadow: i % 3 === 0 ? "0 0 4px var(--neon-soft)" : "none",
          }}
          animate={{
            height: [
              4 + Math.random() * 6,
              12 + Math.random() * 20,
              6 + Math.random() * 10,
              16 + Math.random() * 16,
              4 + Math.random() * 6,
            ],
          }}
          transition={{
            duration: 0.6 + Math.random() * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.03,
          }}
        />
      ))}
      <span className="ml-3 flex items-center gap-1 text-[10px] font-medium text-[var(--neon)]">
        ♪ Playing
      </span>
    </motion.div>
  );
}
