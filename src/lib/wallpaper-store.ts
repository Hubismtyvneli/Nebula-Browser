import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WallpaperType = "static" | "animated" | "gradient" | "live";

export interface Wallpaper {
  id: string;
  title: string;
  description?: string;
  type: WallpaperType;
  /** For static/animated: URL to the image/video file */
  fileUrl?: string;
  /** Small preview thumbnail */
  thumbnailUrl?: string;
  /** For gradient type: CSS background string */
  gradientCss?: string;
  /** Author info (for community wallpapers) */
  authorName?: string;
  authorId?: string;
  tags: string[];
  downloads: number;
  rating: number;
  isBuiltin: boolean;
  isPublic: boolean;
  createdAt: number;
}

interface WallpaperState {
  /** All wallpapers available (built-in + community + custom) */
  wallpapers: Wallpaper[];
  /** The currently applied wallpaper ID */
  activeWallpaperId: string | null;
  /** Whether the marketplace panel is open */
  isMarketplaceOpen: boolean;

  setWallpapers: (w: Wallpaper[]) => void;
  addWallpaper: (w: Wallpaper) => void;
  removeWallpaper: (id: string) => void;
  setActiveWallpaper: (id: string) => void;
  getActiveWallpaper: () => Wallpaper | null;
  toggleMarketplace: (v?: boolean) => void;
  incrementDownloads: (id: string) => void;
}

/** 10 built-in preset wallpapers that ship with the app */
const BUILTIN_WALLPAPERS: Wallpaper[] = [
  {
    id: "builtin-nebula",
    title: "Nebula",
    description: "The default aurora gradient — flowing neon on obsidian",
    type: "gradient",
    gradientCss: "radial-gradient(60% 50% at 20% 20%, var(--neon-soft), transparent 60%), radial-gradient(50% 40% at 80% 80%, var(--neon-soft), transparent 60%), radial-gradient(40% 30% at 50% 50%, rgba(255,255,255,0.04), transparent 70%)",
    tags: ["abstract", "dark", "neon", "default"],
    downloads: 0,
    rating: 4.8,
    isBuiltin: true,
    isPublic: true,
    createdAt: 1700000000000,
  },
  {
    id: "builtin-obsidian",
    title: "Obsidian",
    description: "Pure black with subtle noise texture",
    type: "gradient",
    gradientCss: "linear-gradient(135deg, #08080A 0%, #0F0F12 100%)",
    tags: ["dark", "minimal", "mono"],
    downloads: 0,
    rating: 4.5,
    isBuiltin: true,
    isPublic: true,
    createdAt: 1700000000000,
  },
  {
    id: "builtin-aurora",
    title: "Aurora",
    description: "Flowing northern lights in green and cyan",
    type: "gradient",
    gradientCss: "linear-gradient(135deg, #001a2e 0%, #003d5c 25%, #006d77 50%, #83c5be 75%, #edf6f9 100%)",
    tags: ["nature", "colorful", "calm"],
    downloads: 0,
    rating: 4.9,
    isBuiltin: true,
    isPublic: true,
    createdAt: 1700000000000,
  },
  {
    id: "builtin-cyberpunk",
    title: "Cyberpunk",
    description: "Neon pink and blue city aesthetic",
    type: "gradient",
    gradientCss: "linear-gradient(135deg, #0a0014 0%, #2d0a3e 30%, #ff006e 60%, #8338ec 100%)",
    tags: ["neon", "dark", "vibrant"],
    downloads: 0,
    rating: 4.7,
    isBuiltin: true,
    isPublic: true,
    createdAt: 1700000000000,
  },
  {
    id: "builtin-ocean",
    title: "Ocean",
    description: "Deep blue underwater caustics",
    type: "gradient",
    gradientCss: "linear-gradient(180deg, #001220 0%, #003566 40%, #0077b6 70%, #48cae4 100%)",
    tags: ["nature", "blue", "calm"],
    downloads: 0,
    rating: 4.6,
    isBuiltin: true,
    isPublic: true,
    createdAt: 1700000000000,
  },
  {
    id: "builtin-forest",
    title: "Forest",
    description: "Misty pine forest in deep green",
    type: "gradient",
    gradientCss: "linear-gradient(180deg, #081c15 0%, #1b4332 40%, #2d6a4f 70%, #52b788 100%)",
    tags: ["nature", "green", "dark"],
    downloads: 0,
    rating: 4.4,
    isBuiltin: true,
    isPublic: true,
    createdAt: 1700000000000,
  },
  {
    id: "builtin-inferno",
    title: "Inferno",
    description: "Flowing lava embers in orange and red",
    type: "gradient",
    gradientCss: "linear-gradient(135deg, #03071e 0%, #370617 30%, #9d0208 60%, #dc2f02 100%)",
    tags: ["fire", "dark", "vibrant"],
    downloads: 0,
    rating: 4.3,
    isBuiltin: true,
    isPublic: true,
    createdAt: 1700000000000,
  },
  {
    id: "builtin-frost",
    title: "Frost",
    description: "Frosted glass texture in cool whites",
    type: "gradient",
    gradientCss: "linear-gradient(135deg, #e9ecef 0%, #dee2e6 30%, #adb5bd 60%, #6c757d 100%)",
    tags: ["light", "minimal", "cool"],
    downloads: 0,
    rating: 4.2,
    isBuiltin: true,
    isPublic: true,
    createdAt: 1700000000000,
  },
  {
    id: "builtin-mono",
    title: "Mono",
    description: "Pure monochrome — black and white",
    type: "gradient",
    gradientCss: "linear-gradient(135deg, #000000 0%, #333333 50%, #ffffff 100%)",
    tags: ["mono", "minimal", "classic"],
    downloads: 0,
    rating: 4.0,
    isBuiltin: true,
    isPublic: true,
    createdAt: 1700000000000,
  },
  {
    id: "builtin-synthwave",
    title: "Synthwave",
    description: "80s retro grid with purple sunset",
    type: "gradient",
    gradientCss: "linear-gradient(180deg, #0d0221 0%, #2d00f7 30%, #6a0572 60%, #f72585 100%)",
    tags: ["retro", "neon", "vibrant"],
    downloads: 0,
    rating: 4.8,
    isBuiltin: true,
    isPublic: true,
    createdAt: 1700000000000,
  },
];

