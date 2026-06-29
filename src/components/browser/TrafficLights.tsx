"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    nebulaDesktop?: {
      isElectron: boolean;
      platform: string;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      onMaximizeChange: (cb: (isMaximized: boolean) => void) => () => void;
      openExternal: (url: string) => void;
      onDownloadStarted: (cb: (data: { id: string; name: string; url: string; size: number; mimeType: string }) => void) => () => void;
      onDownloadProgress: (cb: (data: { name: string; received: number; total: number; state: string }) => void) => () => void;
      onDownloadDone: (cb: (data: { name: string; state: string; savePath: string }) => void) => () => void;
    };
  }
}

export function TrafficLights() {
  // Compute platform once — no setState needed since it never changes during the session
  const [isMac] = useState(() => {
    if (typeof window === "undefined") return false;
    const desktop = window.nebulaDesktop;
    return desktop?.platform === "darwin" || (!desktop && typeof process !== "undefined" && process.platform === "darwin");
  });
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const desktop = typeof window !== "undefined" ? window.nebulaDesktop : undefined;
    if (!desktop) return;

    desktop.isMaximized().then(setIsMaximized);
    const unsub = desktop.onMaximizeChange(setIsMaximized);
    return unsub;
  }, []);

  // On macOS, the OS provides real traffic lights (via titleBarStyle: hiddenInset).
  // Render a spacer so the tab strip aligns correctly.
  if (isMac) {
    return <div className="flex h-full w-[72px] shrink-0" aria-hidden />;
  }

  // On Windows/Linux, render functional window controls on the RIGHT side.
  // The parent ChromeBar already has app-drag, so these buttons use no-drag.
  return (
    <div className="flex items-center gap-2 pl-3 pr-2 no-drag" aria-hidden>
      {/* Left: decorative dots (for the macOS aesthetic) */}
      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          onClick={() => window.nebulaDesktop?.close()}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="h-3 w-3 rounded-full bg-[#FF5F57] flex items-center justify-center"
          title="Close"
        >
          <span className="text-[8px] font-bold leading-none text-black/60 opacity-0 hover:opacity-100">×</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => window.nebulaDesktop?.minimize()}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="h-3 w-3 rounded-full bg-[#FEBC2E] flex items-center justify-center"
          title="Minimize"
        >
          <span className="text-[8px] font-bold leading-none text-black/60 opacity-0 hover:opacity-100">−</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => window.nebulaDesktop?.maximize()}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="h-3 w-3 rounded-full bg-[#28C840] flex items-center justify-center"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          <span className="text-[8px] font-bold leading-none text-black/60 opacity-0 hover:opacity-100">
            {isMaximized ? "❐" : "+"}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
