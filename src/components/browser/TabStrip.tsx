"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Loader2 } from "lucide-react";
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
import { CSS } from "@dnd-kit/utilities";
import { useBrowserStore, type Tab } from "@/lib/browser-store";
import { cn } from "@/lib/utils";

interface TabPillProps {
  tab: Tab;
  active: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}

function TabPill({ tab, active, onClick, onClose }: TabPillProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      layoutId={`tab-${tab.id}`}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.85, y: -4 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        ...(transform
          ? { x: transform.x, y: transform.y, scale: isDragging ? 1.04 : 1 }
          : {}),
      }}
      exit={{ opacity: 0, scale: 0.85, width: 0, marginRight: 0, transition: { duration: 0.18 } }}
      transition={transition ?? { type: "spring", stiffness: 380, damping: 30 }}
      whileHover={isDragging ? undefined : { y: -1 }}
      style={{
        zIndex: isDragging ? 50 : active ? 10 : 1,
        cursor: isDragging ? "grabbing" : "pointer",
      }}
      className={cn(
        "group relative flex h-8 min-w-[120px] max-w-[200px] cursor-pointer items-center gap-2 rounded-lg px-3 no-drag touch-none",
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

      {/* Drag handle = entire tab body. Click still works via onClick. */}
      <div
        {...attributes}
        {...listeners}
        className="flex h-full flex-1 items-center gap-2"
      >
        {/* Favicon / spinner */}
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[11px] font-semibold">
          {tab.status === "loading" ? (
            <Loader2 className="h-3 w-3 animate-spin text-[var(--neon)]" />
          ) : (
            <span className="text-[var(--text-secondary)]">{tab.favicon ?? "✦"}</span>
          )}
        </span>

        {/* Title */}
        <span className="flex-1 truncate text-[12px] font-medium leading-none">
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
}

export function TabStrip() {
  const tabs = useBrowserStore((s) => s.tabs);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
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
    <div className="flex h-11 flex-1 items-center gap-1 overflow-x-auto px-2 scroll-nebula no-drag">
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
