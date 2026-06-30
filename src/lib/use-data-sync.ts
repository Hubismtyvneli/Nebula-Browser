"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "./auth-store";
import { useBrowserStore } from "./browser-store";
import { useSettingsStore } from "./settings-store";
import {
  pullBookmarks,
  pushAllBookmarks,
  pullSettings,
  pushSettings,
  pullHistory,
  pushHistoryEntry,
} from "./sync";

/**
 * Hook that syncs local browser data (bookmarks, settings, history) with Supabase.
 *
 * Behavior:
 * - On sign-in: pulls remote data → merges into local store (remote wins)
 * - On local changes while signed in: pushes to remote
 * - On sign-out: local data is preserved (browser works offline)
 *
 * Mount this once at the app root (BrowserShell).
 */
export function useDataSync() {
  const user = useAuthStore((s) => s.user);
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const prevUserId = useRef<string | null>(null);

  // Bookmarks store — subscribe to changes
  const bookmarks = useBrowserStore((s) => s.bookmarks);
  const addBookmark = useBrowserStore((s) => s.addBookmark);
  const removeBookmark = useBrowserStore((s) => s.removeBookmark);
  const clearBookmarks = useBrowserStore((s) => s.bookmarks); // for setting all at once

  // History store
  const history = useBrowserStore((s) => s.history);
  const addHistory = useBrowserStore((s) => s.addHistory);

  // Settings store
  const accent = useSettingsStore((s) => s.accent);
  const setAccent = useSettingsStore((s) => s.setAccent);
  const glass = useSettingsStore((s) => s.glass);
  const setGlass = useSettingsStore((s) => s.setGlass);
  const ntpWallpaper = useSettingsStore((s) => s.ntpWallpaper);
  const setNtpWallpaper = useSettingsStore((s) => s.setNtpWallpaper);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const setReduceMotion = useSettingsStore((s) => s.setReduceMotion);

  // Sync flags to prevent feedback loops (pull → set → push → pull ...)
  const isPulling = useRef(false);
  const hasSyncedOnce = useRef(false);

  // === PULL ON SIGN-IN ===
  useEffect(() => {
    if (!isSignedIn || !user) {
      prevUserId.current = null;
      hasSyncedOnce.current = false;
      return;
    }
    if (prevUserId.current === user.id) return; // already synced this user
    prevUserId.current = user.id;
    isPulling.current = true;

    (async () => {
      // Pull bookmarks
      const remoteBookmarks = await pullBookmarks(user.id);
      if (remoteBookmarks.length > 0) {
        // Replace local bookmarks with remote (remote wins on conflict)
        // Clear local then add each remote bookmark
        const store = useBrowserStore.getState();
        // Remove all local bookmarks first
        for (const b of store.bookmarks) {
          store.removeBookmark(b.id);
        }
        // Add remote bookmarks
        for (const b of remoteBookmarks) {
          store.addBookmark({ title: b.title, url: b.url, favicon: b.favicon });
        }
      }

      // Pull settings
      const remoteSettings = await pullSettings(user.id);
      if (remoteSettings) {
        setAccent(remoteSettings.accent);
        setGlass(remoteSettings.glass);
        setNtpWallpaper(remoteSettings.wallpaper as "aurora" | "obsidian" | "paper" | "void");
        setReduceMotion(remoteSettings.reduceMotion);
      }

      // Pull history
      const remoteHistory = await pullHistory(user.id);
      if (remoteHistory.length > 0) {
        // Add remote history entries to local (most recent first)
        for (const h of remoteHistory) {
          useBrowserStore.getState().addHistory({ title: h.title, url: h.url });
        }
      }

      isPulling.current = false;
      hasSyncedOnce.current = true;
    })();
  }, [isSignedIn, user, setAccent, setGlass, setNtpWallpaper, setReduceMotion]);

  // === PUSH BOOKMARKS ON CHANGE ===
  useEffect(() => {
    if (!isSignedIn || !user || isPulling.current || !hasSyncedOnce.current) return;
    // Debounce: push 500ms after last change
    const t = setTimeout(() => {
      pushAllBookmarks(user.id, bookmarks);
    }, 500);
    return () => clearTimeout(t);
  }, [bookmarks, isSignedIn, user]);

  // === PUSH HISTORY ON ADD ===
  useEffect(() => {
    if (!isSignedIn || !user || isPulling.current || !hasSyncedOnce.current) return;
    if (history.length === 0) return;
    // Only push the most recent entry (the one just added)
    const latest = history[0];
    pushHistoryEntry(user.id, latest);
  }, [history, isSignedIn, user]);

  // === PUSH SETTINGS ON CHANGE ===
  useEffect(() => {
    if (!isSignedIn || !user || isPulling.current || !hasSyncedOnce.current) return;
    const t = setTimeout(() => {
      pushSettings(user.id, {
        accent,
        theme: "dark", // theme is handled by next-themes, sync separately later
        glass,
        wallpaper: ntpWallpaper,
        reduceMotion,
      });
    }, 500);
    return () => clearTimeout(t);
  }, [accent, glass, ntpWallpaper, reduceMotion, isSignedIn, user]);
}
