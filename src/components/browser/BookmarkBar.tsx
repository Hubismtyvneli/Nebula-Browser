"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
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
import { useBrowserStore, type Bookmark } from "@/lib/browser-store";
import { faviconFor } from "@/lib/url";
import { cn } from "@/lib/utils";

interface SortableBookmarkProps {
  bookmark: Bookmark;
  onOpen: (url: string, title: string) => void;
  onRemove: (id: string) => void;
}

function SortableBookmark({ bookmark, onOpen, onRemove }: SortableBookmarkProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        ...(transform ? { x: transform.x, y: transform.y } : {}),
      }}
      exit={{ opacity: 0, scale: 0.9, width: 0, transition: { duration: 0.16 } }}
      transition={transition ?? { type: "spring", stiffness: 320, damping: 28 }}
      style={{
        zIndex: isDragging ? 50 : 1,
      }}
      className={cn(
        "group relative flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 cursor-pointer touch-none",
        "hover:bg-white/8",
        isDragging && "neon-border bg-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.32)]"
      )}
    >
      {/* Drag handle wraps the visible content; clicks handled separately */}
      <div
        {...attributes}
        {...listeners}
        onClick={() => onOpen(bookmark.url, bookmark.title)}
        className="flex h-full items-center gap-1.5"
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-white/5 text-[10px] font-bold text-[var(--text-secondary)]">
          {bookmark.favicon ?? faviconFor(bookmark.url)}
        </span>
        <span className="max-w-[120px] truncate text-[12px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
          {bookmark.title}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(bookmark.id);
        }}
        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded text-[var(--text-tertiary)] opacity-0 hover:bg-white/10 hover:text-[var(--text-primary)] group-hover:opacity-100"
        aria-label="Remove bookmark"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </motion.div>
  );
}

export function BookmarkBar() {
  const bookmarks = useBrowserStore((s) => s.bookmarks);
  const isOpen = useBrowserStore((s) => s.isBookmarkBarOpen);
  const toggle = useBrowserStore((s) => s.toggleBookmarkBar);
  const removeBookmark = useBrowserStore((s) => s.removeBookmark);
  const reorderBookmarks = useBrowserStore((s) => s.reorderBookmarks);
  const navigateTab = useBrowserStore((s) => s.navigateTab);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const addHistory = useBrowserStore((s) => s.addHistory);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleOpen = (url: string, title: string) => {
    if (!activeTabId) return;
    navigateTab(activeTabId, url, title);
    addHistory({ url, title });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = bookmarks.findIndex((b) => b.id === active.id);
    const to = bookmarks.findIndex((b) => b.id === over.id);
    if (from === -1 || to === -1) return;
    reorderBookmarks(from, to);
  };

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 36, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex items-center gap-1 overflow-hidden border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={toggle}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            title="Hide bookmark bar"
          >
            <Star className="h-3 w-3" />
          </button>

          <div className="flex h-full flex-1 items-center gap-1 overflow-x-auto scroll-nebula">
            {bookmarks.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={bookmarks.map((b) => b.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <AnimatePresence initial={false}>
                    {bookmarks.map((b) => (
                      <SortableBookmark
                        key={b.id}
                        bookmark={b}
                        onOpen={handleOpen}
                        onRemove={removeBookmark}
                      />
                    ))}
                  </AnimatePresence>
                </SortableContext>
              </DndContext>
            ) : (
              <span className="px-2 text-[11px] text-[var(--text-tertiary)]">
                No bookmarks yet — click the star in the toolbar to add one, or drag a URL here.
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
