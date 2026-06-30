"use client";

import { motion } from "framer-motion";
import { Search, Star, Download, Check, Plus, Sparkles, Puzzle, Palette, Upload, TrendingUp, Clock } from "lucide-react";
import { useState } from "react";
import { useWallpaperStore, type Wallpaper } from "@/lib/wallpaper-store";
import { useThemeStore, type Theme } from "@/lib/theme-store";
import { usePluginStore, type Plugin } from "@/lib/plugin-store";
import { useBrowserStore } from "@/lib/browser-store";
import { cn } from "@/lib/utils";

type Tab = "wallpapers" | "themes" | "plugins";
type SortOption = "trending" | "new" | "rating" | "downloads";

export function MarketplacePage() {
  const [tab, setTab] = useState<Tab>("wallpapers");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("trending");

  return (
    <div className="h-full w-full overflow-y-auto bg-[var(--bg-canvas)]">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">Marketplace</h1>
            <div className="flex gap-1 rounded-lg bg-black/10 p-0.5">
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
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                    tab === t.id ? "bg-[var(--neon-soft)] text-[var(--neon)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center gap-2 rounded-lg bg-black/10 px-3">
              <Search className="h-3 w-3 text-[var(--text-tertiary)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-40 bg-transparent text-[12px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="h-8 rounded-lg bg-black/10 px-2 text-[11px] text-[var(--text-secondary)] outline-none"
            >
              <option value="trending">Trending</option>
              <option value="new">New</option>
              <option value="rating">Top Rated</option>
              <option value="downloads">Most Downloaded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-6">
        {tab === "wallpapers" && <WallpaperMarketplaceContent search={search} sort={sort} />}
        {tab === "themes" && <ThemeMarketplaceContent search={search} sort={sort} />}
        {tab === "plugins" && <PluginMarketplaceContent search={search} sort={sort} />}
      </div>
    </div>
  );
}

// ============================================================================
// WALLPAPERS
// ============================================================================
function WallpaperMarketplaceContent({ search, sort }: { search: string; sort: SortOption }) {
  const wallpapers = useWallpaperStore((s) => s.wallpapers);
  const activeWallpaperId = useWallpaperStore((s) => s.activeWallpaperId);
  const setActiveWallpaper = useWallpaperStore((s) => s.setActiveWallpaper);
  const toggleMarketplace = useWallpaperStore((s) => s.toggleMarketplace);

  const filtered = wallpapers
    .filter((w) => !search || w.title.toLowerCase().includes(search.toLowerCase()) || w.tags.some((t) => t.includes(search.toLowerCase())))
    .sort((a, b) => {
      if (sort === "trending" || sort === "downloads") return b.downloads - a.downloads;
      if (sort === "rating") return b.rating - a.rating;
      return b.createdAt - a.createdAt;
    });

  const featured = filtered.slice(0, 1)[0];
  const rest = filtered.slice(1);

  return (
    <div>
      {/* Hero featured */}
      {featured && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-hidden rounded-2xl border border-[var(--border-hairline)]"
        >
          <div className="relative h-48 overflow-hidden">
            <div className="h-full w-full" style={{ background: featured.gradientCss || `url(${featured.fileUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full bg-[var(--neon)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">Featured</span>
                  <span className="rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-semibold text-white/80">{featured.type}</span>
                </div>
                <h2 className="text-[24px] font-bold text-white">{featured.title}</h2>
                <p className="text-[12px] text-white/60">{featured.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveWallpaper(featured.id)}
                className="flex h-10 items-center gap-2 rounded-lg bg-[var(--neon)] px-4 text-[13px] font-bold text-black"
              >
                {activeWallpaperId === featured.id ? <><Check className="h-4 w-4" /> Applied</> : "Apply Now"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Grid */}
      <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]">
        <TrendingUp className="h-4 w-4" /> Trending
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rest.map((w, i) => (
          <WallpaperCard key={w.id} wallpaper={w} isActive={w.id === activeWallpaperId} onApply={() => setActiveWallpaper(w.id)} delay={i * 0.03} />
        ))}
      </div>
    </div>
  );
}

function WallpaperCard({ wallpaper, isActive, onApply, delay }: { wallpaper: Wallpaper; isActive: boolean; onApply: () => void; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 320, damping: 28 }}
      whileHover={{ y: -3, scale: 1.02 }}
      onClick={onApply}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-xl border transition-colors",
        isActive ? "border-[var(--neon)]" : "border-[var(--border-hairline)] hover:border-[var(--border-glass)]"
      )}
    >
      <div className="relative h-28 overflow-hidden">
        {wallpaper.type === "gradient" && wallpaper.gradientCss ? (
          <div className="h-full w-full" style={{ background: wallpaper.gradientCss }} />
        ) : wallpaper.fileUrl ? (
          wallpaper.type === "animated" ? (
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
        <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-white/70">{wallpaper.type}</span>
        {wallpaper.downloads > 0 && (
          <span className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] text-white/70">
            <Download className="h-2 w-2" /> {wallpaper.downloads > 999 ? `${(wallpaper.downloads / 1000).toFixed(1)}k` : wallpaper.downloads}
          </span>
        )}
      </div>
      <div className="p-2.5">
        <div className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{wallpaper.title}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
          {wallpaper.rating > 0 && (
            <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-[var(--neon)] text-[var(--neon)]" />{wallpaper.rating.toFixed(1)}</span>
          )}
          {wallpaper.authorName && <span className="truncate">· {wallpaper.authorName}</span>}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// THEMES
// ============================================================================
function ThemeMarketplaceContent({ search, sort }: { search: string; sort: SortOption }) {
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

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((t, i) => (
        <ThemeCard
          key={t.id}
          theme={t}
          isActive={t.id === activeThemeId}
          onApply={() => applyTheme(t.id)}
          onGet={() => acquireTheme(t.id)}
          delay={i * 0.04}
        />
      ))}
    </div>
  );
}

function ThemeCard({ theme, isActive, onApply, onGet, delay }: { theme: Theme; isActive: boolean; onApply: () => void; onGet: () => void; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 320, damping: 28 }}
      whileHover={{ y: -3 }}
      className={cn(
        "overflow-hidden rounded-xl border transition-colors",
        isActive ? "border-[var(--neon)]" : "border-[var(--border-hairline)]"
      )}
    >
      {/* Preview — mini browser mockup with theme colors */}
      <div className="relative h-32 overflow-hidden" style={{ background: theme.config.wallpaperId === "builtin-obsidian" ? "#08080A" : theme.config.wallpaperId === "builtin-frost" ? "#e9ecef" : "#0a0a0c" }}>
        <div className="absolute left-2 top-2 flex gap-1">
          <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <span className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <div className="absolute left-2 right-2 top-6 flex h-4 items-center rounded" style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${theme.config.accent === "cyan" ? "#00E5FF" : theme.config.accent === "magenta" ? "#FF00E5" : theme.config.accent === "lime" ? "#B6FF00" : theme.config.accent === "amber" ? "#FFB800" : "#888"}` }} />
        <div className="absolute left-2 right-2 top-12 space-y-1">
          <div className="h-1.5 w-3/4 rounded" style={{ background: "rgba(255,255,255,0.15)" }} />
          <div className="h-1.5 w-1/2 rounded" style={{ background: "rgba(255,255,255,0.1)" }} />
        </div>
        <div className="absolute right-2 top-2 text-[16px]">{theme.icon}</div>
      </div>
      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{theme.name}</span>
          {theme.isBuiltin && <span className="shrink-0 rounded-full bg-[var(--neon-soft)] px-1.5 py-0.5 text-[8px] font-semibold text-[var(--neon)]">Built-in</span>}
        </div>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--text-secondary)]">{theme.description}</p>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
          <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-[var(--neon)] text-[var(--neon)]" />{theme.rating.toFixed(1)}</span>
          <span className="flex items-center gap-0.5"><Download className="h-2.5 w-2.5" />{theme.installs > 999 ? `${(theme.installs / 1000).toFixed(1)}k` : theme.installs}</span>
          <span className="rounded-full bg-white/5 px-1.5 py-0.5">{theme.price === 0 ? "Free" : `$${theme.price}`}</span>
        </div>
        <div className="mt-2.5 flex gap-2">
          {isActive ? (
            <div className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--neon-soft)] text-[11px] font-semibold text-[var(--neon)]">
              <Check className="h-3 w-3" /> Applied
            </div>
          ) : theme.isOwned ? (
            <button type="button" onClick={onApply} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--neon-soft)] text-[11px] font-semibold text-[var(--neon)] hover:scale-105">
              Apply Theme
            </button>
          ) : (
            <button type="button" onClick={onGet} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 text-[11px] font-semibold text-[var(--text-primary)] hover:bg-white/10">
              <Plus className="h-3 w-3" /> {theme.price === 0 ? "Get Free" : `Buy $${theme.price}`}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// PLUGINS
// ============================================================================
function PluginMarketplaceContent({ search, sort }: { search: string; sort: SortOption }) {
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
    <div className="space-y-2">
      {filtered.map((p, i) => (
        <PluginCard key={p.id} plugin={p} onToggle={() => togglePlugin(p.id)} onInstall={() => addPlugin({ ...p, isEnabled: true })} delay={i * 0.03} />
      ))}
    </div>
  );
}

