# Changelog

All notable changes to Nebula Browser are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned (future)
- Plugin sandbox runtime (window.nebula API)
- Community plugin upload + moderation
- Plugin permissions prompt on install

## [0.4.3] — 2026-06-29

### Added
- **Plugin marketplace** — browse, install, and enable community plugins
  - `supabase/migrations/0003_plugins_and_device_tabs.sql` — plugins table + storage bucket + device_tabs table (with realtime)
  - `src/lib/plugin-store.ts` — Zustand store with 5 built-in plugins:
    1. **Dark Reader** 🌙 — forces dark mode on all websites
    2. **Screenshot Tool** 📸 — capture full-page screenshots
    3. **QR Code Generator** 📱 — generate QR codes for the current URL
    4. **Note Pad** 📝 — quick notes in a sidebar panel
    5. **Clock & Timer** 🕐 — analog clock + pomodoro timer widget
  - `PluginMarketplace.tsx` — browse/search/filter panel with category tabs (Sidebar, Toolbar, Themes, AI, Content, Widgets)
  - Plugin cards show icon, name, type badge, description, rating, install count, version
  - One-click install/enable/disable
  - Plugins persist to localStorage (enabled state remembered)
- **Real-time tab sync** — see open tabs from your other devices
  - `DeviceTabsPanel.tsx` — shows tabs grouped by device (phone/laptop/desktop)
  - Uses Supabase Realtime — updates live when you open a tab on another device
  - Click any remote tab to open it on the current device
  - Refresh button to manually re-fetch
  - Settings panel → "Tabs from other devices" section (requires sign-in)
- Settings panel: 3 new sections — Wallpaper, Plugins, Tabs from other devices

## [0.4.2] — 2026-06-29

### Added
- **Wallpaper marketplace** — Opera GX-style wallpaper system
  - `supabase/migrations/0002_wallpapers.sql` — wallpapers table + storage bucket with RLS
  - `src/lib/wallpaper-store.ts` — Zustand store with 10 built-in preset wallpapers (Nebula, Obsidian, Aurora, Cyberpunk, Ocean, Forest, Inferno, Frost, Mono, Synthwave)
  - `WallpaperMarketplace.tsx` — browse, search, filter by category (gradient/static/animated/live), preview, apply
  - `WallpaperBackground.tsx` — renders active wallpaper behind the New Tab Page (supports gradients, static images, and animated videos)
  - Upload custom wallpapers (PNG/JPG/WebP/MP4/WebM) — uploaded to Supabase Storage, requires sign-in
  - Wallpaper picker button on NTP (bottom-right, Opera GX style) — opens marketplace instantly
  - Settings panel → Wallpaper section shows active wallpaper preview + browse button
  - Wallpapers persist across sessions (localStorage)
  - Categories: Gradient, Static, Animated, Live
  - Rating + download counts displayed on each card
  - Delete custom wallpapers (hover → trash icon)

## [0.4.1] — 2026-06-29

### Added
- **Data sync via Supabase** — bookmarks, settings, and history now sync across devices
  - `supabase/migrations/0001_initial_schema.sql` — SQL migration for bookmarks, settings, and history tables with Row Level Security (users can only access their own data)
  - `src/lib/sync.ts` — sync library with pull/push functions for all data types
  - `src/lib/use-data-sync.ts` — React hook that auto-syncs on sign-in and on local changes
  - On sign-in: pulls remote data → merges into local store (remote wins on conflict)
  - On local change: pushes to remote (debounced 500ms for bookmarks/settings)
  - History entries sync on add
  - Sync runs silently in the background — no UI interruption
  - Works offline — local data preserved when signed out

### Optimized
- New tab lag spike fixed — CSS animation for logo rotation instead of Framer Motion
- Reduced staggered animation delays on New Tab Page (0.6s → 0.2s)
- Tab close animation simplified — clean fade + width collapse (open animation unchanged)

## [0.4.0] — 2026-06-29 (auth only)

