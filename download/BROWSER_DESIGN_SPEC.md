# Nebula Browser — Design Specification

> A web-based browser interface inspired by macOS Safari, Grok.com, and iOS 26 Liquid Glass.
> Built with Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion, and the GLM AI model.

---

## 1. Design Language

### 1.1 Aesthetic Pillars
- **Minimalistic** — vast whitespace, restrained ornament, content-first.
- **Monochrome Core** — `#0A0A0B` (obsidian) and `#FAFAFA` (paper) as the chromatic anchors.
- **Slight Neon** — single accent hue (electric cyan `#00E5FF` or magenta `#FF00E5`) used surgically for active states, glows, and AI surfaces only.
- **Liquid Glass** — translucent layered surfaces with `backdrop-blur`, inner highlights, and subtle outer glow. Reusable utility class `.glass`.
- **macOS / iOS 26 DNA** — floating traffic-light controls, pill-shaped tab strips, spring-physics modals, depth via shadows.
- **Grok.com influence** — centered conversational start page, generous typography, AI-first empty states.

### 1.2 Color Tokens (CSS variables)
```css
--bg-canvas:        #0A0A0B;  /* deep obsidian — dark mode canvas */
--bg-surface:       rgba(20, 20, 22, 0.72);  /* glass surface */
--bg-surface-elev:  rgba(28, 28, 30, 0.78);  /* elevated glass */
--border-hairline:  rgba(255, 255, 255, 0.08);
--border-glass:     rgba(255, 255, 255, 0.14);
--text-primary:     #F5F5F7;
--text-secondary:   rgba(245, 245, 247, 0.62);
--text-tertiary:    rgba(245, 245, 247, 0.38);
--accent-neon:      #00E5FF;  /* cyan neon */
--accent-neon-soft: rgba(0, 229, 255, 0.18);
--accent-glow:      0 0 24px rgba(0, 229, 255, 0.45);
```

Light mode swaps to `#FAFAFA` canvas with `#0A0A0B` text and `rgba(0,0,0,0.06)` hairlines.

### 1.3 Typography
- **Display / UI**: Inter (system fallback to `-apple-system, SF Pro Display`)
- **Mono (URLs, code)**: JetBrains Mono
- **Type scale**: 11 / 13 / 15 / 17 / 22 / 28 / 40 (macOS-like, tight leading)

### 1.4 Motion
- All transitions: `cubic-bezier(0.22, 1, 0.36, 1)` (Apple-like ease-out)
- Tab open/close: spring `{ stiffness: 320, damping: 30 }`
- Panel slide-ins: 280ms ease-out, 16px translate
- AI thinking indicator: pulsing neon dots
- Respect `prefers-reduced-motion`

---

## 2. Information Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  TRAFFIC LIGHTS    [ Tab 1 ] [ Tab 2 ] [ + ]        [ ⌘ ] [ ◐ ] │  ← Chrome bar
├──────────────────────────────────────────────────────────────────┤
│  ◀ ▶ ↻  │  🔒 example.com / search query        ⋯  ✨ AI  ⬇   │  ← Toolbar
├──────────────────────────────────────────────────────────────────┤
│  ☆ ★ ★ ★ ★ ★ ★ ★ ★                                              │  ← Bookmark bar
├──────────────────────────────────────────────────────────────────┤
│                                                  ┌──────────────┐ │
│                                                  │  AI SIDEBAR  │ │
│              VIEWPORT (web content)              │  GLM chat     │ │
│                                                  │  Suggestions  │ │
│                                                  │  History      │ │
│                                                  └──────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 2.1 Top Chrome Bar (height 44px)
- Left: macOS traffic lights (red / amber / green) — purely decorative, draggable feel
- Center: Horizontal scrollable tab strip — each tab is a glass pill with favicon, title, close button on hover
- Right: Window control cluster — command palette trigger (`⌘K`), theme toggle (`◐`)

### 2.2 Toolbar (height 52px)
- Left cluster: Back / Forward / Reload (icon buttons with neon hover)
- Center: URL / Omnibox — pill-shaped, glass surface, neon focus ring when active, smart search detection
- Right cluster: Bookmark-this-page, Share, AI toggle (✨ — pulses when AI is responding), Downloads

### 2.3 Bookmark Bar (height 36px, collapsible)
- Horizontal list of pinned sites, each a glass chip with favicon + label
- Right-click → context menu (Edit / Delete)
- Drag to reorder (dnd-kit)

### 2.4 Viewport
- Renders the active tab's content
- New Tab Page (NTP) is the default content — see §3

### 2.5 AI Sidebar (right, 380px, toggleable)
- Toggle button in toolbar (✨)
- Chat surface with GLM-4.6
- Context-aware: auto-injects current URL + page title as system context
- Suggested prompts chips ("Summarize this page", "Find similar", "Translate")
- Streaming responses (SSE)
- Persistent across tab switches

