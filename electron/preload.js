/**
 * Nebula Browser — Electron preload script.
 * Exposes a safe, minimal API to the renderer for native desktop integration.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nebulaDesktop", {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,

  // Window controls (for custom title bar on Windows/Linux)
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  isMaximized: () => ipcRenderer.invoke("window-is-maximized"),

  // Open a URL in the user's default system browser
  openExternal: (url) => ipcRenderer.send("open-external", url),

  // Listen for maximize/unmaximize state changes from main process
  onMaximizeChange: (callback) => {
    const handler = (_event, isMaximized) => callback(isMaximized);
    ipcRenderer.on("maximize-changed", handler);
    return () => ipcRenderer.removeListener("maximize-changed", handler);
  },

  // Download events — fired when webviews download files
  onDownloadStarted: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("download-started", handler);
    return () => ipcRenderer.removeListener("download-started", handler);
  },
  onDownloadProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("download-progress", handler);
    return () => ipcRenderer.removeListener("download-progress", handler);
  },
  onDownloadDone: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("download-done", handler);
    return () => ipcRenderer.removeListener("download-done", handler);
  },

  // Media playback events — fired when audio/video starts/stops in webviews
  onMediaPlaying: (callback) => {
    const handler = (_event, isPlaying) => callback(isPlaying);
    ipcRenderer.on("media-playing", handler);
    return () => ipcRenderer.removeListener("media-playing", handler);
  },

  // Screenshot capture — returns data URL of the current webview
  captureScreenshot: () => ipcRenderer.invoke("capture-screenshot"),

  // Dark Reader — set flag that gets checked on page load
  setDarkReader: (enabled) => {
    if (enabled) {
      ipcRenderer.send("dark-reader-enable");
    } else {
      ipcRenderer.send("dark-reader-disable");
    }
  },
});
