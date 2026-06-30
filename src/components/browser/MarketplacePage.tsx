"use client";

import { motion } from "framer-motion";
import { Search, Star, Download, Check, Plus, Sparkles, Puzzle, Palette, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useWallpaperStore, type Wallpaper } from "@/lib/wallpaper-store";
import { useThemeStore, type Theme } from "@/lib/theme-store";
import { usePluginStore, type Plugin } from "@/lib/plugin-store";
import { cn } from "@/lib/utils";

type Tab = "wallpapers" | "themes" | "plugins";
type SortOption = "trending" | "new" | "rating" | "downloads";

export function MarketplacePage() {
  const [tab, setTab] = useState<Tab>("wallpapers");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("trending");

  return (
    <div className="h-full w-full overflow-y-auto bg-[var(--bg-canvas)]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-6">
            <h1 className="text-[20px] font-bold tracking-tight text-[var(--text-primary)]">Marketplace</h1>
            <div className="flex gap-1">
              {([
                { id: "wallpapers" as Tab, label: "Wallpapers", icon: Sparkles },
                { id: "themes" as Tab, label: "Themes", icon: Palette },
                { id: "plugins" as Tab, label: "Plugins", icon: Puzzle },
              ]).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all",
                    tab === t.id
                      ? "bg-[var(--neon-soft)] text-[var(--neon)]"
                      : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 items-center gap-2 rounded-lg bg-black/10 px-3">
              <Search className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-48 bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="h-9 rounded-lg bg-black/10 px-2.5 text-[12px] text-[var(--text-secondary)] outline-none"
            >
              <option value="trending">🔥 Trending</option>
              <option value="new">✨ New</option>
              <option value="rating">⭐ Top Rated</option>
              <option value="downloads">📥 Downloads</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-8 py-8">
        {tab === "wallpapers" && <WallpaperTab search={search} sort={sort} />}
        {tab === "themes" && <ThemeTab search={search} sort={sort} />}
        {tab === "plugins" && <PluginTab search={search} sort={sort} />}
      </div>
    </div>
  );
}

// ============================================================================
// WALLPAPERS TAB
// ============================================================================
function WallpaperTab({ search, sort }: { search: string; sort: SortOption }) {
  const wallpapers = useWallpaperStore((s) => s.wallpapers);
  const activeWallpaperId = useWallpaperStore((s) => s.activeWallpaperId);
  const setActiveWallpaper = useWallpaperStore((s) => s.setActiveWallpaper);

  const filtered = wallpapers
    .filter((w) => !search || w.title.toLowerCase().includes(search.toLowerCase()) || w.tags.some((t) => t.includes(search.toLowerCase())))
    .sort((a, b) => {
      if (sort === "trending" || sort === "downloads") return b.downloads - a.downloads;
      if (sort === "rating") return b.rating - a.rating;
      return b.createdAt - a.createdAt;
    });

  const featured = filtered[0];
  const trending = filtered.slice(0, 6);
  const rest = filtered.slice(6);

  return (
    <div className="space-y-8">
      {/* Featured hero */}
      {featured && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-[var(--border-hairline)]"
        >
          <div className="relative h-56 overflow-hidden">
            <div className="h-full w-full" style={{ background: featured.gradientCss || `url(${featured.fileUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-[var(--neon)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">Featured</span>
                  <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white/70">{featured.type}</span>
                  {featured.downloads > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-white/50"><Download className="h-2.5 w-2.5" /> {featured.downloads > 999 ? `${(featured.downloads/1000).toFixed(1)}k` : featured.downloads}</span>
                  )}
                </div>
                <h2 className="text-[28px] font-bold text-white">{featured.title}</h2>
                <p className="text-[13px] text-white/50">{featured.description}</p>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveWallpaper(featured.id)}
                className="flex h-11 items-center gap-2 rounded-xl bg-[var(--neon)] px-5 text-[14px] font-bold text-black"
              >
                {activeWallpaperId === featured.id ? <><Check className="h-4 w-4" /> Applied</> : "Apply Now"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Trending grid */}
      <div>
        <div className="mb-4 flex items-center gap-2 text-[16px] font-bold text-[var(--text-primary)]">
          <TrendingUp className="h-5 w-5 text-[var(--neon)]" /> Trending Now
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {trending.map((w, i) => (
            <MarketplaceWallpaperCard key={w.id} wallpaper={w} isActive={w.id === activeWallpaperId} onApply={() => setActiveWallpaper(w.id)} delay={i * 0.04} />
          ))}
        </div>
      </div>

      {/* All wallpapers */}
      {rest.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2 text-[16px] font-bold text-[var(--text-primary)]">
            <Clock className="h-5 w-5 text-[var(--text-secondary)]" /> All Wallpapers
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {rest.map((w, i) => (
              <MarketplaceWallpaperCard key={w.id} wallpaper={w} isActive={w.id === activeWallpaperId} onApply={() => setActiveWallpaper(w.id)} delay={i * 0.02} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MarketplaceWallpaperCard({ wallpaper, isActive, onApply, delay }: { wallpaper: Wallpaper; isActive: boolean; onApply: () => void; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 26 }}
      whileHover={{ y: -4, scale: 1.03 }}
      onClick={onApply}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-xl border transition-colors",
        isActive ? "border-[var(--neon)]" : "border-[var(--border-hairline)] hover:border-[var(--border-glass)]"
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {wallpaper.type === "gradient" && wallpaper.gradientCss ? (
          <div className="h-full w-full" style={{ background: wallpaper.gradientCss }} />
        ) : wallpaper.fileUrl ? (
          (wallpaper.type === "animated" && !wallpaper.fileUrl.toLowerCase().endsWith(".gif")) ? (
            <video src={wallpaper.fileUrl} className="h-full w-full object-cover" muted loop autoPlay playsInline />
          ) : (
            <img src={wallpaper.fileUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          )
        ) : null}
        {isActive && (
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--neon)]">
            <Check className="h-3 w-3 text-black" />
          </div>
        )}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
          <span className="rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-white/60 backdrop-blur-sm">{wallpaper.type}</span>
          {wallpaper.rating > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] text-white/60 backdrop-blur-sm">
              <Star className="h-2 w-2 fill-[var(--neon)] text-[var(--neon)]" /> {wallpaper.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <div className="p-2.5">
        <div className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{wallpaper.title}</div>
        <div className="mt-0.5 flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
          {wallpaper.downloads > 0 ? `${wallpaper.downloads > 999 ? `${(wallpaper.downloads/1000).toFixed(1)}k` : wallpaper.downloads} dl` : ""}
          <span className="rounded-full bg-white/5 px-1.5 py-0.5">{wallpaper.price === 0 ? "Free" : `$${wallpaper.price}`}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// THEMES TAB
// ============================================================================
function ThemeTab({ search, sort }: { search: string; sort: SortOption }) {
  const themes = useThemeStore((s) => s.themes);
  const activeThemeId = useThemeStore((s) => s.activeThemeId);
  const applyTheme = useThemeStore((s) => s.applyTheme);
  const acquireTheme = useThemeStore((s) => s.acquireTheme);

  const filtered = themes
    .filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.tags.some((tag) => tag.includes(search.toLowerCase())))
    .sort((a, b) => {
      if (sort === "trending" || sort === "downloads") return b.installs - a.installs;
      if (sort === "rating") return b.rating - a.rating;
      return b.createdAt - a.createdAt;
    });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="space-y-8">
      {/* Featured theme */}
      {featured && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-[var(--border-hairline)]"
        >
          <div className="relative h-48 overflow-hidden" style={{ background: featured.config.wallpaperId === "builtin-obsidian" ? "#08080A" : featured.config.wallpaperId === "builtin-frost" ? "#e9ecef" : "#0a0a0c" }}>
            {/* Mock browser UI */}
            <div className="absolute left-4 top-3 flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
              <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
              <span className="h-3 w-3 rounded-full bg-[#28C840]" />
            </div>
            <div className="absolute left-4 right-4 top-9 flex h-6 items-center rounded-lg" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${getAccentColor(featured.config.accent)}40` }} />
            <div className="absolute left-4 right-4 top-18 space-y-2 pt-4">
              <div className="h-2 w-2/3 rounded" style={{ background: "rgba(255,255,255,0.12)" }} />
              <div className="h-2 w-1/2 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="h-2 w-3/5 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>
            <div className="absolute right-4 top-3 text-[28px]">{featured.icon}</div>
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-5">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full bg-[var(--neon)] px-2 py-0.5 text-[9px] font-bold uppercase text-black">Featured Theme</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-white/50"><Star className="h-2.5 w-2.5 fill-[var(--neon)] text-[var(--neon)]" /> {featured.rating.toFixed(1)}</span>
                </div>
                <h2 className="text-[24px] font-bold text-white">{featured.name}</h2>
                <p className="text-[12px] text-white/50">{featured.description}</p>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => applyTheme(featured.id)}
                className="flex h-10 items-center gap-2 rounded-xl bg-[var(--neon)] px-4 text-[13px] font-bold text-black"
              >
                {activeThemeId === featured.id ? <><Check className="h-4 w-4" /> Applied</> : "Apply Theme"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Theme grid */}
      <div>
        <div className="mb-4 flex items-center gap-2 text-[16px] font-bold text-[var(--text-primary)]">
          <Palette className="h-5 w-5 text-[var(--neon)]" /> All Themes
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((t, i) => (
            <ThemeCardLarge key={t.id} theme={t} isActive={t.id === activeThemeId} onApply={() => applyTheme(t.id)} onGet={() => acquireTheme(t.id)} delay={i * 0.04} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ThemeCardLarge({ theme, isActive, onApply, onGet, delay }: { theme: Theme; isActive: boolean; onApply: () => void; onGet: () => void; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 26 }}
      whileHover={{ y: -4 }}
      className={cn("overflow-hidden rounded-xl border transition-colors", isActive ? "border-[var(--neon)]" : "border-[var(--border-hairline)]")}
    >
      {/* Mini browser mockup */}
      <div className="relative h-28 overflow-hidden" style={{ background: theme.config.wallpaperId === "builtin-obsidian" ? "#08080A" : theme.config.wallpaperId === "builtin-frost" ? "#e9ecef" : "#0a0a0c" }}>
        <div className="absolute left-2 top-2 flex gap-1">
          <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <span className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <div className="absolute left-2 right-2 top-6 flex h-4 items-center rounded" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${getAccentColor(theme.config.accent)}30` }} />
        <div className="absolute right-2 top-1.5 text-[16px]">{theme.icon}</div>
        <div className="absolute bottom-2 left-2 space-y-1">
          <div className="h-1.5 w-20 rounded" style={{ background: "rgba(255,255,255,0.1)" }} />
          <div className="h-1.5 w-14 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="truncate text-[14px] font-bold text-[var(--text-primary)]">{theme.name}</span>
          {theme.isBuiltin && <span className="shrink-0 rounded-full bg-[var(--neon-soft)] px-1.5 py-0.5 text-[8px] font-semibold text-[var(--neon)]">Built-in</span>}
        </div>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--text-secondary)]">{theme.description}</p>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
          <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-[var(--neon)] text-[var(--neon)]" />{theme.rating.toFixed(1)}</span>
          <span className="flex items-center gap-0.5"><Download className="h-2.5 w-2.5" />{theme.installs > 999 ? `${(theme.installs/1000).toFixed(1)}k` : theme.installs}</span>
          <span className="rounded-full bg-white/5 px-1.5 py-0.5">{theme.price === 0 ? "Free" : `$${theme.price}`}</span>
        </div>
        <div className="mt-2.5">
          {isActive ? (
            <div className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--neon-soft)] text-[11px] font-semibold text-[var(--neon)]">
              <Check className="h-3 w-3" /> Active
            </div>
          ) : theme.isOwned ? (
            <button type="button" onClick={onApply} className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--neon-soft)] text-[11px] font-semibold text-[var(--neon)] hover:scale-[1.02]">
              Apply Theme
            </button>
          ) : (
            <button type="button" onClick={onGet} className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-white/5 text-[11px] font-semibold text-[var(--text-primary)] hover:bg-white/10">
              <Plus className="h-3 w-3" /> {theme.price === 0 ? "Get Free" : `Buy $${theme.price}`}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function getAccentColor(accent: string): string {
  const colors: Record<string, string> = {
    cyan: "#00E5FF", magenta: "#FF00E5", lime: "#B6FF00", amber: "#FFB800", off: "#888888",
  };
  return colors[accent] ?? "#00E5FF";
}

// ============================================================================
// PLUGINS TAB
// ============================================================================
function PluginTab({ search, sort }: { search: string; sort: SortOption }) {
  const plugins = usePluginStore((s) => s.plugins);
  const togglePlugin = usePluginStore((s) => s.togglePlugin);
  const addPlugin = usePluginStore((s) => s.addPlugin);

  const filtered = plugins
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "trending" || sort === "downloads") return b.installs - a.installs;
      if (sort === "rating") return b.rating - a.rating;
      return b.createdAt - a.createdAt;
    });

  return (
    <div className="space-y-3">
      {filtered.map((p, i) => {
        const typeLabels: Record<string, string> = { sidebar: "Sidebar", toolbar: "Toolbar", theme: "Theme", ai: "AI", content: "Content", "ntp-widget": "Widget" };
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 26 }}
            whileHover={{ y: -2 }}
            className="flex items-center gap-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 transition-colors hover:border-[var(--border-glass)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[24px]">{p.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[15px] font-bold text-[var(--text-primary)]">{p.name}</span>
                <span className="shrink-0 rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[var(--text-tertiary)]">{typeLabels[p.type]}</span>
                {p.isBuiltin && <span className="shrink-0 rounded-full bg-[var(--neon-soft)] px-1.5 py-0.5 text-[8px] font-semibold text-[var(--neon)]">Built-in</span>}
              </div>
              <p className="mt-0.5 line-clamp-2 text-[12px] text-[var(--text-secondary)]">{p.description}</p>
              <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
                {p.rating > 0 && <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-[var(--neon)] text-[var(--neon)]" />{p.rating.toFixed(1)}</span>}
                <span className="flex items-center gap-0.5"><Download className="h-2.5 w-2.5" />{p.installs > 999 ? `${(p.installs/1000).toFixed(1)}k` : p.installs}</span>
                <span>v{p.version}</span>
                <span className="rounded-full bg-white/5 px-1.5 py-0.5">{p.price === 0 ? "Free" : `$${p.price}`}</span>
              </div>
            </div>
            <div className="shrink-0">
              {p.isEnabled ? (
                <button type="button" onClick={() => togglePlugin(p.id)} className="flex h-9 items-center gap-1.5 rounded-lg bg-[var(--neon-soft)] px-3 text-[11px] font-semibold text-[var(--neon)]">
                  <Check className="h-3.5 w-3.5" /> Enabled
                </button>
              ) : (
                <button type="button" onClick={() => addPlugin({ ...p, isEnabled: true })} className="flex h-9 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-[11px] font-semibold text-[var(--text-primary)] hover:bg-white/10">
                  <Plus className="h-3.5 w-3.5" /> Install
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