---

## 3. New Tab Page (Start Page)

Centered, Grok.com-inspired layout:

```
                  ╭───────────╮
                  │    ✦      │   ← animated nebula logo (SVG, neon glow)
                  ╰───────────╯

                  Nebula Browser

            ┌─────────────────────────────────┐
            │  Ask anything or paste a URL…    │  ← oversized omnibox
            │                          [ ✨ ]  │
            └─────────────────────────────────┘

         [ Summarize ] [ Research ] [ Code ] [ Image ]   ← mode chips

    ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
    │  G  │ │  Yt  │ │  X  │ │ GH  │ │  N  │ │  +  │   ← quick links grid
    └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘

                ── Recently Visited ──
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │  page 1  │ │  page 2  │ │  page 3  │
    └──────────┘ └──────────┘ └──────────┘
```

---

## 4. Feature Inventory

### 4.1 Core Browser
- [x] Multi-tab (open / close / reorder / duplicate)
- [x] URL omnibox with smart search (search engine fallback)
- [x] Back / Forward / Reload history per tab
- [x] Bookmarks (add / edit / delete / drag-reorder)
- [x] Browsing history (searchable, grouped by day)
- [x] Downloads panel (mock — captures link clicks)
- [x] Find-in-page (⌘F) — basic
- [x] Reader mode toggle (high-contrast B/W view)

### 4.2 AI Features (GLM via z-ai-web-dev-sdk)
- [x] Sidebar chat with streaming responses
- [x] Page context injection (URL + title + meta description)
- [x] Suggested action chips
- [x] Quick AI actions: Summarize page / Translate / Explain code
- [x] Conversation history persisted to local state (Zustand)
- [x] Markdown rendering (code blocks with syntax highlight)
- [x] Copy-to-clipboard on message hover

### 4.3 Personalization
- [x] Dark / Light / System theme
- [x] Neon accent picker (cyan / magenta / lime / off)
- [x] Liquid glass intensity slider (off / subtle / strong)
- [x] Reduce motion toggle
- [x] Tab bar position (top / bottom — mobile-like)
- [x] Custom wallpaper for NTP (gradient presets)

### 4.4 Power-User
- [x] Command palette (⌘K) — fuzzy search across tabs / bookmarks / history / actions
- [x] Keyboard shortcuts overlay (⌘/)
- [x] Split view — two tabs side-by-side in viewport

### 4.5 Drag & Drop (added v0.2)
- [x] **Tab reordering** — drag any tab pill left/right to reorder (dnd-kit + PointerSensor with 5px activation distance; keyboard-accessible via sortableKeyboardCoordinates)
- [x] **Bookmark reordering** — drag bookmark chips to reorder (same dnd-kit setup, 4px activation distance)
- [x] **OS file drop → open** — drag any file from the desktop onto the browser body; opens it in a new tab with a kind-aware renderer (image / video / audio / pdf / text / code)
- [x] **OS file drop → attach to AI** — drag a file onto the AI sidebar; text/code files (<256KB) are read and embedded into the conversation as a user message with the first 8KB of content
- [x] **Visual drop zone overlay** — when dragging OS files, a full-screen glass overlay appears with two neon-outlined zones (browser / AI) that highlight as the cursor enters them; uses `dragCounter` ref to handle enter/leave correctly
- [x] **Omnibox URL drop** — drop any URL (or `text/uri-list`) onto the omnibox to navigate; auto-submits if it parses as a URL
- [x] **Downloads drag-out** — each download row is `draggable`; dragging it sets `text/uri-list` and `text/plain` payloads (the blob URL) so it can be dropped onto the omnibox, the AI sidebar, or external apps
- [x] **Real downloads store** — `addDownload`, `updateDownload`, `removeDownload`, `clearDownloads` with progress, status (completed / in_progress / paused / failed), file kind, blob URL, text preview
- [x] **Local file preview** — dropped files render with type-specific viewers (img / video / audio / iframe-PDF / pre-formatted code) inside a glass card with a Summarize button



---

## 5. Component Architecture

```
src/app/page.tsx                     ← single route, mounts <BrowserShell/>
src/components/browser/
  BrowserShell.tsx                   ← root layout, orchestrates panels
  ChromeBar.tsx                      ← traffic lights + tab strip
  TabStrip.tsx                       ← horizontal tab list (dnd-kit)
  Tab.tsx                            ← single tab pill
  Toolbar.tsx                        ← nav controls + omnibox + actions
  Omnibox.tsx                        ← URL/search input with neon focus
  BookmarkBar.tsx                    ← pinned sites chips
  Viewport.tsx                       ← content host (renders NTP or page preview)
  NewTabPage.tsx                     ← Grok-style start page
  AISidebar.tsx                      ← right-rail chat panel
  AIMessage.tsx                      ← single chat message (markdown)
  AIInput.tsx                        ← composer with mode chips
  SettingsPanel.tsx                  ← personalization drawer
  CommandPalette.tsx                 ← ⌘K fuzzy palette
  HistoryPanel.tsx                   ← searchable history list
  DownloadsPanel.tsx                 ← download manager drawer
  TrafficLights.tsx                  ← macOS window controls (decorative)

src/lib/
  browser-store.ts                   ← Zustand: tabs, active tab, bookmarks, history
  ai-store.ts                        ← Zustand: conversations, messages, mode
  settings-store.ts                  ← Zustand: theme, accent, glass intensity
  url.ts                             ← smart URL/search detection
  neon.ts                            ← accent color helpers

src/app/api/
  ai/chat/route.ts                   ← POST — streaming GLM chat (SSE)
  ai/summarize/route.ts              ← POST — page summarization
```

