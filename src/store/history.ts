// Lightweight undo/redo history stack.
// Snapshots the Project (excluding assets — those are managed separately so
// undo/redo never accidentally deletes uploaded files from the Asset Library).

import type { Project } from '@/types';

const MAX_HISTORY = 60;

export interface HistoryEntry {
  label: string;
  project: Project;
  at: number;
}

export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

export function createHistory(): HistoryState {
  return { past: [], future: [] };
}

export function pushHistory(state: HistoryState, entry: HistoryEntry): HistoryState {
  const past = [...state.past, entry];
  if (past.length > MAX_HISTORY) past.shift();
  return { past, future: [] };
}

export function undo(state: HistoryState, current: HistoryEntry): { state: HistoryState; entry: HistoryEntry | null } {
  if (state.past.length === 0) return { state, entry: null };
  const past = state.past.slice();
  const entry = past.pop()!;
  return {
    state: {
      past,
      future: [current, ...state.future].slice(0, MAX_HISTORY),
    },
    entry,
  };
}

export function redo(state: HistoryState, current: HistoryEntry): { state: HistoryState; entry: HistoryEntry | null } {
  if (state.future.length === 0) return { state, entry: null };
  const [entry, ...rest] = state.future;
  return {
    state: {
      past: [...state.past, current].slice(-MAX_HISTORY),
      future: rest,
    },
    entry,
  };
}
