"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { useState, useRef } from "react";
import { useWidgetStore, type WidgetType, WIDGET_DEFAULTS } from "@/lib/widget-store";
import { Minigame2048 } from "./Minigame2048";

/**
 * iOS 26.5-style widget picker.
 * Opens as a large centered frame (like the app library) showing real,
 * live widget previews. User drags a widget out of the frame onto the NTP.
 *
 * Features:
 * - Big glass frame centered on screen
 * - Real live widget previews (not icons)
 * - Stretchy drag animation when leaving the frame
 * - Ripple effect + settle animation when dropped
 */
export function WidgetPickerIOS() {
  const isOpen = useWidgetStore((s) => s.isPickerOpen);
  const toggle = useWidgetStore((s) => s.togglePicker);
  const addWidget = useWidgetStore((s) => s.addWidget);
  const [draggingType, setDraggingType] = useState<WidgetType | null>(null);
  const [dropPos, setDropPos] = useState<{ x: number; y: number } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);

  const handleDrop = (e: React.DragEvent, type: WidgetType | null) => {
    if (!type) return;
    e.preventDefault();
    const x = e.clientX - 100;
    const y = e.clientY - 100;
    addWidget(type);
    setDropPos({ x, y });
    setRippleKey((k) => k + 1);
    setDraggingType(null);
    toggle(false);
  };

  return (
    <>
      {/* Full-screen drop zone when dragging */}
      {draggingType && (
        <div
          className="fixed inset-0 z-[200]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, draggingType)}
          style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
        >
          <div className="flex h-full items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[14px] font-medium text-white/60"
            >
              Drop to place widget
            </motion.div>
          </div>
        </div>
      )}

      {/* Ripple effect on drop */}
      <AnimatePresence>
        {dropPos && (
          <motion.div
            key={rippleKey}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            onAnimationComplete={() => setDropPos(null)}
            className="pointer-events-none fixed z-[300] h-32 w-32 rounded-full"
            style={{
              left: dropPos.x,
              top: dropPos.y,
              background: "var(--neon-soft)",
              transformOrigin: "center",
            }}
          />
        )}
      </AnimatePresence>

      {/* The big centered picker frame */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-8"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-lg" onClick={() => toggle(false)} />

            {/* Frame */}
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="glass-strong relative w-full max-w-2xl overflow-hidden rounded-3xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-6 py-4">
                <div>
                  <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Widgets</h2>
                  <p className="text-[11px] text-[var(--text-tertiary)]">Drag a widget onto your page</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[var(--text-tertiary)] hover:bg-white/10 hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Widget grid — real live previews */}
              <div className="max-h-[60vh] overflow-y-auto p-6 scroll-nebula">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {(Object.keys(WIDGET_DEFAULTS) as WidgetType[]).map((type) => {
                    const defaults = WIDGET_DEFAULTS[type];
                    return (
                      <WidgetPreviewCard
                        key={type}
                        type={type}
                        label={defaults.label}
                        icon={defaults.icon}
                        width={defaults.width}
                        height={defaults.height}
                        onDragStart={() => setDraggingType(type)}
                        onDragEnd={() => setDraggingType(null)}
                        onQuickAdd={() => {
                          addWidget(type);
                          toggle(false);
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-[var(--border-hairline)] px-6 py-3 text-center text-[10px] text-[var(--text-tertiary)]">
                Drag widgets onto your page · Or click + to place automatically
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function WidgetPreviewCard({
  type,
  label,
  icon,
  width,
  height,
  onDragStart,
  onDragEnd,
  onQuickAdd,
}: {
  type: WidgetType;
  label: string;
  icon: string;
  width: number;
  height: number;
  onDragStart: () => void;
  onDragEnd: () => void;
  onQuickAdd: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragImgRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart();
    // Create a custom drag image
    if (dragImgRef.current) {
      e.dataTransfer.setDragImage(dragImgRef.current, width / 2, height / 2);
    }
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", type);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isDragging ? 0.4 : 1,
        scale: isDragging ? 0.95 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="group relative"
    >
      {/* The live preview — actual widget rendered in miniature */}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="relative cursor-grab overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] transition-all hover:border-[var(--neon-soft)] hover:shadow-[0_0_20px_var(--neon-soft)] active:cursor-grabbing"
        style={{ width: "100%", aspectRatio: `${width} / ${height}` }}
      >
        {/* Live widget content — scaled down */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ transform: "scale(0.45)", transformOrigin: "center", width: `${100 / 0.45}%`, height: `${100 / 0.45}%`, left: `${(-100 / 0.45 + 100) / 2}%`, top: `${(-100 / 0.45 + 100) / 2}%` }}
        >
          <LiveWidgetPreview type={type} />
        </div>

        {/* Label overlay */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px]">{icon}</span>
            <span className="text-[11px] font-semibold text-white">{label}</span>
          </div>
          <button
            type="button"
            onClick={onQuickAdd}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--neon)] text-black opacity-0 transition-opacity group-hover:opacity-100"
            title="Add to page"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Drag hint */}
        <div className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[8px] text-white/50 opacity-0 transition-opacity group-hover:opacity-100">
          Drag to place
        </div>
      </div>

      {/* Hidden drag image — full-size for crisp dragging */}
      <div
        ref={dragImgRef}
        className="pointer-events-none fixed -left-[9999px] -top-[9999px] overflow-hidden rounded-xl border border-[var(--neon)] bg-[var(--bg-surface)]"
        style={{ width, height }}
      >
        <LiveWidgetPreview type={type} />
      </div>
    </motion.div>
  );
}

/** Renders actual widget content for live previews */
function LiveWidgetPreview({ type }: { type: WidgetType }) {
  switch (type) {
    case "minigame-2048":
      return <Minigame2048 />;
    case "clock":
      return <ClockPreview />;
    case "account":
      return <AccountPreview />;
    case "notes":
      return <NotesPreview />;
    default:
      return null;
  }
}

function ClockPreview() {
  const [time, setTime] = useState(new Date());
  useState(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  });
  const size = Math.min(200, 200) - 20;
  return (
    <div className="flex h-full flex-col items-center justify-center p-2">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke="var(--border-glass)" strokeWidth="1" />
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          return <line key={i} x1={50 + Math.cos(angle) * 42} y1={50 + Math.sin(angle) * 42} x2={50 + Math.cos(angle) * 45} y2={50 + Math.sin(angle) * 45} stroke="var(--text-tertiary)" strokeWidth="1" />;
        })}
        <line x1="50" y1="50" x2={50 + Math.cos((time.getHours() % 12 * 30 + time.getMinutes() * 0.5 - 90) * (Math.PI / 180)) * 25} y2={50 + Math.sin((time.getHours() % 12 * 30 + time.getMinutes() * 0.5 - 90) * (Math.PI / 180)) * 25} stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="50" x2={50 + Math.cos((time.getMinutes() * 6 - 90) * (Math.PI / 180)) * 38} y2={50 + Math.sin((time.getMinutes() * 6 - 90) * (Math.PI / 180)) * 38} stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="50" x2={50 + Math.cos((time.getSeconds() * 6 - 90) * (Math.PI / 180)) * 40} y2={50 + Math.sin((time.getSeconds() * 6 - 90) * (Math.PI / 180)) * 40} stroke="var(--neon)" strokeWidth="1" strokeLinecap="round" />
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