---

## 6. Liquid Glass Recipe

The signature `.glass` utility (defined in `globals.css`):

```css
.glass {
  background: var(--bg-surface);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--border-glass);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),   /* top highlight */
    inset 0 -1px 0 rgba(0, 0, 0, 0.20),         /* bottom shadow */
    0 8px 32px rgba(0, 0, 0, 0.28);             /* ambient drop */
}

.glass-strong {
  background: var(--bg-surface-elev);
  backdrop-filter: blur(40px) saturate(200%);
}

.glass-neon {
  /* same as .glass + neon ring on focus */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    0 0 0 1px var(--accent-neon-soft),
    0 0 24px var(--accent-neon-soft),
    0 8px 32px rgba(0, 0, 0, 0.28);
}
```

A subtle animated noise overlay (SVG feTurbulence) is applied to the body to give the glass something to refract.

---

## 7. Animation Inventory

| Element | Trigger | Effect |
|---|---|---|
| Tab pill | mount / unmount | spring scale + opacity |
| Tab pill | hover | width expand, close button fade-in |
| Omnibox | focus | neon ring grows from 0 to 24px |
| AI sidebar | toggle | slide-in 380px + content fade |
| AI message | stream | token-by-token typewriter |
| Traffic light | hover | inner glyph scales 1.1 |
| Command palette | open | backdrop blur in + panel scale-up |
| New tab logo | idle | slow rotation + neon pulse |

All use Framer Motion's `motion.*` and respect `useReducedMotion()`.

---

## 8. AI Integration (GLM)

### 8.1 Endpoint
`POST /api/ai/chat` — Server-Sent Events stream.

### 8.2 Request
```ts
{
  messages: { role: 'user' | 'assistant' | 'system', content: string }[],
  context?: { url: string; title: string; description?: string },
  mode?: 'chat' | 'summarize' | 'translate' | 'code'
}
```

### 8.3 Implementation
- Uses `z-ai-web-dev-sdk`'s `chat.completions.create` with `stream: true`
- Streams chunks as SSE: `data: { "delta": "..." }\n\n`
- Final event: `data: [DONE]`
- System prompt primes GLM as "Nebula, a calm, concise browser assistant"

### 8.4 Modes
- **chat** — free conversation
- **summarize** — auto-extracts page text (in real browser; here we send title + URL) and asks for a 5-bullet summary
- **translate** — auto-detects source, translates to user's locale
- **code** — switches to code-focused system prompt with stricter formatting

---

## 9. Accessibility & Performance

- All interactive elements ≥ 44px hit target
- Full keyboard navigation (Tab, ⌘1-9 for tabs, ⌘T new, ⌘W close, ⌘L omnibox, ⌘K palette)
- ARIA roles for tablist, tab, tabpanel
- `prefers-reduced-motion` disables spring physics
- `prefers-contrast: more` swaps glass for solid surfaces
- Code-splitting: AI sidebar, settings, command palette are lazy-loaded
- No images > 50KB; logo is inline SVG
- Total first-paint JS budget: < 180KB gzipped

---

## 10. File Roadmap (build order)

1. `globals.css` — design tokens, `.glass` utilities, neon helpers
2. `lib/*-store.ts` — Zustand stores (browser, ai, settings)
3. `lib/url.ts`, `lib/neon.ts` — utilities
4. `app/api/ai/chat/route.ts` — GLM streaming endpoint
5. `components/browser/TrafficLights.tsx` + `ChromeBar.tsx` + `Tab.tsx` + `TabStrip.tsx`
6. `components/browser/Toolbar.tsx` + `Omnibox.tsx`
7. `components/browser/BookmarkBar.tsx`
8. `components/browser/NewTabPage.tsx` + `Viewport.tsx`
9. `components/browser/AISidebar.tsx` + `AIMessage.tsx` + `AIInput.tsx`
10. `components/browser/SettingsPanel.tsx` + `CommandPalette.tsx` + `HistoryPanel.tsx`
11. `components/browser/BrowserShell.tsx` — wire everything together
12. `app/page.tsx` — mount BrowserShell
13. Lint, agent-browser verify, polish
