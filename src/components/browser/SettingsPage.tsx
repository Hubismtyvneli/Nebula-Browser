"use client";

import { motion } from "framer-motion";
import {
  Palette, Layers, Zap, Sun, Moon, Monitor, Type, Download, CheckCircle2,
  Loader2, ExternalLink, User as UserIcon, LogOut, Cloud, Puzzle, MonitorSmartphone,
  Search, X, ChevronRight, Sparkles, MousePointer2, Bell, Shield, Keyboard,
  Globe, Wifi, HardDrive, Info,
} from "lucide-react";
import { useState } from "react";
import { useBrowserStore } from "@/lib/browser-store";
import { useSettingsStore, type AccentName, type GlassIntensity } from "@/lib/settings-store";
import { useAuthStore } from "@/lib/auth-store";
import { useWallpaperStore } from "@/lib/wallpaper-store";
import { usePluginStore } from "@/lib/plugin-store";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { checkForUpdatesManual, UpdateStatusBadge, APP_VERSION, type UpdateInfo } from "./UpdateNotification";

const ACCENTS: { id: AccentName; label: string; color: string }[] = [
  { id: "cyan",    label: "Cyan",    color: "#00E5FF" },
  { id: "magenta", label: "Magenta", color: "#FF00E5" },
  { id: "lime",    label: "Lime",    color: "#B6FF00" },
  { id: "amber",   label: "Amber",   color: "#FFB800" },
  { id: "off",     label: "Mono",    color: "#888888" },
];

