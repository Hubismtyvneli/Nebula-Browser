import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccentName, GlassIntensity } from "./settings-store";
import { useSettingsStore } from "./settings-store";
import { useWallpaperStore } from "./wallpaper-store";

export interface ThemeConfig {
  accent: AccentName;
  glassIntensity: GlassIntensity;
  wallpaperId: string | null;
  fontFamily: string;
  borderRadius: number;
  customCSS: string;
  titleBarStyle: "hidden" | "transparent";
  ntpLayout: "centered" | "grid" | "minimal";
  sidebarWidth: number;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: ThemeConfig;
  tags: string[];
  installs: number;
  rating: number;
  price: number;
  isBuiltin: boolean;
  isOwned: boolean;
  isApplied: boolean;
  authorName?: string;
  createdAt: number;
}

const DEFAULT_CONFIG: ThemeConfig = {
  accent: "cyan",
  glassIntensity: "strong",
  wallpaperId: "builtin-nebula",
  fontFamily: "Inter",
  borderRadius: 12,
  customCSS: "",
  titleBarStyle: "hidden",
  ntpLayout: "centered",
  sidebarWidth: 380,
};

const BUILTIN_THEMES: Theme[] = [
  { id: "theme-nebula", name: "Nebula Default", description: "The signature look — cyan neon, strong glass, aurora wallpaper", icon: "✦", config: { ...DEFAULT_CONFIG, accent: "cyan", glassIntensity: "strong", wallpaperId: "builtin-nebula" }, tags: ["default", "neon", "dark"], installs: 45000, rating: 4.9, price: 0, isBuiltin: true, isOwned: true, isApplied: true, createdAt: 1700000000000 },
  { id: "theme-obsidian", name: "Obsidian", description: "Pure darkness — mono accent, no glass, black wallpaper", icon: "⬛", config: { ...DEFAULT_CONFIG, accent: "off", glassIntensity: "off", wallpaperId: "builtin-obsidian" }, tags: ["dark", "minimal", "mono"], installs: 28000, rating: 4.6, price: 0, isBuiltin: true, isOwned: true, isApplied: false, createdAt: 1700000000000 },
  { id: "theme-cyberpunk", name: "Cyberpunk", description: "Neon pink and blue — for the night owls", icon: "🌃", config: { ...DEFAULT_CONFIG, accent: "magenta", glassIntensity: "strong", wallpaperId: "builtin-cyberpunk" }, tags: ["neon", "vibrant", "dark"], installs: 35000, rating: 4.8, price: 0, isBuiltin: true, isOwned: true, isApplied: false, createdAt: 1700000000000 },
  { id: "theme-paper", name: "Paper", description: "Clean and bright — subtle glass, light wallpaper", icon: "📄", config: { ...DEFAULT_CONFIG, accent: "off", glassIntensity: "subtle", wallpaperId: "builtin-frost" }, tags: ["light", "minimal", "clean"], installs: 15000, rating: 4.4, price: 0, isBuiltin: true, isOwned: true, isApplied: false, createdAt: 1700000000000 },
  { id: "theme-synthwave", name: "Synthwave", description: "80s retro grid with purple sunset vibes", icon: "🌅", config: { ...DEFAULT_CONFIG, accent: "amber", glassIntensity: "strong", wallpaperId: "builtin-synthwave" }, tags: ["retro", "neon", "vibrant"], installs: 22000, rating: 4.7, price: 0, isBuiltin: true, isOwned: true, isApplied: false, createdAt: 1700000000000 },
  { id: "theme-ocean", name: "Ocean", description: "Deep blue calm — cyan accent, subtle glass", icon: "🌊", config: { ...DEFAULT_CONFIG, accent: "cyan", glassIntensity: "subtle", wallpaperId: "builtin-ocean" }, tags: ["nature", "blue", "calm"], installs: 18000, rating: 4.5, price: 0, isBuiltin: true, isOwned: true, isApplied: false, createdAt: 1700000000000 },
  { id: "theme-forest", name: "Forest", description: "Misty green — lime accent, subtle glass", icon: "🌲", config: { ...DEFAULT_CONFIG, accent: "lime", glassIntensity: "subtle", wallpaperId: "builtin-forest" }, tags: ["nature", "green", "dark"], installs: 12000, rating: 4.3, price: 0, isBuiltin: true, isOwned: true, isApplied: false, createdAt: 1700000000000 },
  { id: "theme-inferno", name: "Inferno", description: "Fire and embers — amber accent, strong glass", icon: "🔥", config: { ...DEFAULT_CONFIG, accent: "amber", glassIntensity: "strong", wallpaperId: "builtin-inferno" }, tags: ["fire", "dark", "vibrant"], installs: 9800, rating: 4.2, price: 0, isBuiltin: true, isOwned: true, isApplied: false, createdAt: 1700000000000 },
];

interface ThemeState {
  themes: Theme[];
  activeThemeId: string;

  setThemes: (t: Theme[]) => void;
  addTheme: (t: Theme) => void;
  removeTheme: (id: string) => void;
  applyTheme: (id: string) => void;
  acquireTheme: (id: string) => void;
  getActiveTheme: () => Theme | null;
  isThemeOwned: (id: string) => boolean;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themes: BUILTIN_THEMES,
      activeThemeId: "theme-nebula",

      setThemes: (themes) => set({ themes }),
      addTheme: (t) => set((s) => ({ themes: [...s.themes.filter((x) => x.id !== t.id), t] })),
      removeTheme: (id) => set((s) => ({ themes: s.themes.filter((t) => t.id !== id) })),
      applyTheme: (id) => {
        const theme = get().themes.find((t) => t.id === id);
        if (!theme) return;
        set((s) => ({
          themes: s.themes.map((t) => ({ ...t, isApplied: t.id === id })),
          activeThemeId: id,
        }));
        // Apply the theme config to settings stores
        const settings = useSettingsStore.getState();
        settings.setAccent(theme.config.accent);
        settings.setGlass(theme.config.glassIntensity);
        useWallpaperStore.getState().setActiveWallpaper(theme.config.wallpaperId || "builtin-nebula");
      },
      acquireTheme: (id) =>
        set((s) => ({
          themes: s.themes.map((t) => (t.id === id ? { ...t, isOwned: true } : t)),
        })),
      getActiveTheme: () => get().themes.find((t) => t.id === get().activeThemeId) ?? null,
      isThemeOwned: (id) => get().themes.find((t) => t.id === id)?.isOwned ?? false,
    }),
    {
      name: "nebula-themes",
      partialize: (s) => ({
        themes: s.themes.map((t) => ({ ...t, isOwned: t.isOwned, isApplied: t.isApplied })),
        activeThemeId: s.activeThemeId,
      }),
    }
  )
);
