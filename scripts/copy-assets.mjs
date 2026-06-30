#!/usr/bin/env node
/**
 * Cross-platform asset copier.
 * Copies .next/static and public/ into .next/standalone/ so the standalone
 * server can serve them. Replaces `cp -r` which doesn't work on Windows.
 */
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const targets = [
  {
    from: join(root, ".next", "static"),
    to: join(root, ".next", "standalone", ".next", "static"),
  },
  {
    from: join(root, "public"),
    to: join(root, ".next", "standalone", "public"),
  },
];

for (const { from, to } of targets) {
  if (!existsSync(from)) {
    console.warn(`[copy-assets] Source not found, skipping: ${from}`);
    continue;
  }
  mkdirSync(join(to, ".."), { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`[copy-assets] Copied ${from} → ${to}`);
}
