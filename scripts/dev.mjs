#!/usr/bin/env node
/**
 * Cross-platform dev script.
 * Runs `next dev -p 3000` and tees output to both stdout and dev.log.
 * Replaces the `| tee dev.log` pipe which doesn't work on Windows (Bun has no tee).
 */
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";

const child = spawn("next", ["dev", "-p", "3000"], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
});

const log = createWriteStream("dev.log");

child.stdout.on("data", (d) => {
  process.stdout.write(d);
  log.write(d);
});
child.stderr.on("data", (d) => {
  process.stderr.write(d);
  log.write(d);
});
child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  console.error("Failed to start next dev:", err);
  process.exit(1);
});

// Keep alive
process.stdin.resume();