### Added
- **Sign-in & data sync via Supabase** — email/password, Google OAuth, GitHub OAuth
  - `AuthModal` component with sign-in / sign-up toggle
  - `auth-store.ts` Zustand store with session listener
  - Supabase client libraries (browser + server)
  - Account section in Settings panel showing user avatar, email, sign-out
  - "Sign in to sync" CTA for unsigned users
  - Session persists across app restarts
- `.env` and `.env.example` for Supabase credentials
- `@supabase/supabase-js` and `@supabase/ssr` dependencies

### Planned for full v0.4.0
- Bookmark + history + settings sync (wired to Supabase tables)
- Wallpaper marketplace UI
- Plugin system + marketplace
- Real-time tab sync across devices

## [0.3.4] — 2026-06-29

### Fixed
- **AI markdown rendering** — replaced custom renderer with `react-markdown` + `remark-gfm`. Tables, lists, code blocks, blockquotes, links, and headings now render properly with Nebula styling. No more raw `| Type | When... |` text.
- **Real website favicons** — new `Favicon` component uses Google's S2 favicon service (`https://www.google.com/s2/favicons?domain=...&sz=64`). Bookmarks, tabs, history, and quick links now show actual site icons instead of letter placeholders. Falls back to letter avatar if the favicon fails to load.

### Added
- `remark-gfm` dependency for GitHub Flavored Markdown (tables, strikethrough, task lists)
- `Favicon` component with error handling and letter fallback
- v0.4.0 design document covering Supabase auth, wallpaper marketplace, and plugin system

## [0.3.2] — 2026-06-29

### Fixed
- **Split-screen divider** — rewrote with Pointer Events + setPointerCapture + requestAnimationFrame throttling. Dragging is now buttery smooth with no mouse escape issues; the divider glows neon while active and the grab handle animates size.
- **Reload icon animation** — the reload button now spins continuously while a page is loading, with a smooth ease-out when loading completes.
- **Tab close animation** — replaced the jarring width-collapse with a multi-stage exit: fade out → scale down → lift up → collapse width with eased timing. Tabs now close gracefully like iOS 26 app cards.
- **Downloads drag animations** — download rows now have iOS-26-style spring physics on hover/tap, smooth slide-out exit animations (fade + slide right + scale), and animated progress bars that ease into their new width.

## [0.3.1] — 2026-06-29

### Test release
This is a test update to verify the auto-update notification system works end-to-end. No new features, no bug fixes — just confirming that:
- Pushing a tag triggers GitHub Actions to build installers
- The update checker detects the new version
- Existing users see the "New update available" popup with these release notes
- The Download button links to the correct GitHub Release page

If you're seeing this popup, the update system works! 🎉

## [0.3.0] — 2026-06-29

