"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Star,
  Share,
  Sparkles,
  Download,
  MoreHorizontal,
  Lock,
  Search,
  X,
  Columns2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBrowserStore } from "@/lib/browser-store";
import { useAIStore } from "@/lib/ai-store";
import { normalizeOmniboxInput, prettyUrl, searchUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

export function Toolbar() {
  const tabs = useBrowserStore((s) => s.tabs);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const goBack = useBrowserStore((s) => s.goBack);
  const goForward = useBrowserStore((s) => s.goForward);
  const reloadTab = useBrowserStore((s) => s.reloadTab);
  const navigateTab = useBrowserStore((s) => s.navigateTab);
  const setTabStatus = useBrowserStore((s) => s.setTabStatus);
  const isBookmarked = useBrowserStore((s) => s.isBookmarked);
  const addBookmark = useBrowserStore((s) => s.addBookmark);
  const removeBookmark = useBrowserStore((s) => s.removeBookmark);
  const bookmarks = useBrowserStore((s) => s.bookmarks);
  const toggleAISidebar = useBrowserStore((s) => s.toggleAISidebar);
  const isAISidebarOpen = useBrowserStore((s) => s.isAISidebarOpen);
  const toggleDownloadsPanel = useBrowserStore((s) => s.toggleDownloadsPanel);
  const splitTabId = useBrowserStore((s) => s.splitTabId);
  const toggleSplit = useBrowserStore((s) => s.toggleSplit);
  const closeSplit = useBrowserStore((s) => s.closeSplit);

  const isThinking = useAIStore((s) => s.isThinking);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Simulate "loading" -> "idle" status transition so the spinner shows briefly
  useEffect(() => {
    if (!activeTab || activeTab.status !== "loading") return;
    const t = setTimeout(() => setTabStatus(activeTab.id, "idle"), 700);
    return () => clearTimeout(t);
  }, [activeTab, setTabStatus]);

  const canGoBack = !!activeTab && activeTab.historyIndex > 0;
  const canGoForward = !!activeTab && activeTab.historyIndex < activeTab.history.length - 1;
  const bookmarked = activeTab ? isBookmarked(activeTab.url) : false;

  return (
    <div className="relative z-20 flex h-13 items-center gap-1 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-2 backdrop-blur-xl">
      {/* Nav cluster */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<ArrowLeft className="h-4 w-4" />}
          disabled={!canGoBack}
          onClick={() => activeTab && goBack(activeTab.id)}
          label="Back"
        />
        <ToolbarButton
          icon={<ArrowRight className="h-4 w-4" />}
          disabled={!canGoForward}
          onClick={() => activeTab && goForward(activeTab.id)}
          label="Forward"
        />
        <ToolbarButton
          icon={<RotateCw className="h-4 w-4" />}
          onClick={() => activeTab && reloadTab(activeTab.id)}
          label="Reload"
        />
      </div>

      {/* Omnibox — keyed by tab id so input resets cleanly when switching tabs */}
      <Omnibox
        key={activeTab?.id ?? "empty"}
        url={activeTab?.url ?? ""}
        onNavigate={(url, title) => {
          if (!activeTab) return;
          navigateTab(activeTab.id, url, title);
          const parsed = normalizeOmniboxInput(url);
          if (parsed.type === "url") {
            useBrowserStore.getState().addHistory({
              url,
              title: title ?? prettyUrl(url),
            });
          }
        }}
      />

      {/* Right cluster */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={
            <Star
              className={cn("h-4 w-4", bookmarked && "fill-[var(--neon)] text-[var(--neon)]")}
            />
          }
          onClick={() => {
            if (!activeTab || !activeTab.url) return;
            if (bookmarked) {
              const b = bookmarks.find((x) => x.url === activeTab.url);
              if (b) removeBookmark(b.id);
            } else {
              addBookmark({
                title: activeTab.title,
                url: activeTab.url,
                favicon: activeTab.favicon,
              });
            }
          }}
          label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          disabled={!activeTab?.url}
        />
        <ToolbarButton
          icon={<Share className="h-4 w-4" />}
          onClick={() => {
            if (activeTab?.url) {
              navigator.clipboard?.writeText(activeTab.url);
            }
          }}
          label="Share"
          disabled={!activeTab?.url}
        />
        <ToolbarButton
          icon={<Download className="h-4 w-4" />}
          onClick={() => toggleDownloadsPanel()}
          label="Downloads"
        />
        <ToolbarButton
          icon={<MoreHorizontal className="h-4 w-4" />}
          onClick={() => useBrowserStore.getState().toggleSettings(true)}
          label="More"
        />

        {/* Split view toggle — neon when active */}
        <ToolbarButton
          icon={
            <Columns2
              className={cn(
                "h-4 w-4",
                splitTabId && "text-[var(--neon)]"
              )}
            />
          }
          onClick={() => {
            if (splitTabId) {
              closeSplit();
              return;
            }
            // Pick the most recent *other* tab to pin as the split
            const otherTabs = tabs.filter((t) => t.id !== activeTabId && t.url);
            if (otherTabs.length === 0) return;
            const target = otherTabs[otherTabs.length - 1];
            toggleSplit(target.id);
          }}
          label={splitTabId ? "Exit split view (⌘\\)" : "Split view (⌘\\)"}
          disabled={tabs.filter((t) => t.id !== activeTabId && t.url).length === 0 && !splitTabId}
        />

        {/* AI toggle — neon accent */}
        <motion.button
          type="button"
          onClick={() => toggleAISidebar()}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className={cn(
            "relative ml-1 flex h-9 items-center gap-1.5 rounded-full px-3 transition-all duration-200",
            isAISidebarOpen
              ? "bg-[var(--neon-soft)] text-[var(--neon)]"
              : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
          )}
          style={isAISidebarOpen ? { boxShadow: "var(--neon-glow)" } : undefined}
          title="Toggle AI sidebar (⌘J)"
        >
          <Sparkles className={cn("h-4 w-4", isThinking && "nebula-pulse")} />
          <span className="text-[12px] font-semibold">Nebula</span>
          <AnimatePresence>
            {isThinking && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--neon)]"
                style={{ boxShadow: "0 0 8px var(--neon)" }}
              />
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}

function Omnibox({
  url,
  onNavigate,
}: {
  url: string;
  onNavigate: (url: string, title?: string) => void;
}) {
  const [value, setValue] = useState(url);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘L focuses omnibox (global shortcut — listens on window)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    const parsed = normalizeOmniboxInput(value);
    const finalUrl = parsed.type === "url" ? parsed.value : searchUrl(parsed.value);
    const title = parsed.type === "search" ? `${parsed.value} — Search` : undefined;
    onNavigate(finalUrl, title);
    inputRef.current?.blur();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 px-2"
      onDragOver={(e) => {
        // Allow drops of URLs / text onto the omnibox (but NOT Files — those go to the global drop zone)
        if (Array.from(e.dataTransfer.types).some((t) => t === "text/uri-list" || t === "text/plain")) {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={(e) => {
        const uri = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
        if (uri) {
          e.preventDefault();
          e.stopPropagation();
          setValue(uri);
          inputRef.current?.focus();
          // Auto-submit if it's a URL
          const parsed = normalizeOmniboxInput(uri);
          if (parsed.type === "url") {
            onNavigate(parsed.value);
          }
        }
      }}
    >
      <div
        className={cn(
          "group relative flex h-9 items-center gap-2 rounded-full px-3 transition-all duration-200",
          isFocused
            ? "bg-[var(--bg-surface-elev)] neon-ring"
            : "bg-black/10 hover:bg-black/15"
        )}
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[var(--text-tertiary)]">
          {value.startsWith("https://") ? (
            <Lock className="h-3 w-3" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => {
            setIsFocused(true);
            e.target.select();
          }}
          onBlur={() => setIsFocused(false)}
          placeholder="Search the web or enter a URL — drop a link here"
          className="flex-1 bg-transparent text-[13px] font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          spellCheck={false}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-white/10 hover:text-[var(--text-primary)]"
            aria-label="Clear"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </form>
  );
}

function ToolbarButton({
  icon,
  onClick,
  disabled,
  label,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.06, y: -1 } : undefined}
      whileTap={!disabled ? { scale: 0.94 } : undefined}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
        disabled
          ? "text-[var(--text-tertiary)] opacity-40"
          : "text-[var(--text-secondary)] hover:bg-white/8 hover:text-[var(--text-primary)]"
      )}
      title={label}
      aria-label={label}
    >
      {icon}
    </motion.button>
  );
}
