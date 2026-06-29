"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, RefreshCw, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { renderMarkdown } from "@/lib/markdown";
import type { ChatMessage } from "@/lib/ai-store";
import { cn } from "@/lib/utils";

interface AIMessageProps {
  message: ChatMessage;
  onRetry?: () => void;
  isLast?: boolean;
}

export function AIMessage({ message, onRetry, isLast }: AIMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard?.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn("group flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-white/8 text-[var(--text-secondary)]"
            : "bg-[var(--neon-soft)] text-[var(--neon)]"
        )}
        style={!isUser ? { boxShadow: "0 0 12px var(--neon-soft)" } : undefined}
      >
        {isUser ? (
          <span className="text-[10px] font-bold">You</span>
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn("flex max-w-[85%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "relative rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
            isUser
              ? "bg-[var(--text-primary)] text-[var(--bg-canvas)]"
              : "glass-flat text-[var(--text-primary)]"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : message.content ? (
            <div
              className="prose-nebula break-words"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
          ) : message.streaming ? (
            <ThinkingDots />
          ) : null}

          {/* Streaming cursor */}
          {message.streaming && message.content && (
            <span
              className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse"
              style={{ background: "var(--neon)" }}
            />
          )}
        </div>

        {/* Footer actions */}
        {!message.streaming && !isUser && message.content && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[10px] text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            {isLast && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[10px] text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            )}
          </div>
        )}

        {/* Error state */}
        {message.error && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#FF5F57]">
            <AlertTriangle className="h-3 w-3" />
            <span>Generation failed — try again</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[var(--neon)]"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