### Added
- **Real web browsing** via Electron `<webview>` — actual websites load and are fully interactive
- **Background tabs stay alive** — all webviews mount simultaneously; audio/video/scroll state preserved when switching tabs
- **Split view** — pin a tab to the right half, draggable divider, swap sides (`⌘\` / `⌘⇧\`)
- **Tab context menu** (right-click) — 11 items: open, reload, duplicate, split, copy URL, bookmark, close left/right/others/all, close
- **Native right-click context menus** on web pages — copy image, save as, open link, copy link, search selection, back/forward/reload
- **First-open onboarding tutorial** — 10-step guided tour, auto-shows on first launch, never again after dismissal
- **Downloads panel** — auto-detects webview downloads, live progress bar, open/save actions
- **File drag-and-drop** — drop OS files to open in a tab, or onto AI sidebar to attach as context
- **Local file preview** — images, videos, audio, PDFs, text/code render inline with neon glass card
- **Window dragging** — frameless window with `-webkit-app-region: drag` on the chrome bar
- **Functional traffic lights** (Windows/Linux) — close/minimize/maximize via IPC
- **Command palette** (`⌘K`) — fuzzy search across tabs, bookmarks, history, actions
- **Keyboard shortcuts** — ⌘T, ⌘W, ⌘L, ⌘K, ⌘J, ⌘Y, ⌘,, ⌘\, ⌘⇧\, ⌘1-9
- **Settings panel** — theme, 5 neon accents, 3 glass intensities, 4 NTP wallpapers, reduce motion
- **Pollinations.ai fallback** — AI works even if Z.ai is unreachable (free, no auth)
- **Cross-platform dev scripts** — `scripts/dev.mjs` and `scripts/copy-assets.mjs` replace `tee`/`cp` (Windows-compatible)
- **.z-ai-config.example** template for users who want their own API key

### Fixed
- **Hydration error** — deterministic initial state + `ssr: false` dynamic import for BrowserShell
- **`bun: command not found: tee`** — replaced Unix-only `tee`/`cp -r` with cross-platform Node scripts
- **ERR_ABORTED reload loop** — `frozenUrl` via `useState` prevents React from updating `<webview src>` on internal navigations
- **Window not draggable** — explicit `WebkitAppRegion` inline styles + dedicated drag spacer in ChromeBar
- **Downloads not showing** — IPC now sends to `mainWindow.webContents` (not the webview's renderer)
- **Tabs not shrinking** — changed to `flex-1 min-w-[80px] max-w-[220px]` with `min-w-0` on flex children for truncation
- **Long tab titles** — truncate with ellipsis
- **`.z-ai-config` error** — graceful handling with friendly setup instructions

### Changed
- Package renamed to `nebula-browser`, version bumped to 0.3.0
- AI error handling — 3 specific error types (CONFIG_MISSING, NETWORK_ERROR, AUTH_ERROR) with actionable messages
- Animations — smoother spring physics on tabs, sidebar, and viewport transitions
- Tab strip — `min-w-0` for proper flexbox shrinking
- `electron/main.js` — `frame: false` + `titleBarStyle: "hidden"` on all platforms

## [0.2.0] — 2026-06-29

### Added
- **Tab reordering** via dnd-kit (PointerSensor + KeyboardSensor)
- **Bookmark reordering** via dnd-kit
- **Global file drop zone** — full-screen overlay with browser/AI dual drop targets
- **Omnibox URL drop** — drop a URL onto the address bar to navigate
- **Downloads drag-out** — download rows are draggable, set `text/uri-list` payload
- **Real downloads store** — `addDownload`, `updateDownload`, `removeDownload`, `clearDownloads`
- **Liquid glass design system** — `.glass`, `.glass-strong`, `.glass-flat` utilities with backdrop-blur

### Fixed
- AI streaming — fixed SDK returning `ReadableStream` instead of async iterable
- ESLint — `set-state-in-effect` errors resolved

## [0.1.0] — 2026-06-29

### Added
- Initial release
- Browser shell: ChromeBar, Toolbar, BookmarkBar, Viewport, AISidebar
- Tab strip with spring physics
- Omnibox with smart URL/search detection
- New Tab Page (Grok-style start page) with rotating nebula logo
- AI sidebar with GLM-4.6 streaming chat, 4 modes, markdown rendering
- Settings panel with theme, accents, glass intensity
- Command palette (`⌘K`)
- History panel (searchable, grouped by day)
- Downloads panel (mock)
- Traffic lights (decorative)
- Design spec document
- macOS / iOS 26 / Grok.com aesthetic
- 5 neon accent colors
- Dark / Light / System theme
- Zustand stores with localStorage persistence

---

## Versioning notes

- **Patch** (0.3.x): bug fixes, small tweaks
- **Minor** (0.x.0): new features, backward-compatible
- **Major** (x.0.0): breaking changes

When releasing a new version:
1. Update `version` in `package.json`
2. Add a new section to this CHANGELOG
3. Commit: `git commit -m "release: v0.3.1"`
4. Tag: `git tag v0.3.1`
5. Push: `git push && git push --tags`
6. GitHub Actions auto-builds installers for all 3 OSes
