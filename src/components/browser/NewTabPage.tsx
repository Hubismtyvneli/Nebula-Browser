"use client";

import { motion } from "framer-motion";
import { Sparkles, Search, Code, Languages, FileText, Plus, Clock } from "lucide-react";
import { useState } from "react";
import { useBrowserStore } from "@/lib/browser-store";
import { useAIStore } from "@/lib/ai-store";
import { normalizeOmniboxInput, searchUrl, prettyUrl } from "@/lib/url";
import { Favicon } from "./Favicon";

const QUICK_LINKS = [
  { title: "GitHub",     url: "https://github.com",     favicon: "G", color: "#FFFFFF" },
  { title: "YouTube",    url: "https://youtube.com",    favicon: "Y", color: "#FF0000" },
  { title: "X",          url: "https://x.com",          favicon: "X", color: "#FFFFFF" },
  { title: "Hacker News",url: "https://news.ycombinator.com", favicon: "N", color: "#FF6600" },
  { title: "Wikipedia",  url: "https://wikipedia.org",  favicon: "W", color: "#FFFFFF" },
  { title: "Reddit",     url: "https://reddit.com",     favicon: "R", color: "#FF4500" },
  { title: "ArXiv",      url: "https://arxiv.org",      favicon: "A", color: "#B31B1B" },
  { title: "MDN",        url: "https://developer.mozilla.org", favicon: "M", color: "#FFFFFF" },
];

const MODES = [
  { id: "chat",      label: "Chat",      icon: Sparkles },
  { id: "summarize", label: "Summarize", icon: FileText },
  { id: "translate", label: "Translate", icon: Languages },
  { id: "code",      label: "Code",      icon: Code },
] as const;

export function NewTabPage() {
  const navigateTab = useBrowserStore((s) => s.navigateTab);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const addHistory = useBrowserStore((s) => s.addHistory);
  const history = useBrowserStore((s) => s.history);
  const toggleAISidebar = useBrowserStore((s) => s.toggleAISidebar);
  const isAISidebarOpen = useBrowserStore((s) => s.isAISidebarOpen);

  const setMode = useAIStore((s) => s.setMode);
  const newConversation = useAIStore((s) => s.newConversation);

  const [query, setQuery] = useState("");

  const go = (raw: string) => {
    if (!activeTabId || !raw.trim()) return;
    const parsed = normalizeOmniboxInput(raw);
    const url = parsed.type === "url" ? parsed.value : searchUrl(parsed.value);
    const title = parsed.type === "search" ? `${parsed.value} — Search` : prettyUrl(url);
    navigateTab(activeTabId, url, title);
    if (parsed.type === "url") addHistory({ url, title });
  };

  const handleAIMode = (modeId: typeof MODES[number]["id"]) => {
    setMode(modeId);
    if (!isAISidebarOpen) toggleAISidebar(true);
    if (useAIStore.getState().activeConversationId === null) {
      newConversation();
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-start overflow-y-auto scroll-nebula px-6 pt-20 pb-12">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-5"
      >
        <div className="relative h-16 w-16">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, var(--neon), transparent 40%, var(--neon-soft) 60%, transparent 80%, var(--neon))",
              filter: "blur(2px)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-1 flex items-center justify-center rounded-full bg-[var(--bg-canvas)]">
            <Sparkles
              className="h-7 w-7 text-[var(--neon)]"
              style={{ filter: "drop-shadow(0 0 8px var(--neon-soft))" }}
            />
          </div>
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mb-1 text-[28px] font-semibold tracking-tight text-[var(--text-primary)]"
      >
        Nebula
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8 text-[13px] text-[var(--text-secondary)]"
      >
        A calm place to think, search, and ask.
      </motion.p>

      {/* Big omnibox */}
      <motion.form
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.28, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={(e) => {
          e.preventDefault();
          go(query);
        }}
        className="w-full max-w-2xl"
      >
        <div className="glass-strong group relative flex h-14 items-center gap-3 rounded-2xl px-5 transition-all duration-300 focus-within:neon-ring">
          <Search className="h-5 w-5 text-[var(--text-tertiary)] group-focus-within:text-[var(--neon)] transition-colors" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything or paste a URL…"
            className="flex-1 bg-transparent text-[15px] font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            spellCheck={false}
          />
          <button
            type="submit"
            className="flex h-8 items-center gap-1.5 rounded-full bg-[var(--neon-soft)] px-3 text-[12px] font-semibold text-[var(--neon)] transition-all hover:scale-105"
            style={{ boxShadow: "0 0 12px var(--neon-soft)" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ask Nebula</span>
          </button>
        </div>
      </motion.form>

      {/* Mode chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-4 flex flex-wrap items-center justify-center gap-2"
      >
        {MODES.map((m) => (
          <motion.button
            key={m.id}
            type="button"
            onClick={() => handleAIMode(m.id)}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            className="flex h-8 items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 text-[12px] font-medium text-[var(--text-secondary)] backdrop-blur-md transition-colors hover:border-[var(--neon-soft)] hover:text-[var(--text-primary)]"
          >
            <m.icon className="h-3 w-3" />
            <span>{m.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.55 }}
        className="mt-12 grid w-full max-w-2xl grid-cols-4 gap-3 sm:grid-cols-8"
      >
        {QUICK_LINKS.map((link, i) => (
          <motion.button
            key={link.url}
            type="button"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.04, type: "spring", stiffness: 280, damping: 22 }}
            whileHover={{ y: -2, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!activeTabId) return;
              navigateTab(activeTabId, link.url, link.title);
              addHistory({ url: link.url, title: link.title });
            }}
            className="group flex flex-col items-center gap-2"
            title={link.url}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] backdrop-blur-md transition-all group-hover:border-[var(--neon-soft)] group-hover:shadow-[0_0_20px_var(--neon-soft)]">
              <Favicon url={link.url} size={28} />
            </div>
            <span className="max-w-[60px] truncate text-[11px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
              {link.title}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Recently visited */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          className="mt-10 w-full max-w-2xl"
        >
          <div className="mb-3 flex items-center gap-2 px-1">
            <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Recently visited
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {history.slice(0, 6).map((h) => (
              <motion.button
                key={h.id}
                type="button"
                whileHover={{ y: -2 }}
                onClick={() => activeTabId && navigateTab(activeTabId, h.url, h.title)}
                className="glass flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:border-[var(--neon-soft)]"
              >
                <Favicon url={h.url} size={28} className="bg-white/5" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                    {h.title}
                  </div>
                  <div className="truncate text-[10px] text-[var(--text-tertiary)]">
                    {prettyUrl(h.url)}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