function PluginCard({ plugin, onToggle, onInstall, delay }: { plugin: Plugin; onToggle: () => void; onInstall: () => void; delay: number }) {
  const typeLabels: Record<string, string> = { sidebar: "Sidebar", toolbar: "Toolbar", theme: "Theme", ai: "AI", content: "Content", "ntp-widget": "Widget" };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-start gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[22px]">{plugin.icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{plugin.name}</span>
          <span className="shrink-0 rounded-full bg-white/5 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-[var(--text-tertiary)]">{typeLabels[plugin.type]}</span>
          {plugin.isBuiltin && <span className="shrink-0 rounded-full bg-[var(--neon-soft)] px-1.5 py-0.5 text-[8px] font-semibold text-[var(--neon)]">Built-in</span>}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[12px] text-[var(--text-secondary)]">{plugin.description}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
          {plugin.rating > 0 && <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-[var(--neon)] text-[var(--neon)]" />{plugin.rating.toFixed(1)}</span>}
          <span className="flex items-center gap-0.5"><Download className="h-2.5 w-2.5" />{plugin.installs > 999 ? `${(plugin.installs / 1000).toFixed(1)}k` : plugin.installs}</span>
          <span>v{plugin.version}</span>
          <span className="rounded-full bg-white/5 px-1.5 py-0.5">{plugin.price === 0 ? "Free" : `$${plugin.price}`}</span>
        </div>
      </div>
      <div className="shrink-0">
        {plugin.isEnabled ? (
          <button type="button" onClick={onToggle} className="flex h-8 items-center gap-1 rounded-md bg-[var(--neon-soft)] px-2.5 text-[10px] font-semibold text-[var(--neon)]">
            <Check className="h-3 w-3" /> Enabled
          </button>
        ) : (
          <button type="button" onClick={onInstall} className="flex h-8 items-center gap-1 rounded-md bg-white/5 px-2.5 text-[10px] font-semibold text-[var(--text-primary)] hover:bg-white/10">
            <Plus className="h-3 w-3" /> Install
          </button>
        )}
      </div>
    </motion.div>
  );
}