const GLASS_LEVELS: { id: GlassIntensity; label: string; hint: string }[] = [
  { id: "off",    label: "Off",    hint: "Solid surfaces" },
  { id: "subtle", label: "Subtle", hint: "12px blur" },
  { id: "strong", label: "Strong", hint: "28px blur" },
];

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "account",    label: "Account & Sync", icon: Cloud },
  { id: "wallpaper",  label: "Wallpaper", icon: Sparkles },
  { id: "plugins",    label: "Plugins", icon: Puzzle },
  { id: "devices",    label: "Other Devices", icon: MonitorSmartphone },
  { id: "motion",     label: "Motion & Animations", icon: Zap },
  { id: "shortcuts",  label: "Keyboard Shortcuts", icon: Keyboard },
  { id: "privacy",    label: "Privacy & Data", icon: Shield },
  { id: "about",      label: "About", icon: Info },
];

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState("appearance");

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--bg-canvas)]">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-[var(--border-hairline)] bg-[var(--bg-surface)] backdrop-blur-xl">
        <div className="px-4 py-4">
          <h1 className="text-[16px] font-semibold text-[var(--text-primary)]">Settings</h1>
          <p className="text-[10px] text-[var(--text-tertiary)]">Customize Nebula</p>
        </div>
        <div className="px-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-colors",
                activeSection === s.id
                  ? "bg-[var(--neon-soft)] text-[var(--neon)]"
                  : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
              )}
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-nebula p-8">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mx-auto max-w-2xl"
        >
          {activeSection === "appearance" && <AppearanceSection />}
          {activeSection === "account" && <AccountSection />}
          {activeSection === "wallpaper" && <WallpaperSection />}
          {activeSection === "plugins" && <PluginsSection />}
          {activeSection === "devices" && <DevicesSection />}
          {activeSection === "motion" && <MotionSection />}
          {activeSection === "shortcuts" && <ShortcutsSection />}
          {activeSection === "privacy" && <PrivacySection />}
          {activeSection === "about" && <AboutSection />}
        </motion.div>
      </div>
    </div>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{desc}</p>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4", className)}>
      {children}
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const accent = useSettingsStore((s) => s.accent);
  const setAccent = useSettingsStore((s) => s.setAccent);
  const glass = useSettingsStore((s) => s.glass);
  const setGlass = useSettingsStore((s) => s.setGlass);

  return (
    <>
      <SectionHeader title="Appearance" desc="Customize how Nebula looks — theme, accent color, and glass intensity." />
      <div className="space-y-5">
        <Card>
          <label className="mb-3 block text-[13px] font-semibold text-[var(--text-primary)]">Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "light",  label: "Light",  icon: Sun },
              { id: "dark",   label: "Dark",   icon: Moon },
              { id: "system", label: "System", icon: Monitor },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-4 transition-all",
                  theme === t.id
                    ? "border-[var(--neon)] bg-[var(--neon-soft)]"
                    : "border-[var(--border-hairline)] hover:border-[var(--border-glass)]"
                )}
              >
                <t.icon className={cn("h-5 w-5", theme === t.id ? "text-[var(--neon)]" : "text-[var(--text-secondary)]")} />
                <span className={cn("text-[12px]", theme === t.id ? "text-[var(--neon)]" : "text-[var(--text-secondary)]")}>{t.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <label className="mb-3 block text-[13px] font-semibold text-[var(--text-primary)]">Neon accent color</label>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccent(a.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all",
                  accent === a.id ? "border-[var(--border-glass)] bg-white/5" : "border-[var(--border-hairline)]"
                )}
              >
                <span
                  className="h-8 w-8 rounded-full"
                  style={{ backgroundColor: a.color, boxShadow: accent === a.id ? `0 0 16px ${a.color}` : "none" }}
                />
                <span className="text-[10px] text-[var(--text-secondary)]">{a.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <label className="mb-3 block text-[13px] font-semibold text-[var(--text-primary)]">Liquid glass intensity</label>
          <div className="grid grid-cols-3 gap-2">
            {GLASS_LEVELS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGlass(g.id)}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-all",
                  glass === g.id
                    ? "border-[var(--neon)] bg-[var(--neon-soft)]"
                    : "border-[var(--border-hairline)] hover:border-[var(--border-glass)]"
                )}
              >
                <span className={cn("text-[13px] font-semibold", glass === g.id ? "text-[var(--neon)]" : "text-[var(--text-primary)]")}>{g.label}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">{g.hint}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function AccountSection() {
  const user = useAuthStore((s) => s.user);
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <>
      <SectionHeader title="Account & Sync" desc="Sign in to sync bookmarks, history, settings, and tabs across all your devices." />
      {isSignedIn && user ? (
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--neon-soft)" }}>
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <UserIcon className="h-5 w-5 text-[var(--neon)]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-[var(--text-primary)]">
                {user.user_metadata?.name || user.email?.split("@")[0] || "User"}
              </div>
              <div className="text-[12px] text-[var(--text-tertiary)]">{user.email}</div>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-white/8 hover:text-[#FF5F57]"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["Bookmarks", "History", "Settings", "AI Chats", "Tabs", "Wallpapers"].map((item) => (
              <div key={item} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-[11px] text-[var(--text-secondary)]">
                <CheckCircle2 className="h-3 w-3 text-[var(--neon)]" /> {item}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="h-5 w-5 text-[var(--neon)]" />
            <div className="text-[15px] font-semibold text-[var(--text-primary)]">Sign in to sync</div>
          </div>
          <p className="mb-4 text-[12px] text-[var(--text-secondary)]">
            Sync your bookmarks, history, settings, AI conversations, and open tabs across all your devices. Your data is encrypted and secure.
          </p>
          <button
            type="button"
            onClick={openAuthModal}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold"
            style={{ background: "var(--neon-soft)", color: "var(--neon)", boxShadow: "0 0 12px var(--neon-soft)" }}
          >
            <UserIcon className="h-4 w-4" /> Sign in or create account
          </button>
        </Card>
      )}
    </>
  );
}

