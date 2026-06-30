"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, RefreshCw, AlertTriangle } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
            <div className="prose-nebula break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Tables — render with proper styling
                  table: ({ children }) => (
                    <div className="my-2 overflow-x-auto">
                      <table className="w-full border-collapse text-[12px]">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-[var(--border-hairline)] bg-white/5 px-2 py-1 text-left font-semibold">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-[var(--border-hairline)] px-2 py-1">{children}</td>
                  ),
                  // Code blocks — inline vs block
                  code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { className?: string }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="rounded bg-white/10 px-1 py-0.5 text-[12px]" {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="my-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-[12px]">
                      {children}
                    </pre>
                  ),
                  // Links open in new tab
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--neon)] underline hover:no-underline"
                    >
                      {children}
                    </a>
                  ),
                  // Blockquotes
                  blockquote: ({ children }) => (
                    <blockquote className="my-2 border-l-2 border-[var(--neon-soft)] pl-3 text-[var(--text-secondary)]">
                      {children}
                    </blockquote>
                  ),
                  // Lists
                  ul: ({ children }) => <ul className="my-1 list-disc pl-5">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 list-decimal pl-5">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  // Headings
                  h1: ({ children }) => <h1 className="mb-2 mt-3 text-[16px] font-bold">{children}</h1>,
                  h2: ({ children }) => <h2 className="mb-1.5 mt-2.5 text-[15px] font-bold">{children}</h2>,
                  h3: ({ children }) => <h3 className="mb-1 mt-2 text-[14px] font-semibold">{children}</h3>,
                  // Paragraphs — tight spacing
                  p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
                  // Horizontal rule
                  hr: () => <hr className="my-3 border-[var(--border-hairline)]" />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
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
