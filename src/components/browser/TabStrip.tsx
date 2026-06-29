"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Loader2, Columns2 } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useBrowserStore, type Tab } from "@/lib/browser-store";
import { cn } from "@/lib/utils";
import { TabContextMenu } from "./TabContextMenu";
import { Favicon } from "./Favicon";

interface TabPillProps {
  tab: Tab;
  active: boolean;
  isSplit: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}

function TabPill({ tab, active, isSplit, onClick, onClose }: TabPillProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const content = (
    <motion.div
      ref={setNodeRef}
      layout
      layoutId={`tab-${tab.id}`}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.85, y: -8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        ...(transform
          ? { x: transform.x, y: transform.y, scale: isDragging ? 1.05 : 1 }
          : {}),
      }}
      exit={{
        opacity: 0,
        width: 0,
        minWidth: 0,
        padding: 0,
        margin: 0,
        transition: {
          duration: 0.2,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
      transition={transition ?? { type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
      whileHover={isDragging ? undefined : { y: -1, transition: { duration: 0.15 } }}
      whileTap={isDragging ? undefined : { scale: 0.97, transition: { duration: 0.1 } }}
      style={{
        zIndex: isDragging ? 50 : active ? 10 : 1,
        cursor: isDragging ? "grabbing" : "pointer",
        transformOrigin: "center",
      }}
      className={cn(
        "group relative flex h-8 flex-1 min-w-[80px] max-w-[220px] cursor-pointer items-center gap-2 rounded-lg px-3 no-drag touch-none",
        "transition-colors duration-200",
        active
          ? "bg-white/10 text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-white/5",
        isDragging && "shadow-[0_8px_24px_rgba(0,0,0,0.32)] neon-border"
      )}
    >
      {/* Active neon underline */}
      {active && !isDragging && (
        <motion.span
          layoutId="tab-underline"
          className="absolute -bottom-px left-3 right-3 h-px"
          style={{
            background: "var(--neon)",
            boxShadow: "0 0 8px var(--neon-soft)",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      {/* Split indicator — small neon dot in the top-right */}
      {isSplit && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[var(--neon)]"
          style={{ boxShadow: "0 0 6px var(--neon)" }}
          title="Pinned to split view (right side)"
        >
          <Columns2 className="h-2 w-2 text-[var(--bg-canvas)]" />
        </span>
      )}

      {/* Drag handle = entire tab body. Click still works via onClick. */}
      <div
        {...attributes}
        {...listeners}
        className="flex h-full min-w-0 flex-1 items-center gap-2"
      >
        {/* Favicon / spinner */}
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[11px] font-semibold">
          {tab.status === "loading" ? (
            <Loader2 className="h-3 w-3 animate-spin text-[var(--neon)]" />
          ) : tab.url ? (
            <Favicon url={tab.url} size={16} />
          ) : (
            <span className="text-[var(--text-secondary)]">{tab.favicon ?? "✦"}</span>
          )}
        </span>

        {/* Title — truncates with ellipsis when too long */}
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-none">
          {tab.title || "New Tab"}
        </span>
      </div>

      {/* Close button — outside drag listener so clicks don't initiate drag */}
      <button
        type="button"
        onClick={onClose}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[var(--text-tertiary)] opacity-0 transition-all hover:bg-white/10 hover:text-[var(--text-primary)] group-hover:opacity-100"
        aria-label="Close tab"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );

  // Wrap the tab in a context menu. The menu passes through to children,
  // so we use `asChild` on the trigger and pass the content directly.
  return (
    <TabContextMenu tab={tab} isActive={active} isSplit={isSplit}>
      {content}
    </TabContextMenu>
  );
}

export function TabStrip() {
  const tabs = useBrowserStore((s) => s.tabs);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const splitTabId = useBrowserStore((s) => s.splitTabId);
  const activateTab = useBrowserStore((s) => s.activateTab);
  const closeTab = useBrowserStore((s) => s.closeTab);
  const newTab = useBrowserStore((s) => s.newTab);
  const reorderTabs = useBrowserStore((s) => s.reorderTabs);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = tabs.findIndex((t) => t.id === active.id);
    const to = tabs.findIndex((t) => t.id === over.id);
    if (from === -1 || to === -1) return;
    reorderTabs(from, to);
  };

  return (
    <div className="flex h-11 min-w-0 flex-1 items-center gap-1 overflow-x-auto px-2 scroll-nebula no-drag">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tabs.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
          <AnimatePresence initial={false} mode="popLayout">
            {tabs.map((tab) => (
              <TabPill
                key={tab.id}
                tab={tab}
                active={tab.id === activeTabId}
                isSplit={tab.id === splitTabId}
                onClick={() => activateTab(tab.id)}
                onClose={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      <motion.button
        type="button"
        onClick={() => newTab()}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
        aria-label="New tab"
        title="New tab (⌘T)"
      >
        <Plus className="h-4 w-4" />
      </motion.button>
    </div>
  );
}
