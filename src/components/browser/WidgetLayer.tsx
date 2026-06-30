"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { useWidgetStore, type WidgetInstance, type WidgetType, WIDGET_DEFAULTS } from "@/lib/widget-store";

/**
 * Renders all user-placed widgets as draggable + resizable floating panels
 * on the New Tab Page. Each widget can be:
 * - Dragged anywhere on screen (click + drag the title bar)
 * - Resized (drag the bottom-right corner)
 * - Closed (X button in the title bar)
 * - Brought to front (click anywhere on the widget)
 */
export function WidgetLayer() {
  const widgets = useWidgetStore((s) => s.widgets);
  const updateWidget = useWidgetStore((s) => s.updateWidget);
  const bringToFront = useWidgetStore((s) => s.bringToFront);
  const removeWidget = useWidgetStore((s) => s.removeWidget);
  const togglePicker = useWidgetStore((s) => s.togglePicker);
  const isPickerOpen = useWidgetStore((s) => s.isPickerOpen);

  return (
    <>
      {/* Floating widgets */}
      {widgets.map((w) => (
        <DraggableWidget
          key={w.id}
          widget={w}
          onUpdate={(patch) => updateWidget(w.id, patch)}
          onFocus={() => bringToFront(w.id)}
          onClose={() => removeWidget(w.id)}
        />
      ))}

      {/* Add widget floating button */}
      <motion.button
        type="button"
        onClick={() => togglePicker(true)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-4 left-4 z-[60] flex h-10 items-center gap-2 rounded-full glass-strong px-3"
        title="Add widgets"
      >
        <Plus className="h-4 w-4 text-[var(--neon)]" />
        <span className="text-[11px] font-medium text-[var(--text-primary)]">Widgets</span>
      </motion.button>

      {/* Widget picker */}
      <WidgetPicker />
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
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const handleDragStart = (e: React.PointerEvent) => {
    onFocus();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: widget.x,
      origY: widget.y,
    };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    onUpdate({
      x: Math.max(0, dragRef.current.origX + dx),
      y: Math.max(0, dragRef.current.origY + dy),
    });
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    dragRef.current = null;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    onFocus();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: widget.width,
      origH: widget.height,
    };
    setIsResizing(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    onUpdate({
      width: Math.max(160, resizeRef.current.origW + dx),
      height: Math.max(120, resizeRef.current.origH + dy),
    });
  };

  const handleResizeEnd = (e: React.PointerEvent) => {
    resizeRef.current = null;
    setIsResizing(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const defaults = WIDGET_DEFAULTS[widget.type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      onPointerDown={onFocus}
      className="absolute glass-strong flex flex-col overflow-hidden rounded-xl"
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.width,
        height: widget.height,
        zIndex: 50 + widget.zIndex,
        userSelect: isDragging || isResizing ? "none" : "auto",
      }}
    >
      {/* Title bar — drag handle */}
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

      {/* Widget content */}
      <div className="flex-1 overflow-hidden">
        <WidgetContent type={widget.type} width={widget.width} height={widget.height} />
      </div>

      {/* Resize handle (bottom-right corner) */}
      <div
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
        style={{
          background: "linear-gradient(135deg, transparent 50%, var(--neon-soft) 50%)",
        }}
      />
    </motion.div>
  );
}

function WidgetContent({ type, width, height }: { type: WidgetType; width: number; height: number }) {
  switch (type) {
    case "minigame-2048":
      return <MinigameWidget />;
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

// Lazy-load the actual widget contents
import { Minigame2048 } from "./Minigame2048";

function MinigameWidget() {
  return (
    <div className="h-full overflow-y-auto scroll-nebula p-2">
      <Minigame2048 />
    </div>
  );
}

function ClockWidget({ width, height }: { width: number; height: number }) {
  const [time, setTime] = useState(new Date());
  // Update every second
  useState(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  });

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6;
  const secondAngle = seconds * 6;

  const size = Math.min(width, height) - 20;

  return (
    <div className="flex h-full flex-col items-center justify-center p-2">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke="var(--border-glass)" strokeWidth="1" />
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          return (
            <line
              key={i}
              x1={50 + Math.cos(angle) * 42}
              y1={50 + Math.sin(angle) * 42}
              x2={50 + Math.cos(angle) * 45}
              y2={50 + Math.sin(angle) * 45}
              stroke="var(--text-tertiary)"
              strokeWidth="1"
            />
          );
        })}
        <line x1="50" y1="50" x2={50 + Math.cos((hourAngle - 90) * (Math.PI / 180)) * 25} y2={50 + Math.sin((hourAngle - 90) * (Math.PI / 180)) * 25} stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="50" x2={50 + Math.cos((minuteAngle - 90) * (Math.PI / 180)) * 38} y2={50 + Math.sin((minuteAngle - 90) * (Math.PI / 180)) * 38} stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="50" x2={50 + Math.cos((secondAngle - 90) * (Math.PI / 180)) * 40} y2={50 + Math.sin((secondAngle - 90) * (Math.PI / 180)) * 40} stroke="var(--neon)" strokeWidth="1" strokeLinecap="round" />
        <circle cx="50" cy="50" r="2" fill="var(--neon)" />
      </svg>
      <div className="mt-1 text-[11px] font-medium text-[var(--text-secondary)]">
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

function AccountWidget() {
  return <AccountWidgetContent />;
}

function AccountWidgetContent() {
  // Inline to avoid circular import with NewTabPage
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
  const [notes, setNotes] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("nebula-notes-widget") || "";
  });

  const save = (v: string) => {
    setNotes(v);
    localStorage.setItem("nebula-notes-widget", v);
  };

  return (
    <textarea
      value={notes}
      onChange={(e) => save(e.target.value)}
      placeholder="Quick notes…"
      className="h-full w-full resize-none bg-transparent p-3 text-[12px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
    />
  );
}

function WidgetPicker() {
  const isOpen = useWidgetStore((s) => s.isPickerOpen);
  const toggle = useWidgetStore((s) => s.togglePicker);
  const addWidget = useWidgetStore((s) => s.addWidget);

  const types: WidgetType[] = ["minigame-2048", "clock", "account", "notes"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggle(false)}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="glass-strong fixed bottom-16 left-4 z-[100] w-72 overflow-hidden rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-4 py-3">
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">Add widget</span>
              <button type="button" onClick={() => toggle(false)} className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-3">
              {types.map((type) => {
                const defaults = WIDGET_DEFAULTS[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      addWidget(type);
                      toggle(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                  >
                    <span className="text-[20px]">{defaults.icon}</span>
                    <div>
                      <div className="text-[12px] font-medium text-[var(--text-primary)]">{defaults.label}</div>
                      <div className="text-[10px] text-[var(--text-tertiary)]">{defaults.width} × {defaults.height}px</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
