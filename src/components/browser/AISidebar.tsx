"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Languages,
  FileText,
  Code,
  MessageSquare,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAIStore, type AIMode } from "@/lib/ai-store";
import { useBrowserStore } from "@/lib/browser-store";
import { AIMessage } from "./AIMessage";
import { classifyFile, formatBytes, isAiAttachable, DOWNLOAD_KIND_LABEL } from "@/lib/files";
import { cn } from "@/lib/utils";

const MODES: { id: AIMode; label: string; icon: typeof Sparkles; hint: string }[] = [
  { id: "chat",      label: "Chat",      icon: MessageSquare, hint: "Free conversation" },
  { id: "summarize", label: "Summarize", icon: FileText,      hint: "TL;DR the current page" },
  { id: "translate", label: "Translate", icon: Languages,     hint: "Auto-detect & translate" },
  { id: "code",      label: "Code",      icon: Code,          hint: "Developer mode" },
];

const SUGGESTED_PROMPTS = [
  "Summarize this page in 5 bullets",
  "What's the main argument here?",
  "Translate this to English",
  "Find 3 similar articles",
];

export function AISidebar() {
  const isOpen = useBrowserStore((s) => s.isAISidebarOpen);
  const toggle = useBrowserStore((s) => s.toggleAISidebar);
  const tabs = useBrowserStore((s) => s.tabs);
  const activeTabId = useBrowserStore((s) => s.activeTabId);

  const conversations = useAIStore((s) => s.conversations);
  const activeConversationId = useAIStore((s) => s.activeConversationId);
  const newConversation = useAIStore((s) => s.newConversation);
  const setActiveConversation = useAIStore((s) => s.setActiveConversation);
  const addMessage = useAIStore((s) => s.addMessage);
  const appendToMessage = useAIStore((s) => s.appendToMessage);
  const finishMessage = useAIStore((s) => s.finishMessage);
  const clearConversation = useAIStore((s) => s.clearConversation);
  const mode = useAIStore((s) => s.mode);
  const setMode = useAIStore((s) => s.setMode);
  const isThinking = useAIStore((s) => s.isThinking);
  const setThinking = useAIStore((s) => s.setThinking);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const conversation = conversations.find((c) => c.id === activeConversationId) ?? conversations[0];

  // Auto-scroll to bottom when new tokens arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [conversation?.messages, isThinking]);

  // Ensure there's an active conversation
  useEffect(() => {
    if (!activeConversationId && conversations.length === 0) {
      newConversation();
    } else if (!activeConversationId && conversations.length > 0) {
      setActiveConversation(conversations[0].id);
    }
  }, [activeConversationId, conversations.length, newConversation, setActiveConversation]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      let convId = activeConversationId;
      if (!convId) {
        convId = newConversation();
      }

      // Add user message
      addMessage(convId, { role: "user", content: trimmed });

      // Add placeholder assistant message (streaming)
      const assistantId = addMessage(convId, {
        role: "assistant",
        content: "",
        streaming: true,
      });

      setThinking(true);
      setInput("");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const messages = [
          ...(conversations.find((c) => c.id === convId)?.messages ?? []).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user" as const, content: trimmed },
        ];

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            mode,
            context: activeTab?.url
              ? { url: activeTab.url, title: activeTab.title }
              : undefined,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const data = line.startsWith("data: ") ? line.slice(6) : null;
            if (!data) continue;
            try {
              const obj = JSON.parse(data);
              if (obj.delta) {
                appendToMessage(convId!, assistantId, obj.delta);
              } else if (obj.error) {
                appendToMessage(convId!, assistantId, `\n\n[error: ${obj.error}]`);
                finishMessage(convId!, assistantId, { error: true });
                return;
              } else if (obj.done) {
                break;
              }
            } catch {
              /* ignore malformed chunk */
            }
          }
        }
        finishMessage(convId!, assistantId);

        // Auto-rename conversation on first user message
        const conv = useAIStore.getState().conversations.find((c) => c.id === convId);
        if (conv && conv.title === "New chat" && conv.messages.length >= 2) {
          useAIStore
            .getState()
            .renameConversation(convId!, trimmed.slice(0, 40) + (trimmed.length > 40 ? "…" : ""));
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        finishMessage(convId!, assistantId, { error: true });
        appendToMessage(
          convId!,
          assistantId,
          "\n\nI had trouble reaching the model. Check your connection and try again."
        );
      } finally {
        setThinking(false);
        abortRef.current = null;
      }
    },
    [
      activeConversationId,
      activeTab,
      addMessage,
      appendToMessage,
      conversations,
      finishMessage,
      isThinking,
      mode,
      newConversation,
      setThinking,
    ]
  );

  const handleStop = () => {
    abortRef.current?.abort();
    setThinking(false);
  };

  /** Drop files directly onto the AI input. Reads text/code files and attaches them as context. */
  const handleFileDrop = useCallback(
    async (files: FileList) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;
      let convId = activeConversationId;
      if (!convId) convId = newConversation();
      setMode("chat");

      for (const file of arr) {
        const kind = classifyFile(file.name, file.type);
        const label = DOWNLOAD_KIND_LABEL[kind];
        const size = formatBytes(file.size);
        const header = `Attached file: ${file.name} (${label}, ${size})`;
        let body = "";
        if (isAiAttachable(kind) && file.size < 256 * 1024) {
          try {
            const text = await file.slice(0, 8192).text();
            body = `\n\n--- Begin file content (first ${text.length} chars) ---\n${text}\n--- End file content ---`;
          } catch {
            body = `\n\n(File could not be read.)`;
          }
        } else {
          body = `\n\n(Binary file — content not attached.)`;
        }
        addMessage(convId, { role: "user", content: `${header}${body}` });
      }

      const hint = arr.length === 1
        ? `I've attached a file called "${arr[0].name}". Please review it and tell me what you'd like to know.`
        : `I've attached ${arr.length} files. Please review them and tell me what you'd like to know.`;
      addMessage(convId, { role: "user", content: hint });
    },
    [activeConversationId, addMessage, newConversation, setMode]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggested = (prompt: string) => {
    setMode(prompt.toLowerCase().includes("summariz") ? "summarize" : "chat");
    sendMessage(prompt);
  };

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.aside
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-20 flex h-full w-[380px] shrink-0 flex-col border-l border-[var(--border-hairline)] bg-[var(--bg-surface)] backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--neon-soft)]"
                style={{ boxShadow: "0 0 12px var(--neon-soft)" }}
              >
                <Sparkles className="h-3 w-3 text-[var(--neon)]" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">Nebula</div>
                <div className="text-[10px] text-[var(--text-tertiary)]">Powered by GLM</div>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => newConversation()}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                title="New chat"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              {conversation && (
                <button
                  type="button"
                  onClick={() => clearConversation(conversation.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                  title="Clear conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => toggle(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                title="Close sidebar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Conversation switcher */}
          {conversations.length > 1 && (
            <div className="flex gap-1 overflow-x-auto px-3 pb-2 scroll-nebula">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveConversation(c.id)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors",
                    c.id === conversation?.id
                      ? "bg-[var(--neon-soft)] text-[var(--neon)]"
                      : "bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {c.title}
                </button>
              ))}
            </div>
          )}

          {/* Mode chips */}
          <div className="flex items-center gap-1 px-3 pb-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                title={m.hint}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium transition-all",
                  mode === m.id
                    ? "bg-[var(--neon-soft)] text-[var(--neon)]"
                    : "text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                )}
              >
                <m.icon className="h-3 w-3" />
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-3 scroll-nebula"
          >
            {conversation && conversation.messages.length > 0 ? (
              <AnimatePresence initial={false}>
                {conversation.messages.map((m, i) => (
                  <AIMessage
                    key={m.id}
                    message={m}
                    isLast={i === conversation.messages.length - 1}
                    onRetry={() => {
                      if (m.role === "assistant") {
                        const prev = conversation.messages[i - 1];
                        if (prev && prev.role === "user") sendMessage(prev.content);
                      }
                    }}
                  />
                ))}
              </AnimatePresence>
            ) : (
              <EmptyState onSuggested={handleSuggested} />
            )}
          </div>

          {/* Input */}
          <div className="border-t border-[var(--border-hairline)] p-3">
            <form
              onSubmit={handleSubmit}
              onDragOver={(e) => {
                if (Array.from(e.dataTransfer.types).includes("Files")) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = "copy";
                }
              }}
              onDrop={(e) => {
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFileDrop(e.dataTransfer.files);
                }
              }}
              className="glass-flat relative flex items-end gap-2 rounded-2xl p-2 transition-all"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder={
                  mode === "summarize"
                    ? "Ask Nebula to summarize the page…"
                    : mode === "translate"
                    ? "Paste text to translate…"
                    : mode === "code"
                    ? "Describe the code you need…"
                    : "Ask anything…"
                }
                rows={1}
                className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] scroll-nebula"
                style={{ minHeight: 32 }}
              />
              {isThinking ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--neon-soft)] text-[var(--neon)]"
                  title="Stop"
                >
                  <span className="h-2.5 w-2.5 rounded-sm bg-[var(--neon)]" />
                </button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={!input.trim()}
                  whileHover={!input.trim() ? undefined : { scale: 1.05 }}
                  whileTap={!input.trim() ? undefined : { scale: 0.95 }}
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                    input.trim()
                      ? "bg-[var(--neon-soft)] text-[var(--neon)]"
                      : "bg-white/5 text-[var(--text-tertiary)]"
                  )}
                  style={input.trim() ? { boxShadow: "0 0 12px var(--neon-soft)" } : undefined}
                  title="Send (Enter)"
                >
                  <Send className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </form>
            <div className="mt-2 flex items-center justify-between px-1">
              <span className="text-[9px] text-[var(--text-tertiary)]">
                Enter to send · Shift+Enter for newline
              </span>
              {activeTab?.url && (
                <span className="flex items-center gap-1 text-[9px] text-[var(--neon)]">
                  <Zap className="h-2.5 w-2.5" />
                  Context: {activeTab.title.slice(0, 18)}
                </span>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function EmptyState({ onSuggested }: { onSuggested: (p: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--neon-soft)]"
        style={{ boxShadow: "0 0 24px var(--neon-soft)" }}
      >
        <Sparkles className="h-6 w-6 text-[var(--neon)]" />
      </motion.div>
      <h3 className="mb-1 text-[15px] font-semibold text-[var(--text-primary)]">
        How can I help?
      </h3>
      <p className="mb-5 max-w-[260px] text-[12px] leading-relaxed text-[var(--text-secondary)]">
        Ask me anything, or pick a quick action below. I can see the page you're viewing.
      </p>
      <div className="flex w-full flex-col gap-1.5">
        {SUGGESTED_PROMPTS.map((p, i) => (
          <motion.button
            key={p}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            whileHover={{ x: 2 }}
            onClick={() => onSuggested(p)}
            className="glass-flat rounded-lg px-3 py-2 text-left text-[12px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            {p}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