function WallpaperSection() {
  const activeWallpaper = useWallpaperStore((s) => s.wallpapers.find((w) => w.id === s.activeWallpaperId));
  const wallpaperCount = useWallpaperStore((s) => s.wallpapers.length);

  return (
    <>
      <SectionHeader title="Wallpaper" desc="Choose from 10 built-in wallpapers or upload your own. Supports static images, animated videos, and CSS gradients." />
      <Card>
        <button
          type="button"
          onClick={() => useWallpaperStore.getState().toggleMarketplace(true)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 shrink-0 rounded-lg border border-[var(--border-hairline)]"
              style={{
                backgroundImage: activeWallpaper?.type === "gradient" && activeWallpaper?.gradientCss
                  ? activeWallpaper.gradientCss
                  : activeWallpaper?.fileUrl ? `url(${activeWallpaper.fileUrl})` : "none",
                backgroundColor: "var(--bg-canvas)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div>
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">{activeWallpaper?.title ?? "Default"}</div>
              <div className="text-[11px] text-[var(--text-tertiary)]">{wallpaperCount} wallpapers available</div>
            </div>
          </div>
          <span className="text-[12px] font-medium text-[var(--neon)]">Browse →</span>
        </button>
      </Card>
    </>
  );
}

function PluginsSection() {
  const enabledPlugins = usePluginStore((s) => s.plugins.filter((p) => p.isEnabled).length);
  const totalPlugins = usePluginStore((s) => s.plugins.length);

  return (
    <>
      <SectionHeader title="Plugins" desc="Extend Nebula with built-in and community plugins — themes, sidebar panels, toolbar actions, and more." />
      <Card>
        <button
          type="button"
          onClick={() => usePluginStore.getState().toggleMarketplace(true)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[20px]">🧩</div>
            <div>
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">{enabledPlugins} enabled · {totalPlugins} total</div>
              <div className="text-[11px] text-[var(--text-tertiary)]">Dark Reader, Screenshot, QR Generator, Notes, Clock</div>
            </div>
          </div>
          <span className="text-[12px] font-medium text-[var(--neon)]">Browse →</span>
        </button>
      </Card>
    </>
  );
}

function DevicesSection() {
  const toggleDeviceTabs = useBrowserStore((s) => s.toggleDeviceTabs);
  const isSignedIn = useAuthStore((s) => s.isSignedIn);

  return (
    <>
      <SectionHeader title="Tabs from other devices" desc="See and open tabs from your other devices in real time. Requires sign-in." />
      <Card>
        <button
          type="button"
          onClick={() => toggleDeviceTabs(true)}
          disabled={!isSignedIn}
          className={cn("flex w-full items-center justify-between", !isSignedIn && "opacity-50")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5">
              <MonitorSmartphone className="h-5 w-5 text-[var(--text-secondary)]" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                {isSignedIn ? "View synced tabs" : "Sign in required"}
              </div>
              <div className="text-[11px] text-[var(--text-tertiary)]">
                {isSignedIn ? "Real-time sync across all devices" : "Sync tabs across all your devices"}
              </div>
            </div>
          </div>
          {isSignedIn && <span className="text-[12px] font-medium text-[var(--neon)]">View →</span>}
        </button>
      </Card>
    </>
  );
}

function MotionSection() {
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const setReduceMotion = useSettingsStore((s) => s.setReduceMotion);

  return (
    <>
      <SectionHeader title="Motion & Animations" desc="Control animation behavior and reduce motion for accessibility." />
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium text-[var(--text-primary)]">Reduce motion</div>
            <div className="text-[11px] text-[var(--text-tertiary)]">Disable spring physics and animations</div>
          </div>
          <button
            type="button"
            onClick={() => setReduceMotion(!reduceMotion)}
            className={cn("relative h-6 w-11 rounded-full transition-colors", reduceMotion ? "bg-[var(--neon)]" : "bg-white/10")}
            style={reduceMotion ? { boxShadow: "0 0 12px var(--neon-soft)" } : undefined}
          >
            <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", reduceMotion ? "left-[22px]" : "left-0.5")} />
          </button>
        </div>
      </Card>
    </>
  );
}

function ShortcutsSection() {
  const shortcuts = [
    { keys: "⌘T / Ctrl+T", action: "New tab" },
    { keys: "⌘W / Ctrl+W", action: "Close tab" },
    { keys: "⌘L / Ctrl+L", action: "Focus omnibox" },
    { keys: "⌘K / Ctrl+K", action: "Command palette" },
    { keys: "⌘J / Ctrl+J", action: "Toggle AI sidebar" },
    { keys: "⌘Y / Ctrl+Y", action: "History panel" },
    { keys: "⌘, / Ctrl+,", action: "Settings (opens this page)" },
    { keys: "⌘\\ / Ctrl+\\", action: "Toggle split view" },
    { keys: "⌘⇧\\ / Ctrl+Shift+\\", action: "Swap split sides" },
    { keys: "⌘1-9", action: "Switch to tab N" },
    { keys: "Right-click tab", action: "Tab context menu" },
    { keys: "Drag file onto browser", action: "Open file in tab" },
    { keys: "Drag file onto AI", action: "Attach file to AI chat" },
  ];

  return (
    <>
      <SectionHeader title="Keyboard Shortcuts" desc="All keyboard shortcuts available in Nebula Browser." />
      <Card>
        <div className="space-y-1">
          {shortcuts.map((s, i) => (
            <div key={i} className={cn("flex items-center justify-between py-2", i < shortcuts.length - 1 && "border-b border-[var(--border-hairline)]")}>
              <span className="text-[12px] text-[var(--text-secondary)]">{s.action}</span>
              <kbd className="rounded-md border border-[var(--border-hairline)] bg-white/5 px-2 py-1 text-[10px] font-medium text-[var(--text-primary)]">{s.keys}</kbd>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function PrivacySection() {
  const clearHistory = useBrowserStore((s) => s.clearHistory);
  const clearDownloads = useBrowserStore((s) => s.clearDownloads);
  const historyCount = useBrowserStore((s) => s.history.length);
  const downloadsCount = useBrowserStore((s) => s.downloads.length);

  return (
    <>
      <SectionHeader title="Privacy & Data" desc="Manage your local browsing data. Synced data is managed in your Supabase account." />
      <div className="space-y-3">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-[var(--text-primary)]">Browsing history</div>
              <div className="text-[11px] text-[var(--text-tertiary)]">{historyCount} entries stored locally</div>
            </div>
            <button
              type="button"
              onClick={clearHistory}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[#FF5F57]"
            >
              Clear
            </button>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-[var(--text-primary)]">Downloads list</div>
              <div className="text-[11px] text-[var(--text-tertiary)]">{downloadsCount} items</div>
            </div>
            <button
              type="button"
              onClick={clearDownloads}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[#FF5F57]"
            >
              Clear
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

function AboutSection() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  const handleCheck = async () => {
    setIsChecking(true);
    const info = await checkForUpdatesManual();
    setUpdateInfo(info);
    setLastCheck(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setIsChecking(false);
  };

  return (
    <>
      <SectionHeader title="About" desc="Version info and update checker." />
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <div className="text-[15px] font-semibold text-[var(--text-primary)]">Nebula Browser</div>
          <UpdateStatusBadge update={updateInfo} />
        </div>
        <div className="text-[12px] text-[var(--text-secondary)] mb-2">
          A minimalistic, liquid-glass browser with built-in GLM AI.
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] mb-4">
          <span className="rounded-sm bg-white/5 px-1.5 py-0.5">v{APP_VERSION}</span>
          <span>·</span>
          <span>Next.js 16 · Electron 33 · GLM-4.6</span>
        </div>
        <div className="flex items-center gap-2 border-t border-[var(--border-hairline)] pt-3">
          <button
            type="button"
            onClick={handleCheck}
            disabled={isChecking}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[var(--neon-soft)] px-3 text-[12px] font-semibold text-[var(--neon)] disabled:opacity-50"
          >
            {isChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {isChecking ? "Checking…" : "Check for updates"}
          </button>
          {updateInfo?.hasUpdate && (
            <a
              href={updateInfo.releaseUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-[12px] font-medium text-[var(--text-primary)]"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Download
            </a>
          )}
        </div>
        {lastCheck && <div className="mt-2 text-[9px] text-[var(--text-tertiary)]">Last checked: {lastCheck}</div>}
      </Card>
    </>
  );
}
