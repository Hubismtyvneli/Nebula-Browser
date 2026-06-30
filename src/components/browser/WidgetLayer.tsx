"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useWidgetStore, type WidgetInstance, type WidgetType, WIDGET_DEFAULTS } from "@/lib/widget-store";
import { WidgetPickerIOS } from "./WidgetPickerIOS";

/**
 * Renders all user-placed widgets as draggable + resizable floating panels.
 *
 * Performance: uses refs + rAF for drag/resize (no React state updates per
 * pointermove frame). State is only committed on pointerup.
 */
export function WidgetLayer() {
  const widgets = useWidgetStore((s) => s.widgets);
  const updateWidget = useWidgetStore((s) => s.updateWidget);
  const bringToFront = useWidgetStore((s) => s.bringToFront);
  const removeWidget = useWidgetStore((s) => s.removeWidget);
  const togglePicker = useWidgetStore((s) => s.togglePicker);
  const [dropRipple, setDropRipple] = useState<{ x: number; y: number; key: number } | null>(null);

  return (
    <>
      {widgets.map((w) => (
        <DraggableWidget
          key={w.id}
          widget={w}
          onUpdate={(patch) => updateWidget(w.id, patch)}
          onFocus={() => bringToFront(w.id)}
          onClose={() => removeWidget(w.id)}
        />
      ))}

      <AnimatePresence>
        {dropRipple && (
          <motion.div
            key={dropRipple.key}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={() => setDropRipple(null)}
            className="pointer-events-none fixed z-[300] h-24 w-24 rounded-full"
            style={{ left: dropRipple.x, top: dropRipple.y, background: "var(--neon-soft)" }}
          />
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => togglePicker(true)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-4 left-4 z-[15] flex h-10 items-center gap-2 rounded-full glass-strong px-3"
        title="Add widgets"
      >
        <Plus className="h-4 w-4 text-[var(--neon)]" />
        <span className="text-[11px] font-medium text-[var(--text-primary)]">Widgets</span>
      </motion.button>

      <WidgetPickerIOS onDropRipple={(x, y) => setDropRipple({ x, y, key: Date.now() })} />
    </>
  );
}

function DraggableWidget({
  widget,
  onUpdate,
  onFocus,
  onClose,
}: {
  widget: WidgetInstance;
  onUpdate: (patch: Partial<WidgetInstance>) => void;
  onFocus: () => void;
  onClose: () => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sy: number; ow: number; oh: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<Partial<WidgetInstance> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const applyPending = () => {
    rafRef.current = null;
    if (pendingRef.current) {
      // Directly set the element's position via style for instant visual update
      const el = elRef.current;
      if (el) {
        if (pendingRef.current.x !== undefined) el.style.left = `${pendingRef.current.x}px`;
        if (pendingRef.current.y !== undefined) el.style.top = `${pendingRef.current.y}px`;
        if (pendingRef.current.width !== undefined) el.style.width = `${pendingRef.current.width}px`;
        if (pendingRef.current.height !== undefined) el.style.height = `${pendingRef.current.height}px`;
      }
    }
  };

  const handleDragStart = (e: React.PointerEvent) => {
    onFocus();
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: widget.x, oy: widget.y };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    // Clamp position so widget can't go off-screen
    const nx = Math.max(0, Math.min(window.innerWidth - widget.width - 4, dragRef.current.ox + dx));
    const ny = Math.max(0, Math.min(window.innerHeight - 40, dragRef.current.oy + dy)); // 40px for toolbar
    pendingRef.current = { x: nx, y: ny };
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(applyPending);
    }
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (pendingRef.current) { onUpdate(pendingRef.current); pendingRef.current = null; }
    dragRef.current = null;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    onFocus();
    resizeRef.current = { sx: e.clientX, sy: e.clientY, ow: widget.width, oh: widget.height };
    setIsResizing(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.sx;
    const dy = e.clientY - resizeRef.current.sy;
    const nw = Math.max(160, resizeRef.current.ow + dx);
    const nh = Math.max(120, resizeRef.current.oh + dy);
    pendingRef.current = { width: nw, height: nh };
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(applyPending);
    }
  };

  const handleResizeEnd = (e: React.PointerEvent) => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (pendingRef.current) { onUpdate(pendingRef.current); pendingRef.current = null; }
    resizeRef.current = null;
    setIsResizing(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Cleanup
  useRef(() => () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); });

  const defaults = WIDGET_DEFAULTS[widget.type];

  return (
    <motion.div
      ref={elRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        // Ragdoll stretch: bottom lags behind top during drag (iOS jelly feel)
        ...(isDragging ? { scaleY: 0.96, scaleX: 1.04 } : {}),
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: isDragging ? 400 : 300,
        damping: isDragging ? 18 : 28,
        // Bounce back hard on release for the "snap" effect
        ...(isDragging ? {} : { bounce: 0.15 }),
      }}
      onPointerDown={onFocus}
      className="absolute glass-strong flex flex-col overflow-hidden rounded-xl"
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.width,
        height: widget.height,
        zIndex: 10 + widget.zIndex,
        userSelect: isDragging || isResizing ? "none" : "auto",
        boxShadow: isDragging ? "0 30px 80px rgba(0,0,0,0.5), 0 0 40px var(--neon-soft), inset 0 1px 0 rgba(255,255,255,0.1)" : undefined,
        willChange: isDragging || isResizing ? "left, top, transform" : "auto",
        transformOrigin: "top center",
      }}
    >
      {/* Title bar */}
      <div
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        className="flex h-8 shrink-0 cursor-move items-center justify-between border-b border-[var(--border-hairline)] px-3"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[12px]">{defaults.icon}</span>
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">{defaults.label}</span>
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-tertiary)] hover:bg-white/10 hover:text-[#FF5F57]"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <WidgetContent type={widget.type} width={widget.width} height={widget.height} />
      </div>

      {/* Resize handle */}
      <div
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
        style={{ background: "linear-gradient(135deg, transparent 50%, var(--neon-soft) 50%)" }}
      />
    </motion.div>
  );
}

// Widget content renderer — import lazily to avoid heavy renders during drag
import { Minigame2048 } from "./Minigame2048";

function WidgetContent({ type, width, height }: { type: WidgetType; width: number; height: number }) {
  switch (type) {
    case "minigame-2048":
      return <div className="h-full overflow-y-auto scroll-nebula p-2"><Minigame2048 /></div>;
    case "clock":
      return <ClockWidget width={width} height={height} />;
    case "account":
      return <AccountWidget />;
    case "notes":
      return <NotesWidget />;
    default:
      return null;
  }
}

function ClockWidget({ width, height }: { width: number; height: number }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  const size = Math.min(width, height) - 20;
  return (
    <div className="flex h-full flex-col items-center justify-center p-2">
      <svg width={size} height={size} viewBox="0 0 100 100">
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

function AccountWidget() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-3 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--neon-soft)" }}>
        <span className="text-[16px]">👤</span>
      </div>
      <div className="mt-2 text-[11px] font-semibold text-[var(--text-primary)]">Account</div>
      <div className="text-[9px] text-[var(--text-tertiary)]">Click to sign in</div>
    </div>
  );
}

function NotesWidget() {
  const [notes, setNotes] = useState(() => typeof window !== "undefined" ? localStorage.getItem("nebula-notes-widget") || "" : "");
  const save = (v: string) => { setNotes(v); localStorage.setItem("nebula-notes-widget", v); };
  return <textarea value={notes} onChange={(e) => save(e.target.value)} placeholder="Quick notes…" className="h-full w-full resize-none bg-transparent p-3 text-[12px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]" />;
}
