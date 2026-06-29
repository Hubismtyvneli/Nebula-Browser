"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Shield, Sparkles, Globe, Lock } from "lucide-react";
import { useBrowserStore } from "@/lib/browser-store";
import { useAIStore } from "@/lib/ai-store";
import { prettyUrl, faviconFor, hostOf } from "@/lib/url";
import { classifyFile } from "@/lib/files";
import { NewTabPage } from "./NewTabPage";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Viewport() {
  const tabs = useBrowserStore((s) => s.tabs);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const isAISidebarOpen = useBrowserStore((s) => s.isAISidebarOpen);
  const toggleAISidebar = useBrowserStore((s) => s.toggleAISidebar);
  const setMode = useAIStore((s) => s.setMode);
  const newConversation = useAIStore((s) => s.newConversation);
  const { theme } = useTheme();

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const url = activeTab?.url ?? "";
  const isBlob = url.startsWith("blob:") || url.startsWith("data:");

  return (
    <div className="relative flex-1 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab?.id ?? "empty"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 overflow-hidden"
        >
          {!activeTab || !activeTab.url ? (
            <NewTabPage />
          ) : isBlob ? (
            <LocalFilePreview
              url={url}
              name={activeTab.title}
              onSummarize={() => {
                setMode("summarize");
                if (!isAISidebarOpen) toggleAISidebar(true);
                if (!useAIStore.getState().activeConversationId) newConversation();
              }}
            />
          ) : (
            <PagePreview
              url={url}
              title={activeTab.title}
              theme={theme ?? "dark"}
              onSummarize={() => {
                setMode("summarize");
                if (!isAISidebarOpen) toggleAISidebar(true);
                if (!useAIStore.getState().activeConversationId) newConversation();
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Renders a locally-dropped file (blob:/data:) inside the viewport.
 * Picks the right renderer by file kind: image, video, audio, pdf, text/code.
 */
function LocalFilePreview({
  url,
  name,
  onSummarize,
}: {
  url: string;
  name: string;
  onSummarize: () => void;
}) {
  const kind = classifyFile(name);
  // Three-state: undefined = loading, string = loaded, null = error
  const [textContent, setTextContent] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (kind !== "text" && kind !== "code") return;
    let cancelled = false;
    fetch(url)
      .then((r) => r.text())
      .then((t) => { if (!cancelled) setTextContent(t); })
      .catch(() => { if (!cancelled) setTextContent(null); });
    return () => { cancelled = true; };
  }, [url, kind]);

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto scroll-nebula p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-3">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-[var(--neon)]" />
            <span className="truncate text-[12px] font-medium text-[var(--text-primary)]">
              {name}
            </span>
            <span className="rounded-full bg-[var(--neon-soft)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--neon)]">
              Local file
            </span>
          </div>
          <button
            type="button"
            onClick={onSummarize}
            className="flex h-7 items-center gap-1.5 rounded-full bg-[var(--neon-soft)] px-3 text-[11px] font-semibold text-[var(--neon)] transition-transform hover:scale-105"
          >
            <Sparkles className="h-3 w-3" />
            Summarize
          </button>
        </div>

        {/* Body */}
        <div className="flex max-h-[70vh] min-h-[260px] items-center justify-center overflow-y-auto scroll-nebula p-6">
          {kind === "image" ? (
            <img
              src={url}
              alt={name}
              className="max-h-[60vh] max-w-full rounded-lg object-contain"
              style={{ boxShadow: "0 0 32px var(--neon-soft)" }}
            />
          ) : kind === "video" ? (
            <video
              src={url}
              controls
              className="max-h-[60vh] max-w-full rounded-lg"
              style={{ boxShadow: "0 0 32px var(--neon-soft)" }}
            />
          ) : kind === "audio" ? (
            <div className="flex w-full max-w-md flex-col items-center gap-4 py-8">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--neon-soft)] text-[32px]"
                style={{ boxShadow: "0 0 24px var(--neon-soft)" }}
              >
                🎵
              </div>
              <audio src={url} controls className="w-full" />
            </div>
          ) : kind === "pdf" ? (
            <iframe
              src={url}
              title={name}
              className="h-[70vh] w-full rounded-lg border border-[var(--border-hairline)] bg-white"
            />
          ) : kind === "text" || kind === "code" ? (
            textContent === undefined ? (
              <div className="text-[12px] text-[var(--text-tertiary)]">Loading…</div>
            ) : textContent === null ? (
              <div className="text-[13px] text-[#FF5F57]">Failed to load file content.</div>
            ) : (
              <pre className="prose-nebula max-h-[60vh] w-full overflow-auto rounded-lg bg-black/30 p-4 font-mono text-[12px] leading-relaxed text-[var(--text-primary)] scroll-nebula">
                <code>{textContent}</code>
              </pre>
            )
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-[36px]">
                📄
              </div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)]">
                {name}
              </div>
              <div className="text-[12px] text-[var(--text-secondary)]">
                Preview not available for this file type.
              </div>
              <a
                href={url}
                download={name}
                className="flex h-9 items-center gap-2 rounded-full bg-[var(--text-primary)] px-4 text-[12px] font-semibold text-[var(--bg-canvas)] transition-transform hover:scale-105"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Save file
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function PagePreview({
  url,
  title,
  theme,
  onSummarize,
}: {
  url: string;
  title: string;
  theme: string;
  onSummarize: () => void;
}) {
  const host = hostOf(url);
  const pretty = prettyUrl(url);
  const letter = faviconFor(url);

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto scroll-nebula p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative w-full max-w-3xl overflow-hidden rounded-3xl"
      >
        {/* Browser chrome mockup */}
        <div className="flex items-center gap-2 border-b border-[var(--border-hairline)] px-5 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="ml-3 flex h-7 flex-1 items-center gap-2 rounded-full bg-black/10 px-3">
            <Lock className="h-3 w-3 text-[var(--text-tertiary)]" />
            <span className="truncate text-[11px] font-medium text-[var(--text-secondary)]">
              {pretty}
            </span>
          </div>
        </div>

        {/* Body — site "card" preview */}
        <div className="flex flex-col items-center gap-6 px-8 py-14 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 240, damping: 20 }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--border-glass)] bg-[var(--bg-canvas)] text-[32px] font-bold shadow-lg"
            style={{ boxShadow: "0 0 32px var(--neon-soft)" }}
          >
            <span className="text-[var(--text-primary)]">{letter}</span>
          </motion.div>

          <div>
            <h2 className="mb-1 text-[22px] font-semibold text-[var(--text-primary)]">
              {host}
            </h2>
            <p className="text-[13px] text-[var(--text-secondary)]">
              {title}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5">
            <Globe className="h-3 w-3 text-[var(--text-tertiary)]" />
            <span className="max-w-[280px] truncate text-[11px] text-[var(--text-tertiary)]">
              {url}
            </span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <p className="max-w-md text-[12px] leading-relaxed text-[var(--text-tertiary)]">
              For security, sites like <strong className="text-[var(--text-secondary)]">{host}</strong> don't allow
              being embedded inside another browser. Open it in a real new tab, or ask Nebula to summarize what
              you'll find there.
            </p>

            <div className="mt-2 flex items-center gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 items-center gap-2 rounded-full bg-[var(--text-primary)] px-4 text-[12px] font-semibold text-[var(--bg-canvas)] transition-transform hover:scale-105"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in new tab
              </a>
              <button
                type="button"
                onClick={onSummarize}
                className="flex h-9 items-center gap-2 rounded-full border border-[var(--neon-soft)] bg-[var(--neon-soft)] px-4 text-[12px] font-semibold text-[var(--neon)] transition-transform hover:scale-105"
                style={{ boxShadow: "0 0 16px var(--neon-soft)" }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Summarize with Nebula
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border-hairline)] px-5 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
            <Shield className="h-3 w-3" />
            <span>Connection is secure · HTTPS</span>
          </div>
          <div className="text-[10px] text-[var(--text-tertiary)]">
            Theme: {theme}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
