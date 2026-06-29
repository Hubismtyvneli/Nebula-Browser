#!/usr/bin/env bash
# Nebula Browser — first-time desktop setup script.
# Installs Electron + electron-builder + helper dev deps so you can run
# `bun run electron:dev` and `bun run electron:build:<os>` right after.

set -e

echo "=========================================="
echo "  Nebula Browser — desktop setup"
echo "=========================================="
echo ""

# Step 1 — verify Bun is available
if ! command -v bun &>/dev/null; then
  echo "✗ Bun is not installed."
  echo "  Install it first: curl -fsSL https://bun.sh/install | bash"
  exit 1
fi
echo "✓ Bun detected: $(bun --version)"

# Step 2 — install all deps (Electron, electron-builder, concurrently, wait-on, cross-env)
echo ""
echo "→ Installing dependencies (Electron, electron-builder, helpers)…"
bun install

# Step 3 — lint check
echo ""
echo "→ Running lint check…"
if bun run lint; then
  echo "✓ Lint clean"
else
  echo "✗ Lint failed — fix the errors above before building."
  exit 1
fi

# Step 4 — verify Electron downloaded successfully
echo ""
echo "→ Verifying Electron binary…"
ELECTRON_PATH=$(node -e "console.log(require('electron'))")
if [ -n "$ELECTRON_PATH" ]; then
  echo "✓ Electron binary present at: $ELECTRON_PATH"
else
  echo "✗ Electron binary not found — try running 'bun install' again."
  exit 1
fi

# Step 5 — verify next build works
echo ""
echo "→ Running a Next.js build to verify the app compiles for production…"
if bun run build; then
  echo "✓ Next.js build succeeded — .next/standalone is ready"
else
  echo "✗ Next.js build failed — fix the errors above before packaging."
  exit 1
fi

echo ""
echo "=========================================="
echo "  ✓ Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "  Dev mode (live reload):"
echo "    bun run electron:dev"
echo ""
echo "  Build an installer for your OS:"
echo "    Windows:  bun run electron:build:win"
echo "    macOS:    bun run electron:build:mac"
echo "    Linux:    bun run electron:build:linux"
echo ""
echo "  The installer will appear in ./release/"
echo ""
echo "  See download/BUILD.md for full instructions."
echo ""
