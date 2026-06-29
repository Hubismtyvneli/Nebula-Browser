"use client";

import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";

/**
 * The browser shell is intentionally client-only.
 * It uses localStorage (Zustand persist), Math.random (uid), Date.now(),
 * window event listeners, etc. — none of which work correctly during SSR.
 * Rendering a stable loading skeleton on the server avoids all hydration mismatches.
 */
const BrowserShell = dynamic(
  () => import("@/components/browser/BrowserShell").then((m) => m.BrowserShell),
  {
    ssr: false,
    loading: () => <LoadingSkeleton />,
  }
);

export default function Home() {
  return <BrowserShell />;
}

function LoadingSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        background: "#08080A",
        color: "#F5F5F7",
        fontFamily: "system-ui, -apple-system, sans-serif",
        gap: "1.5rem",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "4rem",
          height: "4rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "9999px",
            background:
              "conic-gradient(from 0deg, #00E5FF, transparent 40%, rgba(0,229,255,0.18) 60%, transparent 80%, #00E5FF)",
            filter: "blur(2px)",
            animation: "nebula-spin 12s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "4px",
            borderRadius: "9999px",
            background: "#08080A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles
            size={28}
            color="#00E5FF"
            style={{ filter: "drop-shadow(0 0 8px rgba(0,229,255,0.45))" }}
          />
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          Nebula
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "rgba(245,245,247,0.5)",
            marginTop: "0.25rem",
          }}
        >
          Loading your browser…
        </div>
      </div>
      <style>{`
        @keyframes nebula-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
