import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  x: number;      // position in px from top-left of NTP
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export type WidgetType = "minigame-2048" | "clock" | "account" | "notes";

export const WIDGET_DEFAULTS: Record<WidgetType, { width: number; height: number; label: string; icon: string }> = {
  "minigame-2048": { width: 280, height: 380, label: "2048 Game", icon: "🎮" },
  "clock":         { width: 200, height: 200, label: "Clock", icon: "🕐" },
  "account":       { width: 220, height: 180, label: "Account", icon: "👤" },
  "notes":         { width: 240, height: 200, label: "Notes", icon: "📝" },
};

interface WidgetState {
  widgets: WidgetInstance[];
  isPickerOpen: boolean;

  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, patch: Partial<WidgetInstance>) => void;
  bringToFront: (id: string) => void;
  togglePicker: (v?: boolean) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set, get) => ({
      widgets: [],
      isPickerOpen: false,

      addWidget: (type) =>
        set((s) => {
          const defaults = WIDGET_DEFAULTS[type];
          const maxZ = s.widgets.reduce((mx, w) => Math.max(mx, w.zIndex), 0);
          const newWidget: WidgetInstance = {
            id: uid(),
            type,
            x: 80 + Math.random() * 200,
            y: 120 + Math.random() * 100,
            width: defaults.width,
            height: defaults.height,
            zIndex: maxZ + 1,
          };
          return { widgets: [...s.widgets, newWidget] };
        }),

      removeWidget: (id) =>
        set((s) => ({ widgets: s.widgets.filter((w) => w.id !== id) })),

      updateWidget: (id, patch) =>
        set((s) => ({
          widgets: s.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        })),

      bringToFront: (id) =>
        set((s) => {
          const maxZ = s.widgets.reduce((mx, w) => Math.max(mx, w.zIndex), 0);
          return {
            widgets: s.widgets.map((w) =>
              w.id === id ? { ...w, zIndex: maxZ + 1 } : w
            ),
          };
        }),

      togglePicker: (v) =>
        set((s) => ({ isPickerOpen: v ?? !s.isPickerOpen })),
    }),
    { name: "nebula-widgets" }
  )
);
