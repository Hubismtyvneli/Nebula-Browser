"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, Image as ImageIcon, File, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBrowserStore, type DownloadItem } from "@/lib/browser-store";
import { useAIStore } from "@/lib/ai-store";
import {
  classifyFile,
  formatBytes,
  isPreviewable,
  isAiAttachable,
  DOWNLOAD_KIND_LABEL,
} from "@/lib/files";

interface ParsedFile {
  file: File;
  blobUrl: string;
  textPreview?: string;
}

const DROP_TARGET_AI = "ai";
const DROP_TARGET_BROWSER = "browser";

type DropTarget = typeof DROP_TARGET_AI | typeof DROP_TARGET_BROWSER | null;

export function FileDropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const dragCounter = useRef(0);

  const newTab = useBrowserStore((s) => s.newTab);
  const navigateTab = useBrowserStore((s) => s.navigateTab);
  const addDownload = useBrowserStore((s) => s.addDownload);
  const toggleAISidebar = useBrowserStore((s) => s.toggleAISidebar);
  const isAISidebarOpen = useBrowserStore((s) => s.isAISidebarOpen);
  const addHistory = useBrowserStore((s) => s.addHistory);
  const toggleDownloadsPanel = useBrowserStore((s) => s.toggleDownloadsPanel);

  const setMode = useAIStore((s) => s.setMode);
  const newConversation = useAIStore((s) => s.newConversation);
  const activeConversationId = useAIStore((s) => s.activeConversationId);
  const addMessage = useAIStore((s) => s.addMessage);

  // Track drag enter/leave on the window
  useEffect(() => {
    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes("Files");

    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragCounter.current++;
      setIsDragging(true);
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) {
        setIsDragging(false);
        setDropTarget(null);
      }
    };
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) {
        // Show a "copy" cursor
        e.dataTransfer.dropEffect = "copy";
      }
    };
    const onDrop = async (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length === 0) {
        setDropTarget(null);
        return;
      }

      const target = dropTarget;
      setDropTarget(null);

      // Parse files (create blob URLs, read text previews for attachable kinds)
      const parsed: ParsedFile[] = await Promise.all(
        files.map(async (file) => {
          const blobUrl = URL.createObjectURL(file);
          const kind = classifyFile(file.name, file.type);
          let textPreview: string | undefined;
          if (isAiAttachable(kind) && file.size < 256 * 1024) {
            try {
              textPreview = await file.slice(0, 8192).text();
            } catch {
              /* ignore read errors */
            }
          }
          return { file, blobUrl, textPreview };
        })
      );

      if (target === DROP_TARGET_AI) {
        // Attach each file as a system context message in the current (or new) conversation
        let convId = activeConversationId;
        if (!convId) convId = newConversation();
        if (!isAISidebarOpen) toggleAISidebar(true);
        setMode("chat");

        for (const p of parsed) {
          const kind = classifyFile(p.file.name, p.file.type);
          const label = DOWNLOAD_KIND_LABEL[kind];
          const size = formatBytes(p.file.size);
          const header = `Attached file: ${p.file.name} (${label}, ${size})`;
          const body = p.textPreview
            ? `\n\n--- Begin file content (first ${p.textPreview.length} chars) ---\n${p.textPreview}\n--- End file content ---`
            : isPreviewable(kind) && kind === "image"
            ? `\n\n(Image preview available at ${p.blobUrl})`
            : `\n\n(Binary file — content not attached.)`;
          addMessage(convId, {
            role: "user",
            content: `${header}${body}`,
          });
        }

        // Auto-prompt the model
        const userHint = parsed.length === 1
          ? `I've attached a file called "${parsed[0].file.name}". Please review it and tell me what you'd like to know.`
          : `I've attached ${parsed.length} files. Please review them and tell me what you'd like to know.`;
        addMessage(convId, { role: "user", content: userHint });
      } else {
        // Open each file in its own tab + register as a download
        for (const p of parsed) {
          const kind = classifyFile(p.file.name, p.file.type);
          const download: Omit<DownloadItem, "id" | "startedAt"> = {
            name: p.file.name,
            url: p.blobUrl,
            size: p.file.size,
            sizeLabel: formatBytes(p.file.size),
            kind,
            status: "completed",
            progress: 100,
            completedAt: Date.now(),
            blobUrl: p.blobUrl,
            textPreview: p.textPreview,
          };
          addDownload(download);

          // Open the file in a new tab. Images/PDFs/text render natively in the browser.
          const tabId = newTab();
          const title = p.file.name;
          navigateTab(tabId, p.blobUrl, title);
          addHistory({ url: p.blobUrl, title });
        }
        toggleDownloadsPanel(true);
      }

      // Keep references so they don't get GC'd before user interacts
      setParsedFiles((prev) => [...prev, ...parsed]);
    };

    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [
    dropTarget,
    activeConversationId,
    isAISidebarOpen,
    newTab,
    navigateTab,
    addDownload,
    addHistory,
    toggleAISidebar,
    toggleDownloadsPanel,
    setMode,
    newConversation,
    addMessage,
  ]);

  // Track mouse position to determine drop target (AI sidebar vs browser body)
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: DragEvent) => {
      if (!e.view) return;
      const w = e.view.innerWidth;
      const x = e.clientX;
      // Right 380px is the AI sidebar zone
      const inAiZone = x > w - 380 && isAISidebarOpen;
      setDropTarget(inAiZone ? DROP_TARGET_AI : DROP_TARGET_BROWSER);
    };
    window.addEventListener("dragover", onMove);
    return () => window.removeEventListener("dragover", onMove);
  }, [isDragging, isAISidebarOpen]);

  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-6"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

          {/* Full-screen container showing both drop zones */}
          <div className="relative flex h-full w-full gap-4">
            {/* Browser body drop target */}
            <motion.div
              animate={{
                scale: dropTarget === DROP_TARGET_BROWSER ? 1.0 : 0.98,
                opacity: dropTarget === DROP_TARGET_BROWSER ? 1 : 0.6,
              }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className={cn_dropzone(
                dropTarget === DROP_TARGET_BROWSER,
                "flex flex-1 flex-col items-center justify-center rounded-3xl"
              )}
            >
              <motion.div
                animate={{ y: dropTarget === DROP_TARGET_BROWSER ? 0 : [0, -8, 0] }}
                transition={{ y: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }}
                className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl"
                style={{
                  background: dropTarget === DROP_TARGET_BROWSER
                    ? "var(--neon-soft)"
                    : "rgba(255,255,255,0.05)",
                  boxShadow: dropTarget === DROP_TARGET_BROWSER
                    ? "0 0 40px var(--neon-soft)"
                    : "none",
                }}
              >
                {dropTarget === DROP_TARGET_BROWSER ? (
                  <Upload className="h-8 w-8 text-[var(--neon)]" />
                ) : (
                  <File className="h-8 w-8 text-[var(--text-secondary)]" />
                )}
              </motion.div>
              <div className="text-[18px] font-semibold text-[var(--text-primary)]">
                {dropTarget === DROP_TARGET_BROWSER ? "Drop to open" : "Open in browser"}
              </div>
              <div className="mt-1 text-[12px] text-[var(--text-secondary)]">
                Images, PDFs, text & code files open in a new tab
              </div>
            </motion.div>

            {/* AI sidebar drop target — only shows when sidebar is open */}
            {isAISidebarOpen && (
              <motion.div
                animate={{
                  scale: dropTarget === DROP_TARGET_AI ? 1.0 : 0.98,
                  opacity: dropTarget === DROP_TARGET_AI ? 1 : 0.6,
                }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className={cn_dropzone(
                  dropTarget === DROP_TARGET_AI,
                  "flex w-[380px] shrink-0 flex-col items-center justify-center rounded-3xl"
                )}
              >
                <motion.div
                  animate={{ y: dropTarget === DROP_TARGET_AI ? 0 : [0, -8, 0] }}
                  transition={{ y: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }}
                  className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl"
                  style={{
                    background: dropTarget === DROP_TARGET_AI
                      ? "var(--neon-soft)"
                      : "rgba(255,255,255,0.05)",
                    boxShadow: dropTarget === DROP_TARGET_AI
                      ? "0 0 40px var(--neon-soft)"
                      : "none",
                  }}
                >
                  <Sparkles className="h-8 w-8 text-[var(--neon)]" />
                </motion.div>
                <div className="text-[16px] font-semibold text-[var(--text-primary)]">
                  {dropTarget === DROP_TARGET_AI ? "Drop to attach to Nebula" : "Attach to AI"}
                </div>
                <div className="mt-1 max-w-[280px] text-center text-[11px] text-[var(--text-secondary)]">
                  Text & code files are read and sent to GLM as context
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function cn_dropzone(active: boolean, ...rest: string[]): string {
  const base = [
    "border-2 border-dashed transition-colors",
    active
      ? "border-[var(--neon)] bg-[var(--neon-soft)] neon-ring"
      : "border-white/15 bg-black/30",
    ...rest,
  ];
  return base.join(" ");
}
