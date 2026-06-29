"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, ChevronLeft, Command, Sparkles, Columns2,
  MousePointer2, Bookmark, Download, Search, Settings, LayoutGrid,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSettingsStore } from "@/lib/settings-store";

interface Step {
  icon: React.ReactNode;
  title: string;
  body: string;
  highlight?: string; // CSS selector for the element to highlight (visual cue only)
}

const STEPS: Step[] = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Welcome to Nebula",
    body: "A minimalistic, liquid-glass browser with built-in AI. This quick tour covers everything you need to know in about a minute.",
  },
  {
    icon: <MousePointer2 className="h-5 w-5" />,
    title: "Window controls",
    body: "On Windows & Linux, the three colored dots in the top-left are your window controls: red = close, yellow = minimize, green = maximize/restore. On macOS, the native traffic lights appear instead. To move the window, click and drag any empty space in the top bar.",
  },
  {
    icon: <LayoutGrid className="h-5 w-5" />,
    title: "Tabs — drag, right-click, split",
    body: "Click the + button to open a new tab. Drag tabs left/right to reorder them. Right-click any tab for a full menu: duplicate, close others, close left/right, close all, and split view (pin a tab to the right half of the screen). Background tabs stay alive — audio keeps playing, video doesn't pause.",
  },
  {
    icon: <Search className="h-5 w-5" />,
    title: "Omnibox — search or navigate",
    body: "The address bar in the middle is your omnibox. Type a URL (like youtube.com) to visit a site, or type anything else to search Google. Press ⌘L (Mac) or Ctrl+L (Windows) to focus it instantly. You can also drop a URL onto it from anywhere.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Nebula AI — your browser assistant",
    body: "Click the glowing Nebula button in the top-right to open the AI sidebar. It's powered by GLM-4.6 and works out of the box — no API key needed. Ask it anything, or use the Summarize / Translate / Code modes. It can see the page you're viewing and summarize it for you.",
  },
  {
    icon: <Columns2 className="h-5 w-5" />,
    title: "Split view",
    body: "Open two tabs with URLs, then click the split-view icon (two columns) in the toolbar — or press ⌘\\ (Mac) / Ctrl+\\ (Windows). Two pages show side-by-side. Drag the divider to resize. Click the swap icon to flip sides, or the X to exit.",
  },
  {
    icon: <Bookmark className="h-5 w-5" />,
    title: "Bookmarks & history",
    body: "Click the star icon in the toolbar to bookmark the current page. Bookmarks appear in the bar below the toolbar — drag them to reorder. Press ⌘Y (Mac) or Ctrl+Y (Windows) to open the searchable history panel.",
  },
  {
    icon: <Download className="h-5 w-5" />,
    title: "Downloads",
    body: "When you download a file from any website, the downloads panel opens automatically at the bottom of the screen. You can also drop files from your computer onto the browser to open them, or onto the AI sidebar to attach them to the conversation.",
  },
  {
    icon: <Command className="h-5 w-5" />,
    title: "Shortcuts & command palette",
    body: "Press ⌘K (Mac) or Ctrl+K (Windows) to open the command palette — fuzzy-search across tabs, bookmarks, history, and actions. Other shortcuts: ⌘T new tab, ⌘W close tab, ⌘J toggle AI, ⌘, settings, ⌘1-9 switch to tab N.",
  },
  {
    icon: <Settings className="h-5 w-5" />,
    title: "Make it yours",
    body: "Click the ••• button in the toolbar, then Open settings. Choose your neon accent (cyan, magenta, lime, amber, or mono), glass intensity, theme (light/dark/system), and more. Right-click on any web page for a native context menu (copy image, save as, open link, etc.).",
  },
];

export function OnboardingTutorial() {
  const hasSeenOnboarding = useSettingsStore((s) => s.hasSeenOnboarding);
  const setHasSeenOnboarding = useSettingsStore((s) => s.setHasSeenOnboarding);
  const [step, setStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open the tutorial on first launch (when hasSeenOnboarding is false)
  useEffect(() => {
    if (!hasSeenOnboarding) {
      const t = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [hasSeenOnboarding]);

  const handleClose = () => {
    setIsOpen(false);
    setHasSeenOnboarding(true);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSkip = () => {
    handleClose();
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={handleSkip}
          />

          {/* Tutorial card */}
          <motion.div
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="glass-strong relative w-full max-w-lg overflow-hidden rounded-2xl"
          >
            {/* Progress bar at the top */}
            <div className="absolute left-0 right-0 top-0 h-0.5 bg-white/5">
              <motion.div
                className="h-full"
                style={{ background: "var(--neon)", boxShadow: "0 0 8px var(--neon-soft)" }}
                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            {/* Skip button */}
            <button
              type="button"
              onClick={handleSkip}
              className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]"
              aria-label="Skip tutorial"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="px-7 pb-6 pt-9">
              {/* Icon */}
              <motion.div
                key={`icon-${step}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: "var(--neon-soft)",
                  boxShadow: "0 0 24px var(--neon-soft)",
                }}
              >
                <span className="text-[var(--neon)]">{current.icon}</span>
              </motion.div>

              {/* Title + body */}
              <motion.div
                key={`text-${step}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.3 }}
              >
                <h2 className="mb-2 text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
                  {current.title}
                </h2>
                <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
                  {current.body}
                </p>
              </motion.div>
            </div>

            {/* Footer — step counter + nav buttons */}
            <div className="flex items-center justify-between border-t border-[var(--border-hairline)] px-7 py-4">
              <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
                {step + 1} / {STEPS.length}
              </span>

              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="flex h-8 items-center gap-1 rounded-full px-3 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex h-8 items-center gap-1.5 rounded-full px-4 text-[12px] font-semibold transition-all"
                  style={{
                    background: "var(--neon-soft)",
                    color: "var(--neon)",
                    boxShadow: "0 0 12px var(--neon-soft)",
                  }}
                >
                  {isLast ? "Get started" : "Next"}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 pb-4">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === step ? 20 : 6,
                    background: i === step ? "var(--neon)" : "rgba(255,255,255,0.15)",
                    boxShadow: i === step ? "0 0 6px var(--neon-soft)" : "none",
                  }}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
