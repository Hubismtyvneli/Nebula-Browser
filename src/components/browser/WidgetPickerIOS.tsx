"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { useWidgetStore, type WidgetType, WIDGET_DEFAULTS } from "@/lib/widget-store";
import { Minigame2048 } from "./Minigame2048";

/**
 * iOS 26.5-style widget picker.
 * Big centered glass frame showing live widget previews.
 * User clicks a widget to place it on the NTP (HTML5 drag was unreliable
 * in Electron webviews, so we use click-to-place instead).
 */
export function WidgetPickerIOS({ onDropRipple }: { onDropRipple?: (x: number, y: number) => void }) {
  const isOpen = useWidgetStore((s) => s.isPickerOpen);
  const toggle = useWidgetStore((s) => s.togglePicker);
  const addWidget = useWidgetStore((s) => s.addWidget);

  const handlePlace = (type: WidgetType) => {
    addWidget(type);
    // Ripple in center of screen
    if (onDropRipple) {
      onDropRipple(window.innerWidth / 2 - 50, window.innerHeight / 2 - 50);
    }
    toggle(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-8"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-lg" onClick={() => toggle(false)} />

          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="glass-strong relative w-full max-w-2xl overflow-hidden rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-6 py-4">
              <div>
                <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Widgets</h2>
                <p className="text-[11px] text-[var(--text-tertiary)]">Click a widget to add it to your page</p>
              </div>
              <button type="button" onClick={() => toggle(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[var(--text-tertiary)] hover:bg-white/10 hover:text-[var(--text-primary)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6 scroll-nebula">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(Object.keys(WIDGET_DEFAULTS) as WidgetType[]).map((type, i) => {
                  const d = WIDGET_DEFAULTS[type];
                  return (
                    <WidgetPreviewCard
                      key={type}
                      type={type}
                      label={d.label}
                      icon={d.icon}
                      onPlace={() => handlePlace(type)}
                      delay={i * 0.05}
                    />
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[var(--border-hairline)] px-6 py-3 text-center text-[10px] text-[var(--text-tertiary)]">
              Click any widget to place it on your page
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function WidgetPreviewCard({
  type,
  label,
  icon,
  onPlace,
  delay,
}: {
  type: WidgetType;
  label: string;
  icon: string;
  onPlace: () => void;
  delay: number;
}) {
  const CARD_SIZE = 140;

  return (
    <motion.div
      onClick={onPlace}
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ y: -4, scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] transition-colors hover:border-[var(--neon-soft)] hover:shadow-[0_0_20px_var(--neon-soft)]"
      style={{ width: CARD_SIZE, height: CARD_SIZE }}
    >
      {/* Live widget content — scaled to fit */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div style={{ transform: "scale(0.5)", transformOrigin: "center" }}>
          <LiveWidgetPreview type={type} />
        </div>
      </div>

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
        <span className="text-[11px]">{icon}</span>
        <span className="text-[10px] font-semibold text-white">{label}</span>
      </div>

      {/* Hover hint */}
      <div className="absolute right-1.5 top-1.5 rounded-full bg-black/40 px-1.5 py-0.5 text-[7px] text-white/50 opacity-0 transition-opacity group-hover:opacity-100">
        Click to add
      </div>
    </motion.div>
  );
}

function LiveWidgetPreview({ type }: { type: WidgetType }) {
  switch (type) {
    case "minigame-2048": return <Minigame2048 />;
    case "clock": return <ClockPreview />;
    case "account": return <AccountPreview />;
    case "notes": return <NotesPreview />;
    default: return null;
  }
}

function ClockPreview() {
  const [time, setTime] = useState(new Date());
  useState(() => { const i = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(i); });
  return (
    <div className="flex h-full flex-col items-center justify-center p-2">
      <svg width={180} height={180} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke="var(--border-glass)" strokeWidth="1" />
        {[...Array(12)].map((_, i) => { const a = (i*30-90)*(Math.PI/180); return <line key={i} x1={50+Math.cos(a)*42} y1={50+Math.sin(a)*42} x2={50+Math.cos(a)*45} y2={50+Math.sin(a)*45} stroke="var(--text-tertiary)" strokeWidth="1" />; })}
        <line x1="50" y1="50" x2={50+Math.cos((time.getHours()%12*30+time.getMinutes()*0.5-90)*(Math.PI/180))*25} y2={50+Math.sin((time.getHours()%12*30+time.getMinutes()*0.5-90)*(Math.PI/180))*25} stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="50" x2={50+Math.cos((time.getMinutes()*6-90)*(Math.PI/180))*38} y2={50+Math.sin((time.getMinutes()*6-90)*(Math.PI/180))*38} stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="50" x2={50+Math.cos((time.getSeconds()*6-90)*(Math.PI/180))*40} y2={50+Math.sin((time.getSeconds()*6-90)*(Math.PI/180))*40} stroke="var(--neon)" strokeWidth="1" strokeLinecap="round" />
        <circle cx="50" cy="50" r="2" fill="var(--neon)" />
      </svg>
      <div className="text-[12px] font-medium text-[var(--text-secondary)]">{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
    </div>
  );
}

function AccountPreview() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--neon-soft)" }}>
        <span className="text-[20px]">👤</span>
      </div>
      <div className="mt-2 text-[13px] font-semibold text-[var(--text-primary)]">Account</div>
      <div className="text-[10px] text-[var(--text-tertiary)]">Sync status</div>
    </div>
  );
}

function NotesPreview() {
  return (
    <div className="h-full w-full p-3 text-[12px] text-[var(--text-secondary)]">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Quick Notes</div>
      <div className="space-y-1">
        <div className="h-2 w-3/4 rounded bg-white/10" />
        <div className="h-2 w-1/2 rounded bg-white/5" />
        <div className="h-2 w-2/3 rounded bg-white/5" />
      </div>
    </div>
  );
}
