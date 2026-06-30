"use client";

import { useEffect } from "react";
import { usePluginStore } from "@/lib/plugin-store";
import { useBrowserStore } from "@/lib/browser-store";

/**
 * Plugin runtime — watches which plugins are enabled and executes their effects.
 *
 * Built-in plugins:
 * - Dark Reader: injects dark mode CSS into all webviews via Electron IPC
 * - Screenshot: adds a toolbar button that captures the active webview
 * - QR Generator: opens a panel with a QR code for the current URL
 * - Note Pad: opens a notes panel (handled via WidgetLayer)
 * - Clock & Timer: opens a clock widget (handled via WidgetLayer)
 *
 * This component renders nothing — it's a pure side-effect hook.
 */
export function PluginRuntime() {
  const plugins = usePluginStore((s) => s.plugins);
  const togglePlugin = usePluginStore((s) => s.togglePlugin);

  const darkReaderEnabled = plugins.find((p) => p.id === "builtin-dark-reader")?.isEnabled ?? false;
  const screenshotEnabled = plugins.find((p) => p.id === "builtin-screenshot")?.isEnabled ?? false;
  const qrEnabled = plugins.find((p) => p.id === "builtin-qr-generator")?.isEnabled ?? false;

  // Dark Reader — toggle the flag that the Electron main process checks
  useEffect(() => {
    if (typeof window === "undefined" || !window.nebulaDesktop?.setDarkReader) return;
    window.nebulaDesktop.setDarkReader(darkReaderEnabled);
    // Also set the flag in the current webviews
    if (darkReaderEnabled) {
      // Inject into all webview elements
      const webviews = document.querySelectorAll("webview");
      webviews.forEach((wv) => {
        try {
          (wv as any).executeJavaScript?.("window.__nebula_dark_reader = true");
          (wv as any).insertCSS?.(`
            * { background-color: #1a1a1a !important; color: #e0e0e0 !important; border-color: #333 !important; }
            img, video { filter: brightness(0.8) contrast(1.1) !important; }
            a { color: #5eb3ff !important; }
            input, textarea, select { background-color: #2a2a2a !important; color: #e0e0e0 !important; }
          `);
        } catch {}
      });
    } else {
      const webviews = document.querySelectorAll("webview");
      webviews.forEach((wv) => {
        try {
          (wv as any).executeJavaScript?.("window.__nebula_dark_reader = false; location.reload()");
        } catch {}
      });
    }
  }, [darkReaderEnabled]);

  // Screenshot — add a toolbar button when enabled
  useEffect(() => {
    if (!screenshotEnabled) return;

    const handleScreenshot = async () => {
      if (typeof window === "undefined" || !window.nebulaDesktop?.captureScreenshot) return;
      const result = await window.nebulaDesktop.captureScreenshot();
      if (result.error) {
        alert("Screenshot failed: " + result.error);
        return;
      }
      if (result.dataUrl) {
        // Create a download link
        const a = document.createElement("a");
        a.href = result.dataUrl;
        a.download = `nebula-screenshot-${Date.now()}.png`;
        a.click();

        // Also add to downloads store
        const store = useBrowserStore.getState();
        store.addDownload({
          name: `screenshot-${Date.now()}.png`,
          url: result.dataUrl,
          size: 0,
          sizeLabel: "—",
          kind: "image",
          status: "completed",
          progress: 100,
          blobUrl: result.dataUrl,
          completedAt: Date.now(),
        });
        store.toggleDownloadsPanel(true);
      }
    };

    // Add a floating screenshot button if not already present
    if (!document.getElementById("nebula-screenshot-btn")) {
      const btn = document.createElement("button");
      btn.id = "nebula-screenshot-btn";
      btn.innerHTML = "📸";
      btn.title = "Take screenshot";
      btn.style.cssText = `
        position: fixed; bottom: 4px; right: 56px; z-index: 9999;
        width: 36px; height: 36px; border-radius: 50%;
        background: var(--neon-soft); border: 1px solid var(--border-glass);
        cursor: pointer; font-size: 16px; backdrop-filter: blur(12px);
        box-shadow: 0 0 12px var(--neon-soft);
        transition: transform 0.15s;
      `;
      btn.onmouseenter = () => btn.style.transform = "scale(1.1)";
      btn.onmouseleave = () => btn.style.transform = "scale(1)";
      btn.onclick = handleScreenshot;
      document.body.appendChild(btn);
    }

    return () => {
      const existing = document.getElementById("nebula-screenshot-btn");
      if (existing) existing.remove();
    };
  }, [screenshotEnabled]);

  // QR Generator — add a floating button that opens QR code for current URL
  useEffect(() => {
    if (!qrEnabled) return;

    const handleQR = () => {
      const activeTab = useBrowserStore.getState().tabs.find(
        (t) => t.id === useBrowserStore.getState().activeTabId
      );
      if (!activeTab?.url) {
        alert("Open a web page first to generate a QR code.");
        return;
      }
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(activeTab.url)}`;
      window.open(qrUrl, "_blank");
    };

    if (!document.getElementById("nebula-qr-btn")) {
      const btn = document.createElement("button");
      btn.id = "nebula-qr-btn";
      btn.innerHTML = "📱";
      btn.title = "Generate QR code for current page";
      btn.style.cssText = `
        position: fixed; bottom: 4px; right: 100px; z-index: 9999;
        width: 36px; height: 36px; border-radius: 50%;
        background: var(--neon-soft); border: 1px solid var(--border-glass);
        cursor: pointer; font-size: 16px; backdrop-filter: blur(12px);
        box-shadow: 0 0 12px var(--neon-soft);
        transition: transform 0.15s;
      `;
      btn.onmouseenter = () => btn.style.transform = "scale(1.1)";
      btn.onmouseleave = () => btn.style.transform = "scale(1)";
      btn.onclick = handleQR;
      document.body.appendChild(btn);
    }

    return () => {
      const existing = document.getElementById("nebula-qr-btn");
      if (existing) existing.remove();
    };
  }, [qrEnabled]);

  return null; // Pure side-effect component
}
