# Nebula Browser — Build & Download Guide

Nebula Browser is shipped as a desktop app powered by **Electron** wrapping the
**Next.js** web app. The Next.js server runs locally inside the app; the
Electron window loads it from `http://127.0.0.1:3000`.

This guide covers three things:
1. Running the desktop app in dev mode
2. Building a downloadable installer for Windows / macOS / Linux
3. Distributing the built artifact

---

## 0. Prerequisites

| Tool | Version | Why |
| --- | --- | --- |
| Node.js | 20+ | Electron + Next.js runtime |
| Bun | 1.1+ | Fast install + script runner (already used in this repo) |
| Git | any | Cloning the source |

Install Bun if you don't have it:
```bash
curl -fsSL https://bun.sh/install | bash
```

Then clone and install dependencies:
```bash
git clone <your-repo-url> nebula-browser
cd nebula-browser
bun install
```

The install will pull in:
- `electron` — the desktop runtime
- `electron-builder` — cross-platform installer packaging
- `concurrently`, `wait-on`, `cross-env` — dev-mode orchestration helpers

---

## 1. Dev mode (live reload)

Starts the Next.js dev server and opens Electron pointed at it. Hot reload works
for all React/TS/CSS changes.

```bash
bun run electron:dev
```

What this does under the hood:
1. `bun run dev` — Next.js dev server on port 3000
2. `wait-on tcp:3000` — wait until the dev server is accepting connections
3. `cross-env NODE_ENV=development electron electron/main.js` — open Electron
   pointing at `http://localhost:3000`

Both processes are killed with Ctrl+C.

---

## 2. Build an installer for your OS

Each platform has its own command. Run them on the matching OS
(cross-compilation is not supported by electron-builder for native modules).

### Windows (.exe installer + portable)
Run on a Windows machine:
```bash
bun run electron:build:win
```
Produces:
- `release/Nebula-Browser-0.3.0-x64.exe` — NSIS installer (recommended)
- `release/Nebula-Browser-0.3.0-x64.exe` (portable) — single-file portable exe

### macOS (.dmg + .zip)
Run on a Mac:
```bash
bun run electron:build:mac
```
Produces:
- `release/Nebula Browser-0.3.0-arm64.dmg` — for Apple Silicon Macs
- `release/Nebula Browser-0.3.0-x64.dmg` — for Intel Macs
- `release/Nebula Browser-0.3.0-{arch}.zip` — for auto-update / direct download

### Linux (.AppImage + .deb)
Run on Linux (or WSL):
```bash
bun run electron:build:linux
```
Produces:
- `release/Nebula Browser-0.3.0.AppImage` — portable single-file
- `release/nebula-browser_0.3.0_amd64.deb` — Debian/Ubuntu installer

---

## 3. Cross-platform build matrix

| Build host | Can produce | Notes |
| --- | --- | --- |
| Windows | `.exe` (NSIS), `.exe` (portable) | Win-only |
| macOS | `.dmg`, `.zip` (arm64 + x64) | Mac-only |
| Linux | `.AppImage`, `.deb` | Linux-only |

For CI builds that target all three platforms, use **GitHub Actions** with a
matrix strategy (see §5 below).

---

## 4. What the build does

When you run `electron:build`, this sequence executes:

1. **`next build`** — compiles the Next.js app into `.next/standalone/`
   (a self-contained Node server) plus `.next/static/` (assets)
2. **Copy assets into standalone** — the build script moves `public/` and
   `.next/static/` next to the standalone server so they're served correctly
3. **`electron-builder`** — packs the standalone server + Electron shell into
   a platform-specific installer

When the user launches the built app:
1. Electron's main process (`electron/main.js`) starts
2. It spawns the Next.js standalone server as a child process
3. Waits for port 3000 to open (up to 60s)
4. Opens a BrowserWindow pointing at `http://127.0.0.1:3000`
5. On quit, the Next.js child process is killed

---

## 5. CI / automated builds (optional)

Create `.github/workflows/build.yml` to build for all 3 OSes on every tag push:

```yaml
name: Build Desktop Apps

on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run lint
      - run: bun run electron:build:win   # only runs successfully on windows-latest
        if: matrix.os == 'windows-latest'
      - run: bun run electron:build:mac
        if: matrix.os == 'macos-latest'
      - run: bun run electron:build:linux
        if: matrix.os == 'ubuntu-latest'
      - uses: actions/upload-artifact@v4
        with:
          name: nebula-${{ matrix.os }}
          path: release/*
```

After the workflow runs, you'll have downloadable artifacts under each job's
"Artifacts" section — direct links to the `.exe`, `.dmg`, and `.AppImage`.

---

## 6. App icon

The default icon lives at `electron/build-resources/icon.svg`. For production
builds, electron-builder needs `icon.ico` (Windows) and `icon.icns` (macOS).
Generate them from the SVG:

```bash
# Install icon generator (one time)
npm install -g electron-icon-builder

# Generate platform icons
electron-icon-builder --input=electron/build-resources/icon.svg --output=electron/build-resources
```

This produces `electron/build-resources/icons/icon.ico`, `icon.icns`, and
`icon.png` (various sizes). electron-builder picks them up automatically.

---

## 7. Code signing (optional, for distribution)

For real distribution outside your own machine:

- **macOS**: requires an Apple Developer ID + notarization. Add to `package.json`:
  ```json
  "mac": {
    "identity": "Developer ID Application: Your Name (XXXXXXXXXX)",
    "notarize": true
  }
  ```
  Set `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` env vars.

- **Windows**: requires an EV code signing certificate. Set env vars:
  ```
  CSC_LINK=path/to/cert.pfx
  CSC_KEY_PASSWORD=********
  ```

