"use client";

import { motion } from "framer-motion";

const lights = [
  { color: "#FF5F57", glyph: "×", label: "Close" },
  { color: "#FEBC2E", glyph: "−", label: "Minimize" },
  { color: "#28C840", glyph: "+", label: "Maximize" },
];

export function TrafficLights() {
  return (
    <div className="flex items-center gap-2 pl-3 pr-2 no-drag" aria-hidden>
      {lights.map((l, i) => (
        <motion.button
          key={l.label}
          type="button"
          className="group relative h-3 w-3 rounded-full flex items-center justify-center"
          style={{ backgroundColor: l.color }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          title={l.label}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 * i, type: "spring", stiffness: 320, damping: 22 }}
        >
          <span
            className="text-[8px] font-bold leading-none text-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ marginTop: -1 }}
          >
            {l.glyph}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
