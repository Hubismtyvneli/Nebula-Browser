"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, FileText, Image as ImageIcon, File, CheckCircle2 } from "lucide-react";
import { useBrowserStore } from "@/lib/browser-store";

interface MockDownload {
  id: string;
  name: string;
  size: string;
  type: "pdf" | "image" | "file";
  progress: number;
  completedAt?: number;
}

const MOCK: MockDownload[] = [
  { id: "1", name: "nebula-wallpaper-4k.jpg", size: "4.2 MB", type: "image", progress: 100, completedAt: Date.now() - 1000 * 60 * 5 },
  { id: "2", name: "research-paper.pdf",      size: "1.8 MB", type: "pdf",   progress: 100, completedAt: Date.now() - 1000 * 60 * 32 },
  { id: "3", name: "interview-notes.txt",     size: "12 KB",  type: "file",  progress: 100, completedAt: Date.now() - 1000 * 60 * 90 },
];

const ICONS = {
  pdf: FileText,
  image: ImageIcon,
  file: File,
};

export function DownloadsPanel() {
  const isOpen = useBrowserStore((s) => s.isDownloadsPanelOpen);
  const toggle = useBrowserStore((s) => s.toggleDownloadsPanel);

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
            className="glass-strong fixed bottom-4 left-1/2 z-50 w-[480px] max-w-[92vw] -translate-x-1/2 overflow-hidden rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-3">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-[var(--text-secondary)]" />
                <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Downloads</h2>
              </div>
              <button
                type="button"
                onClick={() => toggle(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto scroll-nebula">
              {MOCK.length === 0 ? (
                <div className="px-5 py-10 text-center text-[12px] text-[var(--text-tertiary)]">
                  No downloads yet.
                </div>
              ) : (
                MOCK.map((d, i) => {
                  const Icon = ICONS[d.type];
                  return (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[var(--text-secondary)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                          {d.name}
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">{d.size}</div>
                      </div>
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--neon)]" />
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        {d.completedAt
                          ? new Date(d.completedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
