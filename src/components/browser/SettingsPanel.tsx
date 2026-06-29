"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, Layers, Clock, Sparkles, Zap, Monitor, Sun, Moon, Type } from "lucide-react";
import { useBrowserStore } from "@/lib/browser-store";
import { useSettingsStore, type AccentName, type GlassIntensity } from "@/lib/settings-store";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

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

const WALLPAPERS = [
  { id: "aurora",  label: "Aurora",  colors: ["var(--neon-soft)", "transparent"] },
  { id: "obsidian",label: "Obsidian",colors: ["rgba(0,0,0,0.5)", "transparent"] },
  { id: "paper",   label: "Paper",   colors: ["rgba(255,255,255,0.5)", "transparent"] },
  { id: "void",    label: "Void",    colors: ["rgba(0,0,0,0.95)", "transparent"] },
] as const;

export function SettingsPanel() {
  const isOpen = useBrowserStore((s) => s.isSettingsOpen);
  const toggle = useBrowserStore((s) => s.toggleSettings);
  const { theme, setTheme } = useTheme();

  const accent = useSettingsStore((s) => s.accent);
  const setAccent = useSettingsStore((s) => s.setAccent);
  const glass = useSettingsStore((s) => s.glass);
  const setGlass = useSettingsStore((s) => s.setGlass);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const setReduceMotion = useSettingsStore((s) => s.setReduceMotion);
  const ntpWallpaper = useSettingsStore((s) => s.ntpWallpaper);
  const setNtpWallpaper = useSettingsStore((s) => s.setNtpWallpaper);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggle(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-4">
              <div>
                <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Settings</h2>
                <p className="text-[11px] text-[var(--text-tertiary)]">Make Nebula yours</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-5 scroll-nebula">
              {/* Theme */}
              <Section icon={<Sun className="h-3.5 w-3.5" />} title="Appearance">
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
                        "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all",
                        theme === t.id
                          ? "border-[var(--neon)] bg-[var(--neon-soft)]"
                          : "border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--border-glass)]"
                      )}
                    >
                      <t.icon className={cn("h-4 w-4", theme === t.id ? "text-[var(--neon)]" : "text-[var(--text-secondary)]")} />
                      <span className={cn("text-[11px]", theme === t.id ? "text-[var(--neon)]" : "text-[var(--text-secondary)]")}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </Section>

              {/* Accent */}
              <Section icon={<Palette className="h-3.5 w-3.5" />} title="Neon accent">
                <div className="grid grid-cols-5 gap-2">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAccent(a.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all",
                        accent === a.id
                          ? "border-[var(--border-glass)] bg-white/5"
                          : "border-[var(--border-hairline)] hover:border-[var(--border-glass)]"
                      )}
                    >
                      <span
                        className="h-6 w-6 rounded-full"
                        style={{
                          backgroundColor: a.color,
                          boxShadow: accent === a.id ? `0 0 12px ${a.color}` : "none",
                        }}
                      />
                      <span className="text-[10px] text-[var(--text-secondary)]">{a.label}</span>
                    </button>
                  ))}
                </div>
              </Section>

              {/* Glass intensity */}
              <Section icon={<Layers className="h-3.5 w-3.5" />} title="Liquid glass">
                <div className="grid grid-cols-3 gap-2">
                  {GLASS_LEVELS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGlass(g.id)}
                      className={cn(
                        "flex flex-col items-start gap-0.5 rounded-xl border p-2.5 text-left transition-all",
                        glass === g.id
                          ? "border-[var(--neon)] bg-[var(--neon-soft)]"
                          : "border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--border-glass)]"
                      )}
                    >
                      <span className={cn("text-[12px] font-semibold", glass === g.id ? "text-[var(--neon)]" : "text-[var(--text-primary)]")}>
                        {g.label}
                      </span>
                      <span className="text-[9px] text-[var(--text-tertiary)]">{g.hint}</span>
                    </button>
                  ))}
                </div>
              </Section>

              {/* Wallpaper */}
              <Section icon={<Sparkles className="h-3.5 w-3.5" />} title="New tab wallpaper">
                <div className="grid grid-cols-4 gap-2">
                  {WALLPAPERS.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setNtpWallpaper(w.id)}
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-xl border transition-all",
                        ntpWallpaper === w.id
                          ? "border-[var(--neon)]"
                          : "border-[var(--border-hairline)] hover:border-[var(--border-glass)]"
                      )}
                      style={{
                        background: `linear-gradient(135deg, ${w.colors[0]}, ${w.colors[1]})`,
                      }}
                    >
                      <span className="absolute bottom-1 left-1 text-[9px] text-white/80">
                        {w.label}
                      </span>
                    </button>
                  ))}
                </div>
              </Section>

              {/* Motion */}
              <Section icon={<Zap className="h-3.5 w-3.5" />} title="Motion">
                <Toggle
                  label="Reduce motion"
                  description="Disable spring physics and animations"
                  checked={reduceMotion}
                  onChange={setReduceMotion}
                />
              </Section>

              {/* About */}
              <Section icon={<Type className="h-3.5 w-3.5" />} title="About">
                <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
                  <div className="mb-1 text-[13px] font-semibold text-[var(--text-primary)]">
                    Nebula Browser
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    A minimalistic, liquid-glass browser concept with built-in GLM AI.
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                    <span className="rounded-sm bg-white/5 px-1.5 py-0.5">v0.1.0</span>
                    <span>·</span>
                    <span>Next.js 16 · GLM-4.6</span>
                  </div>
                </div>
              </Section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[var(--text-secondary)]">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3 text-left transition-colors hover:border-[var(--border-glass)]"
    >
      <div>
        <div className="text-[12px] font-medium text-[var(--text-primary)]">{label}</div>
        <div className="text-[10px] text-[var(--text-tertiary)]">{description}</div>
      </div>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-[var(--neon)]" : "bg-white/10"
        )}
        style={checked ? { boxShadow: "0 0 12px var(--neon-soft)" } : undefined}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}
