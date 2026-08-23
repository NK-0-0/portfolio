/**
 * Time-of-day colour grading.
 *
 * The walk east doubles as a clock: the avatar's world X maps to a `phase` in
 * 0..1, and the scene palette is interpolated day -> dusk -> night across it.
 * Dusk sits at phase 0.72 so the golden hour lands around the jetty.
 */

/** Every colour the scene painter needs for one moment in the day. */
export interface ScenePalette {
  skyTop: string;
  skyBot: string;
  sea: string;
  seaDeep: string;
  land: string;
  landDark: string;
  landEdge: string;
  trunk: string;
  tree: string;
  treeLit: string;
  wood: string;
  cloud: string;
  sun: string;
}

function hx(c: string): [number, number, number] {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}

/** Linear blend between two hex colours. `t` is clamped by the caller, not here. */
export function mix(a: string, b: string, t: number): string {
  const A = hx(a);
  const B = hx(b);
  const c = (i: number) =>
    Math.round(A[i] + (B[i] - A[i]) * t)
      .toString(16)
      .padStart(2, '0');
  return '#' + c(0) + c(1) + c(2);
}

const P_DAY: ScenePalette = { skyTop: '#4fb8ea', skyBot: '#c9edff', sea: '#3f9fc4', seaDeep: '#256f97', land: '#57b243', landDark: '#2c6f33', landEdge: '#8ade63', trunk: '#6b4a35', tree: '#2f7a34', treeLit: '#63c04a', wood: '#8a6440', cloud: '#ffffff', sun: '#fff6cf' };
const P_DUSK: ScenePalette = { skyTop: '#4a3a78', skyBot: '#ff9d5c', sea: '#5d6ea6', seaDeep: '#3a4778', land: '#4e7a4a', landDark: '#2a4736', landEdge: '#93a95f', trunk: '#4e3728', tree: '#2a4736', treeLit: '#5f8449', wood: '#6b4c30', cloud: '#ffc59b', sun: '#ffb765' };
const P_NIGHT: ScenePalette = { skyTop: '#070d26', skyBot: '#1e2f5c', sea: '#1b2b52', seaDeep: '#111c3a', land: '#20392c', landDark: '#122117', landEdge: '#39644a', trunk: '#2a2018', tree: '#152a20', treeLit: '#254532', wood: '#33261a', cloud: '#33436c', sun: '#e8eeff' };

/** The dusk keyframe's position along the 0..1 phase. */
const DUSK_AT = 0.72;

/**
 * Palette for a given phase, smoothstepped within each leg so the two
 * keyframe joins don't read as a visible seam.
 */
export function pal(ph: number): ScenePalette {
  const from = ph < DUSK_AT ? P_DAY : P_DUSK;
  const to = ph < DUSK_AT ? P_DUSK : P_NIGHT;
  const t = ph < DUSK_AT ? ph / DUSK_AT : (ph - DUSK_AT) / (1 - DUSK_AT);
  const k = t * t * (3 - 2 * t);
  const o = {} as ScenePalette;
  for (const key of Object.keys(P_DAY) as (keyof ScenePalette)[]) {
    o[key] = mix(from[key], to[key], k);
  }
  return o;
}

/** Deterministic pseudo-random in 0..1. Keeps scenery stable across frames. */
export function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

export const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
