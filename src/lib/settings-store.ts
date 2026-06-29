import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccentName = "cyan" | "magenta" | "lime" | "amber" | "off";
export type GlassIntensity = "off" | "subtle" | "strong";
export type TabBarPosition = "top" | "bottom";

interface SettingsState {
  accent: AccentName;
  glass: GlassIntensity;
  tabBarPosition: TabBarPosition;
  reduceMotion: boolean;
  ntpWallpaper: "aurora" | "obsidian" | "paper" | "void";
  hasSeenOnboarding: boolean;
  setAccent: (a: AccentName) => void;
  setGlass: (g: GlassIntensity) => void;
  setTabBarPosition: (p: TabBarPosition) => void;
  setReduceMotion: (v: boolean) => void;
  setNtpWallpaper: (w: "aurora" | "obsidian" | "paper" | "void") => void;
  setHasSeenOnboarding: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      accent: "cyan",
      glass: "strong",
      tabBarPosition: "top",
      reduceMotion: false,
      ntpWallpaper: "aurora",
      hasSeenOnboarding: false,
      setAccent: (accent) => set({ accent }),
      setGlass: (glass) => set({ glass }),
      setTabBarPosition: (tabBarPosition) => set({ tabBarPosition }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setNtpWallpaper: (ntpWallpaper) => set({ ntpWallpaper }),
      setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
    }),
    { name: "nebula-settings" }
  )
);