const uid = () => Math.random().toString(36).slice(2, 10);

export const useWallpaperStore = create<WallpaperState>()(
  persist(
    (set, get) => ({
      wallpapers: BUILTIN_WALLPAPERS,
      activeWallpaperId: "builtin-nebula",
      isMarketplaceOpen: false,

      setWallpapers: (wallpapers) => set({ wallpapers }),
      addWallpaper: (w) =>
        set((s) => ({
          wallpapers: [...s.wallpapers.filter((x) => x.id !== w.id), w],
        })),
      removeWallpaper: (id) =>
        set((s) => ({
          wallpapers: s.wallpapers.filter((w) => w.id !== id),
          activeWallpaperId: s.activeWallpaperId === id ? "builtin-nebula" : s.activeWallpaperId,
        })),
      setActiveWallpaper: (id) => set({ activeWallpaperId: id }),
      getActiveWallpaper: () => {
        const { wallpapers, activeWallpaperId } = get();
        return wallpapers.find((w) => w.id === activeWallpaperId) ?? null;
      },
      toggleMarketplace: (v) =>
        set((s) => ({ isMarketplaceOpen: v ?? !s.isMarketplaceOpen })),
      incrementDownloads: (id) =>
        set((s) => ({
          wallpapers: s.wallpapers.map((w) =>
            w.id === id ? { ...w, downloads: w.downloads + 1 } : w
          ),
        })),
    }),
    {
      name: "nebula-wallpapers",
      partialize: (s) => ({
        wallpapers: s.wallpapers.filter((w) => !w.isBuiltin || w.isBuiltin), // persist all
        activeWallpaperId: s.activeWallpaperId,
      }),
    }
  )
);
