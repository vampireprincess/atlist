// Efficient patch-based undo/redo history
// Avoids full JSON snapshots. Uses command pattern + granular patches.

import type { Project } from '@/types';

const MAX_HISTORY = 80;
const DEBOUNCE_MS = 450; // merge rapid slider/drag operations

export interface HistoryPatch {
  path: string[];           // e.g. ['locations', '0', 'position', 'lat']
  op: 'replace' | 'add' | 'remove';
  value?: any;
  oldValue?: any;
}

export interface HistoryCommand {
  label: string;
  timestamp: number;
  patches: HistoryPatch[];
  inversePatches: HistoryPatch[];
}

export interface HistoryStateV2 {
  past: HistoryCommand[];
  future: HistoryCommand[];
  lastActionTime: number;
  lastActionLabel: string;
}

export function createHistoryV2(): HistoryStateV2 {
  return {
    past: [],
    future: [],
    lastActionTime: 0,
    lastActionLabel: '',
  };
}

// Generate patches between two objects (shallow + one level deep)
function generatePatches(before: any, after: any, basePath: string[] = []): HistoryPatch[] {
  const patches: HistoryPatch[] = [];
  
  if (typeof before !== 'object' || before === null || typeof after !== 'object' || after === null) {
    if (before !== after) {
      patches.push({
        path: basePath,
        op: 'replace',
        value: after,
        oldValue: before,
      });
    }
    return patches;
  }

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const oldVal = before[key];
    const newVal = after[key];
    const path = [...basePath, key];

    if (!(key in before)) {
      patches.push({ path, op: 'add', value: newVal });
    } else if (!(key in after)) {
      patches.push({ path, op: 'remove', oldValue: oldVal });
    } else if (typeof oldVal === 'object' && oldVal !== null && typeof newVal === 'object' && newVal !== null) {
      if (Array.isArray(oldVal) && Array.isArray(newVal)) {
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          patches.push({ path, op: 'replace', value: newVal, oldValue: oldVal });
        }
      } else {
        patches.push(...generatePatches(oldVal, newVal, path));
      }
    } else if (oldVal !== newVal) {
      patches.push({ path, op: 'replace', value: newVal, oldValue: oldVal });
    }
  }

  return patches;
}

function applyPatches(target: any, patches: HistoryPatch[]): any {
  const result = JSON.parse(JSON.stringify(target)); // shallow clone for safety
  
  for (const patch of patches) {
    let current = result;
    for (let i = 0; i < patch.path.length - 1; i++) {
      if (!current[patch.path[i]]) current[patch.path[i]] = {};
      current = current[patch.path[i]];
    }
    
    const lastKey = patch.path[patch.path.length - 1];
    
    if (patch.op === 'replace' || patch.op === 'add') {
      current[lastKey] = patch.value;
    } else if (patch.op === 'remove') {
      delete current[lastKey];
    }
  }
  
  return result;
}

export function pushCommand(
  state: HistoryStateV2,
  label: string,
  before: Project,
  after: Project
): HistoryStateV2 {
  const now = Date.now();
  const patches = generatePatches(before, after);
  if (patches.length === 0) return state;

  // Merge with previous command if same label and within debounce window
  const shouldMerge = 
    state.past.length > 0 &&
    state.lastActionLabel === label &&
    now - state.lastActionTime < DEBOUNCE_MS;

  let newPast = [...state.past];

  if (shouldMerge) {
    const last = newPast[newPast.length - 1];
    // Merge patches
    last.patches.push(...patches);
    last.inversePatches.push(...patches.map(p => ({
      path: p.path,
      op: p.op === 'add' ? 'remove' : p.op === 'remove' ? 'add' : 'replace',
      value: p.oldValue,
      oldValue: p.value,
    } as HistoryPatch)));
    last.timestamp = now;
  } else {
    const inversePatches = patches.map(p => ({
      path: p.path,
      op: p.op === 'add' ? 'remove' : p.op === 'remove' ? 'add' : 'replace',
      value: p.oldValue,
      oldValue: p.value,
    } as HistoryPatch));

    const command: HistoryCommand = {
      label,
      timestamp: now,
      patches,
      inversePatches,
    };

    newPast.push(command);
    if (newPast.length > MAX_HISTORY) newPast.shift();
  }

  return {
    past: newPast,
    future: [],
    lastActionTime: now,
    lastActionLabel: label,
  };
}

export function undoV2(
  state: HistoryStateV2,
  currentProject: Project
): { state: HistoryStateV2; project: Project | null } {
  if (state.past.length === 0) return { state, project: null };

  const past = [...state.past];
  const command = past.pop()!;

  const previousProject = applyPatches(currentProject, command.inversePatches);

  return {
    state: {
      past,
      future: [command, ...state.future].slice(0, MAX_HISTORY),
      lastActionTime: Date.now(),
      lastActionLabel: command.label,
    },
    project: previousProject,
  };
}

export function redoV2(
  state: HistoryStateV2,
  currentProject: Project
): { state: HistoryStateV2; project: Project | null } {
  if (state.future.length === 0) return { state, project: null };

  const future = [...state.future];
  const command = future.shift()!;

  const nextProject = applyPatches(currentProject, command.patches);

  return {
    state: {
      past: [...state.past, command].slice(-MAX_HISTORY),
      future,
      lastActionTime: Date.now(),
      lastActionLabel: command.label,
    },
    project: nextProject,
  };
}

export function getHistoryLabels(state: HistoryStateV2): string[] {
  return state.past.map(c => c.label);
}