/**
 * Nebula Browser — Electron main process.
 *
 * Dev mode  (NODE_ENV=development): Electron loads http://localhost:3000
 * Prod mode (NODE_ENV=production):  Electron spawns the Next.js standalone
 *   server as a child process and loads http://127.0.0.1:3000 once ready.
 */

const { app, BrowserWindow, shell, Menu, ipcMain, session, clipboard, webContents } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const net = require("net");

const isDev = process.env.NODE_ENV === "development" || !!process.env.VITE_DEV_SERVER_URL;
const PORT = process.env.PORT || 3000;
const DEV_URL = process.env.VITE_DEV_SERVER_URL || `http://localhost:${PORT}`;

let mainWindow = null;
let nextServerProc = null;

/** Wait for a TCP port to be accepting connections. */
function waitForPort(port, host = "127.0.0.1", timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryConnect = () => {
      const sock = net.connect({ port, host }, () => {
        sock.end();
        resolve();
      });
      sock.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Port ${port} did not open within ${timeoutMs}ms`));
        } else {
          setTimeout(tryConnect, 250);
        }
      });
    };
    tryConnect();
  });
}

/** Spawn the Next.js standalone server in production mode. */
async function startNextServer() {
  const standaloneDir = path.join(__dirname, "..", ".next", "standalone");
  const serverJs = path.join(standaloneDir, "server.js");

  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [serverJs], {
      cwd: standaloneDir,
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: String(PORT),
        HOSTNAME: "127.0.0.1",
        ELECTRON_RUN_AS_NODE: undefined,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stdout.on("data", (d) => process.stdout.write(`[next] ${d}`));
    proc.stderr.on("data", (d) => process.stderr.write(`[next] ${d}`));

    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (code !== 0 && !mainWindow?.isDestroyed()) {
        console.error(`Next.js server exited with code ${code}`);
      }
    });

    nextServerProc = proc;
    resolve(proc);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "Nebula Browser",
    backgroundColor: "#08080A",
    // macOS: hiddenInset gives us traffic lights + a draggable title bar area
    // Windows: hidden (removes native title bar but keeps OS chrome for resize)
    // Linux: frameless (custom title bar)
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    frame: false,
    trafficLightPosition: { x: 12, y: 14 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for webview tag to work
      webviewTag: true, // enable <webview> for real web browsing
      webSecurity: true,
    },
  });

  // Window control IPC handlers (for custom title bar on Windows/Linux)
  ipcMain.on("window-minimize", () => mainWindow?.minimize());
  ipcMain.on("window-maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on("window-close", () => mainWindow?.close());
  ipcMain.handle("window-is-maximized", () => mainWindow?.isMaximized() ?? false);
  // Screenshot plugin — capture the active webview as PNG
  ipcMain.handle("capture-screenshot", async () => {
    try {
      const { webContents: wcModule } = require("electron");
      const allWebContents = wcModule.getAllWebContents();
      const webview = allWebContents.find((wc) => wc.getType() === "webview");
      if (!webview) return { error: "No web page open" };
      const image = await webview.capturePage();
      const dataUrl = image.toDataURL();
      return { dataUrl };
    } catch (err) {
      return { error: String(err) };
    }
  });

  ipcMain.on("open-external", (_event, url) => {
    if (typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
      shell.openExternal(url);
    }
  });

  // Dark Reader plugin — inject/remove dark CSS from all webviews
  ipcMain.on("dark-reader-enable", () => {
    const { webContents } = require("electron");
    webContents.getAllWebContents().forEach((wc) => {
      if (wc.getType() === "webview") {
        try {
          wc.executeJavaScript("window.__nebula_dark_reader = true");
          wc.insertCSS(`
            * { background-color: #1a1a1a !important; color: #e0e0e0 !important; border-color: #333 !important; }
            img, video { filter: brightness(0.8) contrast(1.1) !important; }
            a { color: #5eb3ff !important; }
            input, textarea, select { background-color: #2a2a2a !important; color: #e0e0e0 !important; }
          `);
        } catch {}
      }
    });
  });
  ipcMain.on("dark-reader-disable", () => {
    const { webContents } = require("electron");
    webContents.getAllWebContents().forEach((wc) => {
      if (wc.getType() === "webview") {
        try {
          wc.executeJavaScript("window.__nebula_dark_reader = false; location.reload()");
        } catch {}
      }
    });
  });

  // Notify renderer when maximize state changes (for toggle button UI)
  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("maximize-changed", true);
  });
  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("maximize-changed", false);
  });

  // Open external links (target=_blank) in the user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // Navigate any in-page links to external sites in the default browser
  mainWindow.webContents.on("will-navigate", (e, url) => {
    if (url !== mainWindow.webContents.getURL() && url.startsWith("http")) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDev) {
    await mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    await mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
  }
}

/** Minimal app menu — keeps Cmd+Q, Cmd+W, etc. on macOS. */
function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{
      role: "appMenu",
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { type: "separator" },
        { role: "quit" },
      ],
    }] : []),
    {
      role: "fileMenu",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    {
      role: "editMenu",
    },
    {
      role: "viewMenu",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      role: "windowMenu",
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/**
 * Set up native right-click context menus for all <webview> elements.
 * Listens for web-contents-created events and attaches context-menu handlers
 * that show relevant actions (copy, paste, save image, open link, etc.)
 * based on what was right-clicked.
 */
function setupWebviewContextMenus() {
  const { app: electronApp } = require("electron");
  electronApp.on("web-contents-created", (event, contents) => {
    // Only attach to webview contents (type === "webview")
    if (contents.getType() !== "webview") return;

    // Media playback detection — notifies renderer when audio starts/stops
    contents.on("media-started-playing", () => {
      const target = mainWindow ? mainWindow.webContents : contents;
      target.send("media-playing", true);
    });
    contents.on("media-paused", () => {
      const target = mainWindow ? mainWindow.webContents : contents;
      target.send("media-playing", false);
    });

    // Dark Reader plugin — injects dark mode CSS when enabled
    contents.on("did-finish-load", () => {
      try {
        contents.executeJavaScript("window.__nebula_dark_reader || false").then((enabled) => {
          if (enabled) {
            contents.insertCSS(`
              * { background-color: #1a1a1a !important; color: #e0e0e0 !important; border-color: #333 !important; }
              img, video { filter: brightness(0.8) contrast(1.1) !important; }
              a { color: #5eb3ff !important; }
              input, textarea, select { background-color: #2a2a2a !important; color: #e0e0e0 !important; }
            `);
          }
        }).catch(() => {});
      } catch {}
    });

    contents.on("context-menu", (e, params) => {
      e.preventDefault();
      const menuItems = [];

      // Text selection actions
      if (params.selectionText) {
        menuItems.push({
          label: "Copy",
          role: "copy",
        });
        menuItems.push({
          label: "Search for \"" + params.selectionText.slice(0, 30) + (params.selectionText.length > 30 ? "…" : "") + "\"",
          click: () => {
            const url = "https://www.google.com/search?q=" + encodeURIComponent(params.selectionText);
            shell.openExternal(url);
          },
        });
      }

      // Link actions
      if (params.linkURL) {
        if (menuItems.length > 0) menuItems.push({ type: "separator" });
        menuItems.push({
          label: "Open link in new window",
          click: () => shell.openExternal(params.linkURL),
        });
        menuItems.push({
          label: "Copy link address",
          click: () => clipboard.writeText(params.linkURL),
        });
      }

      // Image actions
      if (params.mediaType === "image") {
        if (menuItems.length > 0) menuItems.push({ type: "separator" });
        menuItems.push({
          label: "Open image in new window",
          click: () => shell.openExternal(params.srcURL),
        });
        menuItems.push({
          label: "Copy image address",
          click: () => clipboard.writeText(params.srcURL),
        });
        menuItems.push({
          label: "Save image as…",
          click: () => {
            // Trigger a download of the image
            contents.downloadURL(params.srcURL);
          },
        });
      }

      // Video/audio actions
      if (params.mediaType === "video" || params.mediaType === "audio") {
        if (menuItems.length > 0) menuItems.push({ type: "separator" });
        menuItems.push({
          label: "Copy media address",
          click: () => clipboard.writeText(params.srcURL),
        });
      }

      // Clipboard paste (if input field)
      if (params.isEditable) {
        if (menuItems.length > 0) menuItems.push({ type: "separator" });
        menuItems.push({ label: "Cut", role: "cut" });
        menuItems.push({ label: "Copy", role: "copy" });
        menuItems.push({ label: "Paste", role: "paste" });
        menuItems.push({ label: "Select All", role: "selectAll" });
      }

      // Navigation actions
      if (menuItems.length > 0) menuItems.push({ type: "separator" });
      menuItems.push({
        label: "Back",
        enabled: contents.navigationHistory ? contents.navigationHistory.canGoBack() : false,
        click: () => contents.goBack(),
      });
      menuItems.push({
        label: "Forward",
        enabled: contents.navigationHistory ? contents.navigationHistory.canGoForward() : false,
        click: () => contents.goForward(),
      });
      menuItems.push({
        label: "Reload",
        click: () => contents.reload(),
      });

      // Developer tools (only in dev mode)
      if (isDev) {
        menuItems.push({ type: "separator" });
        menuItems.push({
          label: "Inspect Element",
          click: () => contents.inspectElement(params.x, params.y),
        });
      }

      if (menuItems.length > 0) {
        Menu.buildFromTemplate(menuItems).popup(contents);
      }
    });
  });
}

/**
 * Set up download handling on the default session.
 * Attached ONCE (not per-webview) and sends all IPC to mainWindow.webContents
 * (the Next.js renderer that hosts the downloads panel UI).
 *
 * Flow: user clicks download link in any webview → Electron shows save dialog
 * (or auto-saves) → will-download fires → we forward start/progress/done to the UI.
 */
function setupDownloadHandler() {
  session.defaultSession.on("will-download", (event, item, webContents) => {
    const filename = item.getFilename();
    const url = item.getURL();
    const totalBytes = item.getTotalBytes();
    const mimeType = item.getMimeType();
    const downloadId = Math.random().toString(36).slice(2, 12);

    // Send to the MAIN window's renderer (where the downloads panel lives),
    // NOT to the webview that triggered the download
    const target = mainWindow ? mainWindow.webContents : webContents;

    target.send("download-started", {
      id: downloadId,
      name: filename,
      url: url,
      size: totalBytes,
      mimeType: mimeType,
    });

    // Track progress
    item.on("updated", (event, state) => {
      const received = item.getReceivedBytes();
      if (state === "interrupted") {
        target.send("download-progress", {
          id: downloadId,
          name: filename,
          received: received,
          total: totalBytes,
          state: "interrupted",
        });
      } else if (state === "progressing") {
        target.send("download-progress", {
          id: downloadId,
          name: filename,
          received: received,
          total: totalBytes,
          state: "progressing",
        });
      }
    });

    item.once("done", (event, state) => {
      target.send("download-done", {
        id: downloadId,
        name: filename,
        state: state, // "completed" or "cancelled"
        savePath: item.getSavePath(),
      });
    });
  });
}

app.whenReady().then(async () => {
  buildMenu();

  // Suppress the harmless "Autofill.enable wasn't found" DevTools console errors
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: false });
  });

  // Set up native context menus for all webviews (right-click on images, links, text, etc.)
  setupWebviewContextMenus();

  // Set up download handling on the default session (attached once, sends to mainWindow)
  setupDownloadHandler();

  if (!isDev) {
    await startNextServer();
    try {
      await waitForPort(PORT, "127.0.0.1", 60000);
    } catch (e) {
      console.error("Failed to start Next.js server:", e);
    }
  } else {
    try {
      await waitForPort(PORT, "127.0.0.1", 60000);
    } catch {
      console.warn(`Dev server not detected on port ${PORT}. Run \`bun run dev\` first.`);
    }
  }

  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextServerProc && !nextServerProc.killed) {
    nextServerProc.kill("SIGTERM");
  }
});

process.on("exit", () => {
  if (nextServerProc && !nextServerProc.killed) {
    nextServerProc.kill("SIGKILL");
  }
});
