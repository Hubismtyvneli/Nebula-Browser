import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  isAuthModalOpen: boolean;

  initialize: () => () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithGithub: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isSignedIn: false,
  isAuthModalOpen: false,

  initialize: () => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        user: session?.user ?? null,
        isSignedIn: !!session?.user,
        isLoading: false,
      });
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        isSignedIn: !!session?.user,
        isLoading: false,
      });
    });

    return () => subscription.unsubscribe();
  },

  signInWithEmail: async (email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    set({ isAuthModalOpen: false });
    return { error: null };
  },

  signUpWithEmail: async (email, password, name) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: name ? { name } : undefined },
    });
    if (error) return { error: error.message };
    if (data.user && !data.session) {
      // Email confirmation required
      return { error: "Check your email for a confirmation link to complete sign-up." };
    }
    set({ isAuthModalOpen: false });
    return { error: null };
  },

  signInWithGoogle: async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) return { error: error.message };
    return { error: null };
  },

  signInWithGithub: async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: window.location.origin },
    });
    if (error) return { error: error.message };
    return { error: null };
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, isSignedIn: false });
  },

  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
}));
