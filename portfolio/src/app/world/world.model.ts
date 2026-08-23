import { mix } from './palette';
import type { Pose } from './sprites';

/**
 * World layout: the six stops along the walk, in world pixels.
 *
 * These X positions are the single source of truth shared by the renderer
 * (where to draw the swing, stage, bench...) and the UI (which panel is open,
 * where the HUD travels to). Chapter order must match `PORTFOLIO.chapters`.
 */

export const HILL_X = 180;
export const STAGE_X = 820;
export const BENCH_X = 1400;
export const TRAIL_X = 1980;
export const JETTY_X = 2540;
export const FIRE_X = 3060;

/** Total walkable width. The avatar is clamped to [60, WORLD - 60]. */
export const WORLD = 3260;

export interface Chapter {
  /** World-space centre of the stop. */
  readonly x: number;
  readonly label: string;
  /** Pose the avatar adopts when interacting here. */
  readonly act: Pose;
  /** Copy for the "press E" prompt. */
  readonly hint: string;
  /** Interaction radius in world pixels. */
  readonly r: number;
}

export const CH: readonly Chapter[] = [
  { x: HILL_X, label: 'THE HILL', act: 'swing', hint: 'SIT ON THE SWING', r: 46 },
  { x: STAGE_X, label: 'THE WORKS', act: 'present', hint: 'TAKE THE STAGE', r: 78 },
  { x: BENCH_X, label: 'TOOLBELT', act: 'benchsit', hint: 'SIT ON THE BENCH', r: 48 },
  { x: TRAIL_X, label: 'THE TRAIL', act: 'point', hint: 'READ THE SIGNPOST', r: 50 },
  { x: JETTY_X, label: 'THE JETTY', act: 'fish', hint: 'CAST A LINE', r: 56 },
  { x: FIRE_X, label: 'CAMPFIRE', act: 'campsit', hint: 'SIT BY THE FIRE', r: 58 },
];

/**
 * Spectators drawn around the stage. `dx` is offset from STAGE_X; `j`/`h`/`s`
 * are jacket, hair and skin. `o` is the derived sprite-palette override that
 * recolours the shared `sit` pose per spectator — precomputed once here rather
 * than lazily cached mid-frame.
 */
const SPECTATORS = [
  { dx: -46, j: '#8a4a55', h: '#2f2320', s: '#c98f63' },
  { dx: -30, j: '#3f5f8a', h: '#6d4a24', s: '#f0c9a3' },
  { dx: 30, j: '#6a5a8a', h: '#8a6a3a', s: '#e8bd93' },
  { dx: 46, j: '#7a6a3a', h: '#3a2a2a', s: '#a97347' },
];

export const AUDIENCE = SPECTATORS.map((a) => ({
  ...a,
  o: {
    j: a.j,
    g: mix(a.j, '#000000', 0.3),
    l: mix(a.j, '#ffffff', 0.18),
    c: mix(a.j, '#ffffff', 0.55),
    h: a.h,
    n: mix(a.h, '#ffffff', 0.24),
    s: a.s,
    f: mix(a.s, '#000000', 0.18),
    r: mix(a.j, '#000000', 0.55),
    p: mix(a.j, '#241d2b', 0.62),
    q: mix(a.j, '#241d2b', 0.76),
    a: mix(a.j, '#241d2b', 0.45),
  } as Record<string, string>,
}));

/**
 * Snapshot the renderer publishes each frame for the UI to react to.
 * Everything here is derived state — the renderer owns it, Angular reads it.
 */
export interface WorldSnapshot {
  /** 0..1 progress across the world; also drives time of day. */
  readonly phase: number;
  /** Index of the closest chapter. */
  readonly nearest: number;
  /** Distance in world pixels to `nearest`. */
  readonly nearestDistance: number;
  /** Chapter the avatar is standing inside, or -1. */
  readonly actionable: number;
  /** Chapter currently being acted out, or null. */
  readonly acting: number | null;
  /** Chapters walked past so far. */
  readonly visited: readonly boolean[];
  /** Screen-space position for the "press E" prompt, in CSS pixels. */
  readonly promptAt: { x: number; y: number };
}
