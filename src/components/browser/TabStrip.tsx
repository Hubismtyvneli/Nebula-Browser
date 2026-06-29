"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Loader2 } from "lucide-react";
import { useBrowserStore, type Tab } from "@/lib/browser-store";
import { cn } from "@/lib/utils";

interface TabPillProps {
  tab: Tab;
  active: boolean;
  index: number;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}

function TabPill({ tab, active, onClick, onClose }: TabPillProps) {
  return (
    <motion.div
      layout
      layoutId={`tab-${tab.id}`}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.85, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, width: 0, marginRight: 0, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      whileHover={{ y: -1 }}
      className={cn(
        "group relative flex h-8 min-w-[120px] max-w-[200px] cursor-pointer items-center gap-2 rounded-lg px-3 no-drag",
        "transition-colors duration-200",
        active
          ? "bg-white/10 text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-white/5"
      )}
      style={
        active
          ? {
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.18)",
            }
          : undefined
      }
    >
      {/* Active neon underline */}
      {active && (
        <motion.span
          layoutId="tab-underline"
          className="absolute -bottom-px left-3 right-3 h-px"
          style={{
            background: "var(--neon)",
            boxShadow: "0 0 8px var(--neon-soft)",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      {/* Favicon / spinner */}
      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[11px] font-semibold">
        {tab.status === "loading" ? (
          <Loader2 className="h-3 w-3 animate-spin text-[var(--neon)]" />
        ) : (
          <span className="text-[var(--text-secondary)]">{tab.favicon ?? "✦"}</span>
        )}
      </span>

      {/* Title */}
      <span className="flex-1 truncate text-[12px] font-medium leading-none">
        {tab.title || "New Tab"}
      </span>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[var(--text-tertiary)] opacity-0 transition-all hover:bg-white/10 hover:text-[var(--text-primary)] group-hover:opacity-100"
        aria-label="Close tab"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

export function TabStrip() {
  const tabs = useBrowserStore((s) => s.tabs);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const activateTab = useBrowserStore((s) => s.activateTab);
  const closeTab = useBrowserStore((s) => s.closeTab);
  const newTab = useBrowserStore((s) => s.newTab);

  return (
    <div className="flex h-11 flex-1 items-center gap-1 overflow-x-auto px-2 scroll-nebula no-drag">
      <AnimatePresence initial={false} mode="popLayout">
        {tabs.map((tab, i) => (
          <TabPill
            key={tab.id}
            tab={tab}
            index={i}
            active={tab.id === activeTabId}
            onClick={() => activateTab(tab.id)}
            onClose={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          />
        ))}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => newTab()}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
        aria-label="New tab"
        title="New tab (⌘T)"
      >
        <Plus className="h-4 w-4" />
      </motion.button>
    </div>
  );
}
