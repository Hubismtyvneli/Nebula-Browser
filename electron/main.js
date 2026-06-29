/**
 * Nebula Browser — Electron main process.
 *
 * Strategy:
 *   - Dev mode  (NODE_ENV=development): Electron loads http://localhost:3000
 *     (the user runs `bun run dev` separately, or we spawn it).
 *   - Prod mode (NODE_ENV=production): Electron spawns the Next.js standalone
 *     server as a child process and loads http://localhost:3000 once it's ready.
 *
 * The Next.js app keeps its API routes (GLM chat, etc.) — Electron just wraps it.
 */

const { app, BrowserWindow, shell, Menu, session } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
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
  // Path to the standalone server built by `next build`
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
    titleBarStyle: "hiddenInset", // macOS-style traffic lights inset
    frame: process.platform === "darwin", // frameless on Win/Linux for custom chrome
    trafficLightPosition: { x: 12, y: 14 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Allow the in-app GLM fetches to use the system keychain if needed
      webSecurity: true,
    },
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

app.whenReady().then(async () => {
  buildMenu();

  if (!isDev) {
    await startNextServer();
    try {
      await waitForPort(PORT, "127.0.0.1", 60000);
    } catch (e) {
      console.error("Failed to start Next.js server:", e);
    }
  } else {
    // In dev, wait for the separately-started dev server
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
