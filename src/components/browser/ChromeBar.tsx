"use client";

import { motion } from "framer-motion";
import { Command, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { TrafficLights } from "./TrafficLights";
import { TabStrip } from "./TabStrip";
import { useBrowserStore } from "@/lib/browser-store";

export function ChromeBar() {
  const toggleCommandPalette = useBrowserStore((s) => s.toggleCommandPalette);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div
      className="app-drag relative z-30 flex h-11 items-stretch gap-1 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] backdrop-blur-xl"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="no-drag flex items-center" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <TrafficLights />
      </div>

      <div className="no-drag" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <TabStrip />
      </div>

      {/* Spacer in the middle that remains draggable (gives users a clear grab area) */}
      <div
        className="flex-1"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      />

      <div className="no-drag flex items-center gap-1 pr-2" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <motion.button
          type="button"
          onClick={() => toggleCommandPalette(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
          title="Command palette (⌘K)"
        >
          <Command className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium">K</span>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          whileHover={{ scale: 1.08, rotate: 12 }}
          whileTap={{ scale: 0.92 }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
          title="Toggle theme"
          aria-label="Toggle theme"
          suppressHydrationWarning
        >
          <ThemeIcon />
        </motion.button>
      </div>
    </div>
  );
}

function ThemeIcon() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? (
    <Sun className="h-3.5 w-3.5" />
  ) : (
    <Moon className="h-3.5 w-3.5" />
  );
}