- **Linux**: no signing required for AppImage. `.deb` files can be signed with
  GPG via `linux.deb.afterInstall` scripts.

Without signing, macOS users will see "App cannot be opened because the
developer cannot be verified" — they'll need to right-click → Open the first
time. Windows SmartScreen will show a warning. Linux is fine out of the box.

---

## 8. Auto-update (optional, for later)

Add `electron-updater` for auto-updates:

```bash
bun add electron-updater
```

Then in `electron/main.js`:
```js
const { autoUpdater } = require('electron-updater');
autoUpdater.checkForUpdatesAndNotify();
```

Host the `release/*.yml` files on GitHub Releases and point `publish` config
in `package.json` to your repo.

---

## 9. Troubleshooting

**Build fails with "Cannot find .next/standalone/server.js"**
- Run `bun run build` once first (the standalone build needs to complete before
  electron-builder packs it). The `electron:build:*` scripts do this
  automatically — if it fails, check the `next build` step.

**Blank window on launch**
- Open DevTools (Cmd/Ctrl+Shift+I) and check the console. Most common cause:
  the Next.js server didn't start. Look at the parent terminal for `[next] ...`
  log lines. The server needs to bind to 127.0.0.1:3000 within 60s.

**GLM API errors in the desktop app**
- The `z-ai-web-dev-sdk` needs credentials at build/runtime. In dev, your
  sandbox credentials work. In a packaged app, you may need to bundle a
  `.env` file or have users provide their own API key. The current code uses
  the SDK's auto-discovery (env vars or config file).

**macOS: "App is damaged and can't be opened"**
- This happens with unsigned builds. Run:
  ```bash
  xattr -cr "/Applications/Nebula Browser.app"
  ```

**Windows: SmartScreen warning**
- This is expected for unsigned exes. Users click "More info" → "Run anyway".
- To remove: sign the exe (see §7).

---

## 10. File layout

```
nebula-browser/
├── electron/
│   ├── main.js              ← Electron main process (window + spawn Next.js)
│   ├── preload.js           ← isolated bridge (currently empty)
│   └── build-resources/
│       └── icon.svg         ← source icon (convert to .ico/.icns)
├── src/
│   ├── app/                 ← Next.js App Router
│   │   ├── page.tsx         ← dynamic import of BrowserShell (ssr: false)
│   │   ├── layout.tsx       ← root layout with ThemeProvider
│   │   ├── globals.css      ← Nebula design tokens + .glass utilities
│   │   └── api/ai/chat/     ← streaming GLM endpoint
│   ├── components/browser/  ← all UI components
│   └── lib/                 ← Zustand stores, utilities
├── package.json             ← scripts + electron-builder config
└── BUILD.md                 ← this file
```

---

## 11. Quick commands cheat sheet

| Action | Command |
| --- | --- |
| Web dev (browser only) | `bun run dev` |
| Desktop dev (Electron + Next.js) | `bun run electron:dev` |
| Lint | `bun run lint` |
| Build web app | `bun run build` |
| Build Windows installer | `bun run electron:build:win` |
| Build macOS dmg | `bun run electron:build:mac` |
| Build Linux AppImage | `bun run electron:build:linux` |
| Run packaged build locally | `bun run electron:start` |

---

## What's new in v0.3 (real web browsing + fixes)

### Fixed: `bun: command not found: tee`
The `dev` and `build` scripts no longer use Unix-only `tee` and `cp -r`. They now use cross-platform Node scripts (`scripts/dev.mjs`, `scripts/copy-assets.mjs`) that work on Windows, macOS, and Linux.

### Fixed: Can't drag the window
The top chrome bar (where the traffic lights / tabs live) is now a **drag region** — click and drag any empty space there to move the window. On Windows/Linux, the traffic light dots are now **functional window controls** (close = red, minimize = yellow, maximize/restore = green). On macOS, the native traffic lights are used.

### Fixed: Search doesn't work (now a REAL browser)
In Electron mode, Nebula now uses the `<webview>` tag to actually load web pages. When you type a search query or URL in the omnibox and hit Enter, the page loads **inside the browser** — you can interact with it, click links, scroll, log in, everything. No more "preview card" fallback.

How it works:
- `electron/main.js` enables `webviewTag: true` in the BrowserWindow config
- `WebviewView.tsx` renders a `<webview>` element that loads the URL
- Navigation events (`did-navigate`, `page-title-updated`, `did-start-loading`, `did-stop-loading`) sync back to the tab store so the omnibox, tab title, and loading spinner stay in sync
- Back/Forward/Reload buttons call `webview.goBack()` / `goForward()` / `reload()` directly
- Links with `target="_blank"` open in the user's default system browser via `shell.openExternal()`
- In a regular browser (not Electron), the old PagePreview card is still shown as fallback

### What the Autofill errors mean
Those `[ERROR:CONSOLE] "Request Autofill.enable failed"` messages in the Electron console are **harmless DevTools noise** — they come from Chrome DevTools trying to enable the Autofill protocol, which isn't available in Electron. They don't affect functionality. You can ignore them.

---

## 12. First-time setup checklist

- [ ] `bun install` — install all deps including Electron + builder
- [ ] `bun run lint` — verify code is clean
- [ ] `bun run electron:dev` — verify desktop dev mode opens a window
- [ ] Generate platform icons (`electron-icon-builder`)
- [ ] Pick your OS build command from §2
- [ ] (Optional) Set up code signing per §7
- [ ] (Optional) Set up CI per §5 for automated builds on tag push

That's it. You now have a real downloadable desktop browser.
