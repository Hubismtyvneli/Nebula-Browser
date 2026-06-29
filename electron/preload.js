/**
 * Nebula Browser — Electron preload script.
 * Runs in an isolated context with access to a small, safe subset of Node APIs.
 * Exposes nothing to the web page by default — the Next.js app is fully
 * self-contained and uses fetch() for all backend calls.
 */
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("nebulaDesktop", {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
  // Future hooks can go here (e.g. native file dialogs, system tray, etc.)
});
