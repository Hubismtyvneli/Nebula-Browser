"use client";

import { motion } from "framer-motion";
import { User, LogOut, Sparkles, Palette, Puzzle, Clock, Star, Download, Check } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useWallpaperStore } from "@/lib/wallpaper-store";
import { useThemeStore } from "@/lib/theme-store";
import { usePluginStore } from "@/lib/plugin-store";
import { useBrowserStore } from "@/lib/browser-store";
import { cn } from "@/lib/utils";

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const signOut = useAuthStore((s) => s.signOut);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const newTab = useBrowserStore((s) => s.newTab);
  const navigateTab = useBrowserStore((s) => s.navigateTab);

  const wallpapers = useWallpaperStore((s) => s.wallpapers);
  const activeWallpaperId = useWallpaperStore((s) => s.activeWallpaperId);
  const setActiveWallpaper = useWallpaperStore((s) => s.setActiveWallpaper);

  const themes = useThemeStore((s) => s.themes);
  const activeThemeId = useThemeStore((s) => s.activeThemeId);
  const applyTheme = useThemeStore((s) => s.applyTheme);

  const plugins = usePluginStore((s) => s.plugins);

  const ownedWallpapers = wallpapers.filter((w) => !w.isBuiltin || w.isBuiltin);
  const ownedThemes = themes.filter((t) => t.isOwned);
  const enabledPlugins = plugins.filter((p) => p.isEnabled);

  const openMarketplace = () => {
    const tabId = newTab();
    navigateTab(tabId, "nebula://marketplace", "Marketplace");
  };

  const openAuth = () => {
    const tabId = newTab();
    navigateTab(tabId, "nebula://auth", "Sign in");
  };

  if (!isSignedIn) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong max-w-md rounded-2xl p-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "var(--neon-soft)" }}>
            <User className="h-6 w-6 text-[var(--neon)]" />
          </div>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)]">Your Profile</h2>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Sign in to view your library, owned wallpapers, themes, and plugins.
          </p>
          <button
            type="button"
            onClick={openAuth}
            className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold"
            style={{ background: "var(--neon-soft)", color: "var(--neon)", boxShadow: "0 0 12px var(--neon-soft)" }}
          >
            Sign in
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-[var(--bg-canvas)] scroll-nebula">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong mb-6 flex items-center gap-4 rounded-2xl p-5"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--neon-soft)" }}>
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <User className="h-6 w-6 text-[var(--neon)]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">
              {user?.user_metadata?.name || user?.email?.split("@")[0] || "User"}
            </h1>
            <p className="text-[12px] text-[var(--text-tertiary)]">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[#FF5F57]"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </motion.div>

        {/* My Themes */}
        <Section title="My Themes" icon={Palette} count={ownedThemes.length} actionLabel="Browse" onAction={openMarketplace}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ownedThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTheme(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border p-3 text-left transition-colors",
                  t.id === activeThemeId ? "border-[var(--neon)] bg-[var(--neon-soft)]" : "border-[var(--border-hairline)] hover:border-[var(--border-glass)]"
                )}
              >
                <span className="text-[20px]">{t.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{t.name}</div>
                  {t.id === activeThemeId && <div className="text-[9px] text-[var(--neon)]">✓ Active</div>}
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* My Wallpapers */}
        <Section title="My Wallpapers" icon={Sparkles} count={ownedWallpapers.length} actionLabel="Browse" onAction={openMarketplace}>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {ownedWallpapers.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setActiveWallpaper(w.id)}
                className={cn(
                  "relative aspect-video overflow-hidden rounded-lg border transition-colors",
                  w.id === activeWallpaperId ? "border-[var(--neon)]" : "border-[var(--border-hairline)] hover:border-[var(--border-glass)]"
                )}
                style={{
                  background: w.gradientCss || `url(${w.fileUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {w.id === activeWallpaperId && (
                  <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--neon)]">
                    <Check className="h-2.5 w-2.5 text-black" />
                  </div>
                )}
                <span className="absolute bottom-1 left-1 truncate rounded bg-black/50 px-1 py-0.5 text-[8px] text-white/80">{w.title}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* My Plugins */}
        <Section title="My Plugins" icon={Puzzle} count={enabledPlugins.length} actionLabel="Browse" onAction={openMarketplace}>
          <div className="space-y-2">
            {enabledPlugins.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2.5">
                <span className="text-[18px]">{p.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-semibold text-[var(--text-primary)]">{p.name}</div>
                  <div className="truncate text-[10px] text-[var(--text-tertiary)]">{p.description}</div>
                </div>
                <Check className="h-3.5 w-3.5 text-[var(--neon)]" />
              </div>
            ))}
            {enabledPlugins.length === 0 && (
              <div className="rounded-lg border border-dashed border-[var(--border-hairline)] p-4 text-center text-[12px] text-[var(--text-tertiary)]">
                No plugins enabled yet. Browse the marketplace to find some.
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, count, actionLabel, onAction, children }: { title: string; icon: React.ElementType; count: number; actionLabel: string; onAction: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[var(--text-secondary)]" />
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h2>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]">{count}</span>
        </div>
        <button type="button" onClick={onAction} className="text-[11px] font-medium text-[var(--neon)] hover:underline">{actionLabel} →</button>
      </div>
      {children}
    </motion.div>
  );
}
