"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X, Download, FileText, Image as ImageIcon, File, CheckCircle2,
  Trash2, Play, Pause, RotateCw, Search, ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { useBrowserStore, type DownloadItem, type DownloadKind } from "@/lib/browser-store";
import { DOWNLOAD_KIND_LABEL } from "@/lib/files";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<DownloadKind, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  pdf: FileText,
  text: FileText,
  video: Play,
  audio: Play,
  archive: File,
  code: File,
  file: File,
};

export function DownloadsPanel() {
  const isOpen = useBrowserStore((s) => s.isDownloadsPanelOpen);
  const toggle = useBrowserStore((s) => s.toggleDownloadsPanel);
  const downloads = useBrowserStore((s) => s.downloads);
  const removeDownload = useBrowserStore((s) => s.removeDownload);
  const clearDownloads = useBrowserStore((s) => s.clearDownloads);
  const updateDownload = useBrowserStore((s) => s.updateDownload);
  const newTab = useBrowserStore((s) => s.newTab);
  const navigateTab = useBrowserStore((s) => s.navigateTab);
  const addHistory = useBrowserStore((s) => s.addHistory);

  const [search, setSearch] = useState("");

  const filtered = downloads.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpen = (d: DownloadItem) => {
    if (!d.blobUrl && !d.url) return;
    const tabId = newTab();
    navigateTab(tabId, d.blobUrl ?? d.url, d.name);
    addHistory({ url: d.blobUrl ?? d.url, title: d.name });
    toggle(false);
  };

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
            initial={{ y: 320, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 320, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong fixed bottom-4 left-1/2 z-50 w-[560px] max-w-[92vw] -translate-x-1/2 overflow-hidden rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-3">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-[var(--text-secondary)]" />
                <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Downloads</h2>
                {downloads.length > 0 && (
                  <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
                    {downloads.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {downloads.length > 0 && (
                  <button
                    type="button"
                    onClick={clearDownloads}
                    className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[#FF5F57]"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggle(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Search */}
            {downloads.length > 0 && (
              <div className="border-b border-[var(--border-hairline)] px-4 py-2">
                <div className="flex h-8 items-center gap-2 rounded-lg bg-black/10 px-2.5">
                  <Search className="h-3 w-3 text-[var(--text-tertiary)]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter downloads…"
                    className="flex-1 bg-transparent text-[12px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                  />
                </div>
              </div>
            )}

            <div className="max-h-[340px] overflow-y-auto scroll-nebula">
              <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="mb-3 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                      <Download className="h-5 w-5 text-[var(--text-tertiary)]" />
                    </div>
                  </div>
                  <p className="text-[12px] text-[var(--text-tertiary)]">
                    {downloads.length === 0
                      ? "No downloads yet. Drag a file from your computer onto the browser to start one."
                      : `No matches for "${search}"`}
                  </p>
                </div>
              ) : (
                filtered.map((d, i) => {
                  const Icon = KIND_ICON[d.kind];
                  const isDone = d.status === "completed" && d.progress === 100;
                  return (
                    <motion.div
                      key={d.id}
                      layout
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 40, scale: 0.9, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
                      transition={{ delay: i * 0.04, type: "spring", stiffness: 320, damping: 28 }}
                      draggable
                      onDragStart={(e) => {
                        // Set the blob URL as the drag payload so other apps / the omnibox can accept it
                        e.dataTransfer.effectAllowed = "copyMove";
                        if (d.blobUrl) {
                          e.dataTransfer.setData("text/uri-list", d.blobUrl);
                          e.dataTransfer.setData("text/plain", d.blobUrl);
                        }
                        e.dataTransfer.setData("application/x-nebula-download", d.id);
                      }}
                      whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                      whileTap={{ scale: 0.99 }}
                      className="group relative flex cursor-grab items-center gap-3 rounded-lg px-4 py-2.5 active:cursor-grabbing hover:bg-white/5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[var(--text-secondary)] transition-transform group-hover:scale-105">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                          {d.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                          <span>{d.sizeLabel}</span>
                          <span>·</span>
                          <span>{DOWNLOAD_KIND_LABEL[d.kind]}</span>
                          {d.completedAt && (
                            <>
                              <span>·</span>
                              <span>
                                {new Date(d.completedAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </>
                          )}
                        </div>
                        {!isDone && (
                          <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-white/5">
                            <motion.div
                              className="h-full rounded-full bg-[var(--neon)]"
                              animate={{ width: `${d.progress}%` }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              style={{
                                boxShadow: "0 0 6px var(--neon-soft)",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        {d.status === "in_progress" && (
                          <button
                            type="button"
                            onClick={() => updateDownload(d.id, { status: "paused" })}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                            title="Pause"
                          >
                            <Pause className="h-3 w-3" />
                          </button>
                        )}
                        {d.status === "paused" && (
                          <button
                            type="button"
                            onClick={() => updateDownload(d.id, { status: "in_progress" })}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                            title="Resume"
                          >
                            <Play className="h-3 w-3" />
                          </button>
                        )}
                        {d.status === "failed" && (
                          <button
                            type="button"
                            onClick={() => updateDownload(d.id, { status: "in_progress", progress: 0 })}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                            title="Retry"
                          >
                            <RotateCw className="h-3 w-3" />
                          </button>
                        )}
                        {isDone && (d.blobUrl || d.url) && (
                          <button
                            type="button"
                            onClick={() => handleOpen(d)}
                            className="flex h-7 items-center gap-1 rounded-md px-2 text-[10px] text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                            title="Open"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </button>
                        )}
                        {isDone && d.blobUrl && (
                          <a
                            href={d.blobUrl}
                            download={d.name}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                            title="Save to disk"
                          >
                            <Download className="h-3 w-3" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => removeDownload(d.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[#FF5F57]"
                          title="Remove from list"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      {isDone && (
                        <CheckCircle2
                          className="h-3.5 w-3.5 text-[var(--neon)] opacity-100 group-hover:opacity-0"
                          style={{ filter: "drop-shadow(0 0 6px var(--neon-soft))" }}
                        />
                      )}
                    </motion.div>
                  );
                })
              )}
              </AnimatePresence>
            </div>

            {/* Drop hint */}
            {downloads.length === 0 && (
              <div className="border-t border-[var(--border-hairline)] px-4 py-2 text-center text-[10px] text-[var(--text-tertiary)]">
                Tip: drag files from your desktop anywhere onto Nebula to open or attach them.
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
