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
  ipcMain.on("open-external", (_event, url) => {
    if (typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
      shell.openExternal(url);
    }
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

    // Handle downloads from this webview — forward progress to the renderer
    contents.session.on("will-download", (event, item, webContents) => {
      const filename = item.getFilename();
      const url = item.getURL();
      const totalBytes = item.getTotalBytes();
      const mimeType = item.getMimeType();

      // Notify the renderer that a download started
      webContents.send("download-started", {
        id: Math.random().toString(36).slice(2, 12),
        name: filename,
        url: url,
        size: totalBytes,
        mimeType: mimeType,
      });

      // Track progress
      item.on("updated", (event, state) => {
        if (state === "interrupted") {
          webContents.send("download-progress", {
            name: filename,
            received: item.getReceivedBytes(),
            total: totalBytes,
            state: "interrupted",
          });
        } else if (state === "progressing") {
          webContents.send("download-progress", {
            name: filename,
            received: item.getReceivedBytes(),
            total: totalBytes,
            state: "progressing",
          });
        }
      });

      item.once("done", (event, state) => {
        webContents.send("download-done", {
          name: filename,
          state: state, // "completed" or "cancelled"
          savePath: item.getSavePath(),
        });
      });
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

app.whenReady().then(async () => {
  buildMenu();

  // Suppress the harmless "Autofill.enable wasn't found" DevTools console errors
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: false });
  });

  // Set up native context menus for all webviews (right-click on images, links, text, etc.)
  setupWebviewContextMenus();

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
