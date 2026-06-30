import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PluginType = "sidebar" | "toolbar" | "theme" | "ai" | "content" | "ntp-widget";

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  type: PluginType;
  icon: string; // emoji or lucide icon name
  authorName?: string;
  authorId?: string;
  permissions: string[];
  tags: string[];
  installs: number;
  rating: number;
  isBuiltin: boolean;
  isPublic: boolean;
  /** Whether the user has installed/enabled this plugin */
  isEnabled: boolean;
  createdAt: number;
}

interface PluginState {
  plugins: Plugin[];
  isMarketplaceOpen: boolean;

  addPlugin: (p: Plugin) => void;
  removePlugin: (id: string) => void;
  togglePlugin: (id: string) => void;
  enablePlugin: (id: string) => void;
  disablePlugin: (id: string) => void;
  toggleMarketplace: (v?: boolean) => void;
  getEnabledPlugins: () => Plugin[];
  getPluginsByType: (type: PluginType) => Plugin[];
}

/** 5 built-in plugins that ship with the app */
const BUILTIN_PLUGINS: Plugin[] = [
  {
    id: "builtin-dark-reader",
    name: "Dark Reader",
    description: "Forces dark mode on all websites for comfortable nighttime reading.",
    version: "1.0.0",
    type: "content",
    icon: "🌙",
    permissions: ["content:injectCSS"],
    tags: ["dark-mode", "reading", "accessibility"],
    installs: 45000,
    rating: 4.9,
    isBuiltin: true,
    isPublic: true,
    isEnabled: false,
    createdAt: 1700000000000,
  },
  {
    id: "builtin-screenshot",
    name: "Screenshot Tool",
    description: "Capture full-page screenshots of any website with one click.",
    version: "1.0.0",
    type: "toolbar",
    icon: "📸",
    permissions: ["toolbar:addButton", "webview:capture"],
    tags: ["screenshot", "capture", "productivity"],
    installs: 28000,
    rating: 4.7,
    isBuiltin: true,
    isPublic: true,
    isEnabled: false,
    createdAt: 1700000000000,
  },
  {
    id: "builtin-qr-generator",
    name: "QR Code Generator",
    description: "Generate QR codes for the current URL to share with mobile devices.",
    version: "1.0.0",
    type: "sidebar",
    icon: "📱",
    permissions: ["sidebar:registerPanel"],
    tags: ["qr", "share", "mobile"],
    installs: 12000,
    rating: 4.5,
    isBuiltin: true,
    isPublic: true,
    isEnabled: false,
    createdAt: 1700000000000,
  },
  {
    id: "builtin-notepad",
    name: "Note Pad",
    description: "Quick notes in a sidebar panel — auto-saves as you type.",
    version: "1.0.0",
    type: "sidebar",
    icon: "📝",
    permissions: ["sidebar:registerPanel", "storage:local"],
    tags: ["notes", "productivity", "writing"],
    installs: 18000,
    rating: 4.6,
    isBuiltin: true,
    isPublic: true,
    isEnabled: false,
    createdAt: 1700000000000,
  },
  {
    id: "builtin-clock-timer",
    name: "Clock & Timer",
    description: "Analog clock + pomodoro timer widget for your new tab page.",
    version: "1.0.0",
    type: "ntp-widget",
    icon: "🕐",
    permissions: ["ntp:addWidget"],
    tags: ["clock", "timer", "pomodoro", "productivity"],
    installs: 9800,
    rating: 4.4,
    isBuiltin: true,
    isPublic: true,
    isEnabled: false,
    createdAt: 1700000000000,
  },
];

export const usePluginStore = create<PluginState>()(
  persist(
    (set, get) => ({
      plugins: BUILTIN_PLUGINS,
      isMarketplaceOpen: false,

      addPlugin: (p) =>
        set((s) => ({
          plugins: [...s.plugins.filter((x) => x.id !== p.id), { ...p, isEnabled: true }],
        })),
      removePlugin: (id) =>
        set((s) => ({ plugins: s.plugins.filter((p) => p.id !== id) })),
      togglePlugin: (id) =>
        set((s) => ({
          plugins: s.plugins.map((p) =>
            p.id === id ? { ...p, isEnabled: !p.isEnabled } : p
          ),
        })),
      enablePlugin: (id) =>
        set((s) => ({
          plugins: s.plugins.map((p) =>
            p.id === id ? { ...p, isEnabled: true } : p
          ),
        })),
      disablePlugin: (id) =>
        set((s) => ({
          plugins: s.plugins.map((p) =>
            p.id === id ? { ...p, isEnabled: false } : p
          ),
        })),
      toggleMarketplace: (v) =>
        set((s) => ({ isMarketplaceOpen: v ?? !s.isMarketplaceOpen })),
      getEnabledPlugins: () => get().plugins.filter((p) => p.isEnabled),
      getPluginsByType: (type) =>
        get().plugins.filter((p) => p.type === type && p.isEnabled),
    }),
    {
      name: "nebula-plugins",
      partialize: (s) => ({
        plugins: s.plugins.map((p) => ({ ...p, isEnabled: p.isEnabled })),
      }),
    }
  )
);
