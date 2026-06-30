"use client";

import { motion } from "framer-motion";
import { Mail, Lock, User, Loader2, Sparkles, ArrowRight, Cloud } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/lib/auth-store";

type Mode = "signin" | "signup";

export function AuthPage() {
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithGithub = useAuthStore((s) => s.signInWithGithub);
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const result = mode === "signin"
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password, name);
    setIsLoading(false);
    if (result.error) setError(result.error);
  };

  if (isSignedIn && user) {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong w-full max-w-md rounded-2xl p-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "var(--neon-soft)" }}>
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <User className="h-6 w-6 text-[var(--neon)]" />
            )}
          </div>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)]">
            {user.user_metadata?.name || user.email?.split("@")[0] || "Welcome!"}
          </h2>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{user.email}</p>
          <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">
            ✓ Bookmarks, history, settings, and tabs are syncing across your devices.
          </p>
          <button
            type="button"
            onClick={signOut}
            className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white/5 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[#FF5F57]"
          >
            Sign out
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="glass-strong w-full max-w-md overflow-hidden rounded-2xl"
      >
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, var(--neon), transparent)", boxShadow: "0 0 12px var(--neon-soft)" }} />
        <div className="px-8 pb-8 pt-10">
          <div className="mb-6 flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "var(--neon-soft)", boxShadow: "0 0 24px var(--neon-soft)" }}
            >
              <Cloud className="h-6 w-6 text-[var(--neon)]" />
            </motion.div>
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
              {mode === "signin" ? "Sign in to sync across all your devices" : "Join Nebula to sync across all your devices"}
            </p>
          </div>

          <div className="mb-5 space-y-2">
            <button type="button" onClick={() => { setOauthLoading("google"); signInWithGoogle(); }} disabled={oauthLoading !== null} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-white/5 text-[13px] font-medium text-[var(--text-primary)] hover:bg-white/8 disabled:opacity-50">
              {oauthLoading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>
            <button type="button" onClick={() => { setOauthLoading("github"); signInWithGithub(); }} disabled={oauthLoading !== null} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-white/5 text-[13px] font-medium text-[var(--text-primary)] hover:bg-white/8 disabled:opacity-50">
              {oauthLoading === "github" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GithubIcon />}
              Continue with GitHub
            </button>
          </div>

          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border-hairline)]" />
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">or</span>
            <div className="h-px flex-1 bg-[var(--border-hairline)]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <InputField icon={<User className="h-3.5 w-3.5" />} type="text" placeholder="Name (optional)" value={name} onChange={setName} />
            )}
            <InputField icon={<Mail className="h-3.5 w-3.5" />} type="email" placeholder="Email" value={email} onChange={setEmail} required />
            <InputField icon={<Lock className="h-3.5 w-3.5" />} type="password" placeholder="Password" value={password} onChange={setPassword} required minLength={6} />

            {error && (
              <div className="rounded-lg bg-[#FF5F57]/10 px-3 py-2 text-[11px] text-[#FF5F57]">{error}</div>
            )}

            <button type="submit" disabled={isLoading} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold disabled:opacity-50" style={{ background: "var(--neon-soft)", color: "var(--neon)", boxShadow: "0 0 12px var(--neon-soft)" }}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>{mode === "signin" ? "Sign in" : "Create account"}<ArrowRight className="h-3.5 w-3.5" /></>)}
            </button>
          </form>

          <div className="mt-5 text-center text-[12px] text-[var(--text-secondary)]">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }} className="font-semibold text-[var(--neon)] hover:underline">
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InputField({ icon, type, placeholder, value, onChange, required, minLength }: { icon: React.ReactNode; type: string; placeholder: string; value: string; onChange: (v: string) => void; required?: boolean; minLength?: number; }) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-white/5 px-3 focus-within:border-[var(--neon-soft)]">
      <span className="text-[var(--text-tertiary)]">{icon}</span>
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} required={required} minLength={minLength} className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]" />
    </div>
  );
}

function GoogleIcon() {
  return (<svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>);
}
function GithubIcon() {
  return (<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>);
}
