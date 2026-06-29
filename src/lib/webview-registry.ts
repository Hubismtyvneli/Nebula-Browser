/**
 * Registry of active <webview> elements, keyed by tab id.
 * Allows the Toolbar (back/forward/reload buttons) to call methods on the
 * webview that's currently displayed in the Viewport.
 */

export interface WebViewElement extends HTMLElement {
  goBack(): void;
  goForward(): void;
  reload(): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
  loadURL(url: string): void;
  getURL(): string;
  getTitle(): string;
  isLoading(): boolean;
}

const webviews = new Map<string, WebViewElement>();

export function registerWebview(tabId: string, wv: WebViewElement) {
  webviews.set(tabId, wv);
}

export function unregisterWebview(tabId: string) {
  webviews.delete(tabId);
}

export function getWebview(tabId: string): WebViewElement | undefined {
  return webviews.get(tabId);
}

/**
 * Check if we're running inside Electron (vs a regular browser tab).
 * The preload script exposes window.nebulaDesktop when in Electron.
 */
export function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.nebulaDesktop?.isElectron;
}

declare global {
  interface Window {
    nebulaDesktop?: {
      isElectron: boolean;
      platform: string;
      version: string;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      onMaximizeChange: (cb: (isMaximized: boolean) => void) => () => void;
      openExternal: (url: string) => void;
      onDownloadStarted: (cb: (data: { id: string; name: string; url: string; size: number; mimeType: string }) => void) => () => void;
      onDownloadProgress: (cb: (data: { name: string; received: number; total: number; state: string }) => void) => () => void;
      onDownloadDone: (cb: (data: { name: string; state: string; savePath: string }) => void) => () => void;
    };
  }
}
