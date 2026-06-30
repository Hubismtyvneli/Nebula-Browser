"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import {
  Copy, X, CopyPlus, Columns2, RefreshCw, ArrowLeftToLine, ArrowRightToLine,
  SquareX, Pin, PinOff, ExternalLink, BookmarkPlus,
} from "lucide-react";
import { useBrowserStore, type Tab } from "@/lib/browser-store";
import { cn } from "@/lib/utils";

interface TabContextMenuProps {
  tab: Tab;
  isActive: boolean;
  isSplit: boolean;
  children: React.ReactNode;
  /** Called when any menu action is invoked, before the action runs. */
  onAction?: () => void;
}

export function TabContextMenu({ tab, isActive, isSplit, children, onAction }: TabContextMenuProps) {
  const closeTab = useBrowserStore((s) => s.closeTab);
  const duplicateTab = useBrowserStore((s) => s.duplicateTab);
  const reloadTab = useBrowserStore((s) => s.reloadTab);
  const closeOthers = useBrowserStore((s) => s.closeOthers);
  const closeTabsToTheLeft = useBrowserStore((s) => s.closeTabsToTheLeft);
  const closeTabsToTheRight = useBrowserStore((s) => s.closeTabsToTheRight);
  const closeAllTabs = useBrowserStore((s) => s.closeAllTabs);
  const copyTabUrl = useBrowserStore((s) => s.copyTabUrl);
  const toggleSplit = useBrowserStore((s) => s.toggleSplit);
  const addBookmark = useBrowserStore((s) => s.addBookmark);
  const activateTab = useBrowserStore((s) => s.activateTab);

  const fire = (fn: () => void) => () => {
    onAction?.();
    fn();
  };

  const hasUrl = !!tab.url;
  const canSplit = !isActive && hasUrl;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 glass-strong" align="start">
        <div className="px-2 py-1.5 text-[11px] text-[var(--text-tertiary)] truncate">
          {tab.title || "New Tab"}
        </div>
        <ContextMenuSeparator />

        <ContextMenuItem
          onSelect={fire(() => activateTab(tab.id))}
          className="cursor-pointer text-[12px] text-[var(--text-primary)] focus:bg-white/8 focus:text-[var(--text-primary)]"
        >
          <ExternalLink className="mr-2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
          Open
        </ContextMenuItem>

        <ContextMenuItem
          onSelect={fire(() => reloadTab(tab.id))}
          className="cursor-pointer text-[12px] text-[var(--text-primary)] focus:bg-white/8 focus:text-[var(--text-primary)]"
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
          Reload
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          onSelect={fire(() => duplicateTab(tab.id))}
          className="cursor-pointer text-[12px] text-[var(--text-primary)] focus:bg-white/8 focus:text-[var(--text-primary)]"
        >
          <CopyPlus className="mr-2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
          Duplicate tab
        </ContextMenuItem>

        <ContextMenuItem
          onSelect={fire(() => toggleSplit(tab.id))}
          disabled={!canSplit}
          className={cn(
            "cursor-pointer text-[12px] focus:bg-white/8 focus:text-[var(--text-primary)]",
            canSplit ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] opacity-50 cursor-not-allowed"
          )}
        >
          {isSplit ? (
            <PinOff className="mr-2 h-3.5 w-3.5 text-[var(--neon)]" />
          ) : (
            <Columns2 className="mr-2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
          )}
          {isSplit ? "Exit split view" : "Split view (pin right)"}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {hasUrl && (
          <>
            <ContextMenuItem
              onSelect={fire(() => copyTabUrl(tab.id))}
              className="cursor-pointer text-[12px] text-[var(--text-primary)] focus:bg-white/8 focus:text-[var(--text-primary)]"
            >
              <Copy className="mr-2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
              Copy URL
            </ContextMenuItem>

            <ContextMenuItem
              onSelect={fire(() => addBookmark({ title: tab.title, url: tab.url, favicon: tab.favicon }))}
              className="cursor-pointer text-[12px] text-[var(--text-primary)] focus:bg-white/8 focus:text-[var(--text-primary)]"
            >
              <BookmarkPlus className="mr-2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
              Bookmark this tab
            </ContextMenuItem>

            <ContextMenuSeparator />
          </>
        )}

        <ContextMenuItem
          onSelect={fire(() => closeTabsToTheLeft(tab.id))}
          className="cursor-pointer text-[12px] text-[var(--text-primary)] focus:bg-white/8 focus:text-[var(--text-primary)]"
        >
          <ArrowLeftToLine className="mr-2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
          Close tabs to the left
        </ContextMenuItem>

        <ContextMenuItem
          onSelect={fire(() => closeTabsToTheRight(tab.id))}
          className="cursor-pointer text-[12px] text-[var(--text-primary)] focus:bg-white/8 focus:text-[var(--text-primary)]"
        >
          <ArrowRightToLine className="mr-2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
          Close tabs to the right
        </ContextMenuItem>

        <ContextMenuItem
          onSelect={fire(() => closeOthers(tab.id))}
          className="cursor-pointer text-[12px] text-[var(--text-primary)] focus:bg-white/8 focus:text-[var(--text-primary)]"
        >
          <SquareX className="mr-2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
          Close other tabs
        </ContextMenuItem>

        <ContextMenuItem
          onSelect={fire(() => closeAllTabs())}
          className="cursor-pointer text-[12px] text-[var(--text-primary)] focus:bg-white/8 focus:text-[var(--text-primary)]"
        >
          <X className="mr-2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
          Close all tabs
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          onSelect={fire(() => closeTab(tab.id))}
          className="cursor-pointer text-[12px] text-[#FF5F57] focus:bg-[#FF5F57]/10 focus:text-[#FF5F57]"
        >
          <X className="mr-2 h-3.5 w-3.5" />
          Close this tab
          <ContextMenuShortcut>⌘W</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
