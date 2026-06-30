# Contributing to Nebula Browser

Thanks for your interest in contributing! This guide covers the development workflow and commit message conventions.

## Development setup

```bash
git clone https://github.com/YOUR_USERNAME/nebula-browser.git
cd nebula-browser
bun install
bun run electron:dev
```

This opens the Electron app with live reload. Edit any file in `src/` or `electron/` — changes hot-reload automatically.

## Commit message conventions

We use [Conventional Commits](https://www.conventionalcommits.org/) — this makes the changelog auto-generatable and keeps history readable.

### Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
| Type | When to use | Example |
|---|---|---|
| `feat` | New feature | `feat(tabs): add right-click context menu` |
| `fix` | Bug fix | `fix(webview): stop reload loop on internal navigation` |
| `docs` | Documentation only | `docs: update BUILD.md with signing instructions` |
| `style` | Formatting, no code change | `style: fix indentation in ChromeBar` |
| `refactor` | Code restructure, no behavior change | `refactor(store): extract download actions` |
| `perf` | Performance improvement | `perf(viewport): lazy-mount background webviews` |
| `test` | Adding tests | `test: add omnibox URL parsing tests` |
| `chore` | Build, deps, config | `chore: bump electron to 33.2.0` |
| `release` | Version bump | `release: v0.3.1` |

### Scopes (optional but recommended)
- `tabs` — tab strip, tab pill, tab context menu
- `webview` — WebviewView, webview-registry
- `toolbar` — Toolbar, Omnibox
- `ai` — AISidebar, AIMessage, AI API route
- `downloads` — DownloadsPanel, download IPC
- `bookmarks` — BookmarkBar
- `viewport` — Viewport, SplitView, LocalFilePreview
- `settings` — SettingsPanel, settings-store
- `electron` — main.js, preload.js
- `store` — browser-store, ai-store, settings-store
- `ui` — general UI / styling
- `docs` — documentation
- `ci` — GitHub Actions

### Examples
```
feat(ai): add Pollinations.ai as free fallback when Z.ai is unavailable

When the Z.ai config is missing or the API is unreachable, the chat
endpoint now automatically falls back to Pollinations.ai (gpt-oss-20b),
which requires no API key. Users get AI out of the box.

Fixes #42
```

```
fix(downloads): send IPC to mainWindow instead of webview

Downloads weren't showing in the panel because download-started events
were being sent to the webview's renderer, not the main window's renderer.
Now all download IPC goes to mainWindow.webContents.
```

```
chore: bump electron to 33.2.0
```

## Pull request workflow

1. **Fork** the repo and create a branch:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. **Make your changes** — keep commits focused and well-described
3. **Test locally**:
   ```bash
   bun run lint
   bun run electron:dev
   ```
4. **Update the CHANGELOG** — add your changes under `[Unreleased]`
5. **Push and open a PR**:
   ```bash
   git push -u origin feat/my-new-feature
   ```
6. **Reference the issue** in the PR description (e.g. "Closes #42")

## Release process

Maintainers handle releases:

1. Update `version` in `package.json`
2. Move `[Unreleased]` items to a new version section in `CHANGELOG.md`
3. Commit: `git commit -m "release: v0.3.1"`
4. Tag: `git tag v0.3.1`
5. Push: `git push && git push --tags`
6. GitHub Actions auto-builds Windows/macOS/Linux installers
7. Publish a GitHub Release with the changelog and attached installers

## Code style

- **TypeScript** throughout, strict typing
- **shadcn/ui** components preferred over custom HTML
- **Framer Motion** for all animations
- **Zustand** for state with `persist` middleware for localStorage
- No `any` types — use `unknown` and narrow
- Run `bun run lint` before committing — must pass clean

## Areas that need help

- [ ] Bookmark folders (drag-to-create)
- [ ] Reader mode for articles
- [ ] Tab tear-off (drag tab out to new window)
- [ ] Extension support
- [ ] Mobile responsive layout
- [ ] Unit tests
- [ ] Translations (i18n)

Open an issue first to discuss before starting work on a major feature.
