"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

type Grid = number[][];

const SIZE = 4;

function makeEmptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandomTile(grid: Grid): Grid {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map((row) => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

function initGrid(): Grid {
  return addRandomTile(addRandomTile(makeEmptyGrid()));
}

function slideRow(row: number[]): { row: number[]; gained: number } {
  const filtered = row.filter((v) => v !== 0);
  const merged: number[] = [];
  let gained = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      gained += filtered[i] * 2;
      i++;
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return { row: merged, gained };
}

function rotateGrid(grid: Grid): Grid {
  const newGrid = makeEmptyGrid();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      newGrid[c][SIZE - 1 - r] = grid[r][c];
    }
  }
  return newGrid;
}

function moveLeft(grid: Grid): { grid: Grid; gained: number; moved: boolean } {
  let gained = 0;
  const newGrid = grid.map((row) => {
    const result = slideRow(row);
    gained += result.gained;
    return result.row;
  });
  const moved = JSON.stringify(newGrid) !== JSON.stringify(grid);
  return { grid: newGrid, gained, moved };
}

function move(grid: Grid, dir: "left" | "right" | "up" | "down"): { grid: Grid; gained: number; moved: boolean } {
  let working = grid;
  let rotations = 0;
  if (dir === "up") rotations = 1;
  if (dir === "right") rotations = 2;
  if (dir === "down") rotations = 3;
  for (let i = 0; i < rotations; i++) working = rotateGrid(working);
  const result = moveLeft(working);
  working = result.grid;
  for (let i = 0; i < (4 - rotations) % 4; i++) working = rotateGrid(working);
  return { grid: working, gained: result.gained, moved: result.moved };
}

function isGameOver(grid: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return false;
      if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return false;
      if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

const TILE_COLORS: Record<number, string> = {
  2: "#1a1a1e", 4: "#2a2a2e", 8: "#00b8d4", 16: "#00e5ff",
  32: "#00b8d4", 64: "#ff00e5", 128: "#b6ff00", 256: "#ffb800",
  512: "#ff6b6b", 1024: "#a78bfa", 2048: "var(--neon)",
};

export function Minigame2048() {
  const [grid, setGrid] = useState<Grid>(initGrid);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem("nebula-2048-best") || "0", 10);
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const handleMove = useCallback((dir: "left" | "right" | "up" | "down") => {
    if (gameOver) return;
    setGrid((prev) => {
      const result = move(prev, dir);
      if (!result.moved) return prev;
      const newGrid = addRandomTile(result.grid);
      if (result.gained > 0) {
        setScore((s) => {
          const newScore = s + result.gained;
          if (newScore > best) {
            setBest(newScore);
            if (typeof window !== "undefined") localStorage.setItem("nebula-2048-best", String(newScore));
          }
          return newScore;
        });
      }
      if (!won && newGrid.some((row) => row.includes(2048))) setWon(true);
      if (isGameOver(newGrid)) setGameOver(true);
      return newGrid;
    });
  }, [gameOver, won, best]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "arrowleft" || key === "a") { e.preventDefault(); handleMove("left"); }
      else if (key === "arrowright" || key === "d") { e.preventDefault(); handleMove("right"); }
      else if (key === "arrowup" || key === "w") { e.preventDefault(); handleMove("up"); }
      else if (key === "arrowdown" || key === "s") { e.preventDefault(); handleMove("down"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleMove]);

  const reset = () => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div className="glass-flat rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-[var(--text-primary)]">2048</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-white/5 px-2.5 py-1 text-center">
            <div className="text-[8px] uppercase text-[var(--text-tertiary)]">Score</div>
            <div className="text-[12px] font-bold text-[var(--text-primary)]">{score}</div>
          </div>
          <div className="rounded-lg bg-white/5 px-2.5 py-1 text-center">
            <div className="text-[8px] uppercase text-[var(--text-tertiary)]">Best</div>
            <div className="text-[12px] font-bold text-[var(--neon)]">{best}</div>
          </div>
          <button onClick={reset} className="rounded-lg bg-[var(--neon-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--neon)]">New</button>
        </div>
      </div>

      <div className="relative grid grid-cols-4 gap-1.5 rounded-lg bg-black/20 p-1.5" style={{ touchAction: "none" }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          (e.currentTarget as HTMLElement).dataset.startX = String(touch.clientX);
          (e.currentTarget as HTMLElement).dataset.startY = String(touch.clientY);
        }}
        onTouchEnd={(e) => {
          const touch = e.changedTouches[0];
          const el = e.currentTarget as HTMLElement;
          const dx = touch.clientX - parseFloat(el.dataset.startX || "0");
          const dy = touch.clientY - parseFloat(el.dataset.startY || "0");
          if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > 20) handleMove(dx > 0 ? "right" : "left");
          } else {
            if (Math.abs(dy) > 20) handleMove(dy > 0 ? "down" : "up");
          }
        }}
      >
        {grid.map((row, r) =>
          row.map((val, c) => (
            <div key={`${r}-${c}`} className="flex aspect-square items-center justify-center rounded-md" style={{ background: val > 0 ? (TILE_COLORS[val] || "var(--neon)") : "rgba(255,255,255,0.03)" }}>
              <AnimatePresence>
                {val > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="text-[14px] font-bold"
                    style={{ color: val <= 4 ? "var(--text-primary)" : "#fff" }}
                  >
                    {val}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/70 backdrop-blur-sm">
            <span className="text-[16px] font-bold text-[#FF5F57]">Game Over</span>
            <button onClick={reset} className="mt-2 rounded-lg bg-[var(--neon-soft)] px-3 py-1.5 text-[11px] font-semibold text-[var(--neon)]">Try again</button>
          </div>
        )}
        {won && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/70 backdrop-blur-sm">
            <span className="text-[16px] font-bold text-[var(--neon)]">You won! 🎉</span>
            <button onClick={reset} className="mt-2 rounded-lg bg-[var(--neon-soft)] px-3 py-1.5 text-[11px] font-semibold text-[var(--neon)]">Play again</button>
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-[9px] text-[var(--text-tertiary)]">Arrow keys / WASD / swipe</p>
    </div>
  );
}
