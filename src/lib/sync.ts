import { createClient } from "./supabase/client";
import type { Bookmark, HistoryEntry } from "./browser-store";
import type { AccentName, GlassIntensity } from "./settings-store";

/**
 * Data sync layer — pushes/pulls bookmarks, settings, and history to Supabase.
 * Only runs when the user is signed in.
 *
 * Strategy:
 * - On sign-in: pull remote data → merge into local store (remote wins on conflict)
 * - On local change: push to remote (debounced for settings)
 * - On sign-out: keep local data as-is (user can still use the browser offline)
 */

const supabase = createClient();

// ============================================================================
// BOOKMARKS
// ============================================================================

export async function pullBookmarks(userId: string): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });
  if (error) {
    console.warn("[sync] Failed to pull bookmarks:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    favicon: row.favicon ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
  }));
}

export async function pushBookmark(userId: string, bookmark: Bookmark): Promise<void> {
  const { error } = await supabase.from("bookmarks").upsert({
    id: bookmark.id,
    user_id: userId,
    title: bookmark.title,
    url: bookmark.url,
    favicon: bookmark.favicon ?? null,
    sort_order: 0,
    created_at: new Date(bookmark.createdAt).toISOString(),
  });
  if (error) console.warn("[sync] Failed to push bookmark:", error.message);
}

export async function deleteBookmark(bookmarkId: string): Promise<void> {
  const { error } = await supabase.from("bookmarks").delete().eq("id", bookmarkId);
  if (error) console.warn("[sync] Failed to delete bookmark:", error.message);
}

export async function pushAllBookmarks(userId: string, bookmarks: Bookmark[]): Promise<void> {
  // Delete all remote bookmarks for this user, then insert all local ones
  await supabase.from("bookmarks").delete().eq("user_id", userId);
  if (bookmarks.length === 0) return;
  const rows = bookmarks.map((b, i) => ({
    id: b.id,
    user_id: userId,
    title: b.title,
    url: b.url,
    favicon: b.favicon ?? null,
    sort_order: i,
    created_at: new Date(b.createdAt).toISOString(),
  }));
  const { error } = await supabase.from("bookmarks").insert(rows);
  if (error) console.warn("[sync] Failed to push all bookmarks:", error.message);
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface SyncedSettings {
  accent: AccentName;
  theme: string;
  glass: GlassIntensity;
  wallpaper: string;
  reduceMotion: boolean;
}

export async function pullSettings(userId: string): Promise<SyncedSettings | null> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[sync] Failed to pull settings:", error.message);
    return null;
  }
  if (!data) return null;
  return {
    accent: data.accent as AccentName,
    theme: data.theme,
    glass: data.glass as GlassIntensity,
    wallpaper: data.wallpaper,
    reduceMotion: data.reduce_motion ?? false,
  };
}

export async function pushSettings(userId: string, settings: SyncedSettings): Promise<void> {
  const { error } = await supabase.from("settings").upsert({
    user_id: userId,
    accent: settings.accent,
    theme: settings.theme,
    glass: settings.glass,
    wallpaper: settings.wallpaper,
    reduce_motion: settings.reduceMotion,
    updated_at: new Date().toISOString(),
  });
  if (error) console.warn("[sync] Failed to push settings:", error.message);
}

// ============================================================================
// HISTORY
// ============================================================================

export async function pullHistory(userId: string): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from("history_entries")
    .select("*")
    .eq("user_id", userId)
    .order("visited_at", { ascending: false })
    .limit(200);
  if (error) {
    console.warn("[sync] Failed to pull history:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    visitedAt: new Date(row.visited_at).getTime(),
  }));
}

export async function pushHistoryEntry(userId: string, entry: HistoryEntry): Promise<void> {
  const { error } = await supabase.from("history_entries").upsert({
    id: entry.id,
    user_id: userId,
    title: entry.title,
    url: entry.url,
    visited_at: new Date(entry.visitedAt).toISOString(),
  });
  if (error) console.warn("[sync] Failed to push history entry:", error.message);
}

export async function clearRemoteHistory(userId: string): Promise<void> {
  const { error } = await supabase.from("history_entries").delete().eq("user_id", userId);
  if (error) console.warn("[sync] Failed to clear remote history:", error.message);
}
