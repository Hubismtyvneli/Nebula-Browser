import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Uses the publishable (anon) key — safe to expose to the client.
 * Used for: auth, realtime subscriptions, client-side queries.
 *
 * Gracefully handles missing env vars — returns a dummy client that won't crash
 * the app when Supabase isn't configured. Auth/sync features simply won't work.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars aren't set, return a no-op client that won't crash
  if (!url || !key) {
    console.warn("[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Auth and sync features are disabled. Create a .env file — see .env.example");
    // Return a proxy that silently no-ops all calls
    return new Proxy({}, {
      get: () => () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
    }) as never;
  }

  return createBrowserClient(url, key);
}
