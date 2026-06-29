"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Star, Download, Check, Plus, Trash2, Power } from "lucide-react";
import { useState } from "react";
import { usePluginStore, type PluginType, type Plugin } from "@/lib/plugin-store";
import { cn } from "@/lib/utils";

const CATEGORIES: { id: PluginType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "sidebar", label: "Sidebar" },
  { id: "toolbar", label: "Toolbar" },
  { id: "theme", label: "Themes" },
  { id: "ai", label: "AI" },
  { id: "content", label: "Content" },
  { id: "ntp-widget", label: "Widgets" },
];

const TYPE_LABELS: Record<PluginType, string> = {
  sidebar: "Sidebar Panel",
  toolbar: "Toolbar Action",
  theme: "Theme",
  ai: "AI Extension",
  content: "Content Modifier",
  "ntp-widget": "NTP Widget",
};

export function PluginMarketplace() {
  const isOpen = usePluginStore((s) => s.isMarketplaceOpen);
  const toggle = usePluginStore((s) => s.toggleMarketplace);
  const plugins = usePluginStore((s) => s.plugins);
  const togglePlugin = usePluginStore((s) => s.togglePlugin);
  const addPlugin = usePluginStore((s) => s.addPlugin);
  const removePlugin = usePluginStore((s) => s.removePlugin);

  const [category, setCategory] = useState<PluginType | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = plugins
    .filter((p) => category === "all" || p.type === category)
    .filter((p) =>
      search.trim() === ""
        ? true
        : p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase()) ||
          p.tags.some((t) => t.includes(search.toLowerCase()))
    )
    .sort((a, b) => Number(b.isBuiltin) - Number(a.isBuiltin) || b.installs - a.installs);

  const installedCount = plugins.filter((p) => p.isEnabled).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggle(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md"
          />
          <motion.div
            initial={{ x: 520, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 520, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 34, mass: 0.9 }}
            className="glass-strong fixed right-0 top-0 z-50 flex h-full w-[520px] flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-4">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Plugins</h2>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]">
                  {installedCount} enabled
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggle(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-[var(--border-hairline)] px-4 py-2">
              <div className="flex h-8 items-center gap-2 rounded-lg bg-black/10 px-2.5">
                <Search className="h-3 w-3 text-[var(--text-tertiary)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search plugins…"
                  className="flex-1 bg-transparent text-[12px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border-hairline)] px-4 py-2 scroll-nebula">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                    category === c.id
                      ? "bg-[var(--neon-soft)] text-[var(--neon)]"
                      : "text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Plugin list */}
            <div className="flex-1 overflow-y-auto p-4 scroll-nebula">
              {filtered.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-[12px] text-[var(--text-tertiary)]">
                    No plugins found{search ? ` for "${search}"` : " in this category"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((p, i) => (
                    <PluginCard
                      key={p.id}
                      plugin={p}
                      onToggle={() => togglePlugin(p.id)}
                      onRemove={() => removePlugin(p.id)}
                      onInstall={() => addPlugin({ ...p, isEnabled: true })}
                      delay={i * 0.03}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PluginCard({
  plugin,
  onToggle,
  onRemove,
  onInstall,
  delay,
}: {
  plugin: Plugin;
  onToggle: () => void;
  onRemove: () => void;
  onInstall: () => void;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 320, damping: 28 }}
      className="group flex items-start gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3 transition-colors hover:border-[var(--border-glass)]"
    >
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[20px]">
        {plugin.icon}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
            {plugin.name}
          </span>
          <span className="shrink-0 rounded-full bg-white/5 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            {TYPE_LABELS[plugin.type]}
          </span>
          {plugin.isBuiltin && (
            <span className="shrink-0 rounded-full bg-[var(--neon-soft)] px-1.5 py-0.5 text-[8px] font-semibold text-[var(--neon)]">
              Built-in
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--text-secondary)]">
          {plugin.description}
        </p>
        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
          {plugin.rating > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-[var(--neon)] text-[var(--neon)]" />
              {plugin.rating.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Download className="h-2.5 w-2.5" />
            {plugin.installs >= 1000 ? `${(plugin.installs / 1000).toFixed(1)}k` : plugin.installs}
          </span>
          <span>v{plugin.version}</span>
          {plugin.authorName && <span className="truncate">· {plugin.authorName}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {plugin.isEnabled ? (
          <>
            <button
              type="button"
              onClick={onToggle}
              className="flex h-7 items-center gap-1 rounded-md bg-[var(--neon-soft)] px-2.5 text-[10px] font-semibold text-[var(--neon)] transition-all"
              title="Disable"
            >
              <Check className="h-3 w-3" />
              Enabled
            </button>
            {!plugin.isBuiltin && (
              <button
                type="button"
                onClick={onRemove}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-white/5 hover:text-[#FF5F57]"
                title="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={onInstall}
            className="flex h-7 items-center gap-1 rounded-md bg-white/5 px-2.5 text-[10px] font-semibold text-[var(--text-primary)] transition-all hover:bg-white/10"
            title="Install"
          >
            <Plus className="h-3 w-3" />
            Install
          </button>
        )}
      </div>
    </motion.div>
  );
}
