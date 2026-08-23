import { clamp, hash, mix, pal, type ScenePalette } from './palette';
import { DOG, PAL, S, type Pose } from './sprites';
import {
  AUDIENCE,
  BENCH_X,
  CH,
  FIRE_X,
  HILL_X,
  JETTY_X,
  STAGE_X,
  TRAIL_X,
  WORLD,
  type WorldSnapshot,
} from './world.model';

/** A single ambient dust/spark particle. */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  c: string;
}

interface Emote {
  type: Pose;
  icon: 'hand' | 'bang' | 'heart' | 'star';
  hop: number;
  life: number;
  max: number;
}

/** Directional input, owned by the host component and read here each tick. */
export interface WorldInput {
  left: boolean;
  right: boolean;
  run: boolean;
}

export interface RendererOptions {
  /** Multiplier on walk speed. */
  walkSpeed: number;
  /** Forced pixel scale; 0 or undefined means derive from viewport height. */
  pixelSize: number;
}

/**
 * The pixel world: simulation and painting, with no knowledge of Angular
 * or the DOM beyond the single canvas it is handed.
 *
 * Rendering is two-stage — everything is drawn 1:1 into a small offscreen
 * buffer (`off`, roughly viewport/pixelSize), then blitted up to the visible
 * canvas with smoothing off. That is what makes the chunky pixels crisp, and
 * it means the per-frame fill cost is independent of display resolution.
 *
 * The host drives it: `attach()` once, `step()` per animation frame,
 * `resize()` on viewport change. `snapshot()` returns the derived state the UI
 * binds to — the renderer never touches a panel or a HUD element itself.
 */
export class WorldRenderer {
  // --- avatar -------------------------------------------------------------
  private ax = HILL_X;
  private vx = 0;
  private face = 1;
  private t = 0;
  private idle = 0;
  private stride = 0;
  private prevAx: number | undefined;
  private spriteWX: number | undefined;

  // --- camera / raster ----------------------------------------------------
  private camX = 0;
  private w = 0;
  private h = 0;
  /** Pixel scale: one world pixel is `px` device pixels. */
  private px = 4;
  /** Offscreen buffer size in world pixels. */
  private iw = 0;
  private ih = 0;
  private off: HTMLCanvasElement | undefined;
  private g!: CanvasRenderingContext2D;
  private cv: HTMLCanvasElement | undefined;
  private ctx: CanvasRenderingContext2D | undefined;

  // --- navigation ---------------------------------------------------------
  private target: number | null = null;
  private wheelT = 0;
  private ping: { x: number; life: number } | null = null;

  // --- chapters -----------------------------------------------------------
  private acting: number | null = null;
  private actT = 0;
  private actIdx = -1;
  private visited = CH.map(() => false);
  private raise = CH.map(() => 0);
  /** Index of the open detail overlay, or -1. Freezes the sim while open. */
  private detail = -1;

  // --- flourishes ---------------------------------------------------------
  private parts: Particle[] = [];
  private emote: Emote | null = null;
  /** Drifting dust motes, sized to the buffer on first paint. */
  private motes: { x: number; y: number; s: number; ph: number }[] | undefined;
  private emoteSeq = 0;
  private claps = 0;

  // --- dog ----------------------------------------------------------------
  private dogX = HILL_X - 26;
  private dogV = 0;
  private dogFace = 1;
  private dogStride = 0;
  private dogIdle = 3;
  private dogBark = 0;
  private dogHop = 0;

  readonly input: WorldInput = { left: false, right: false, run: false };

  constructor(private options: RendererOptions) {}

  /** Bind to the visible canvas. Safe to call again if the element changes. */
  attach(canvas: HTMLCanvasElement): void {
    this.cv = canvas;
    this.resize();
  }

  setOptions(options: RendererOptions): void {
    const repixel = options.pixelSize !== this.options.pixelSize;
    this.options = options;
    if (repixel) this.resize();
  }

  resize(): void {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.px = this.options.pixelSize
      ? clamp(Math.round(this.options.pixelSize), 2, 8)
      : clamp(Math.round(this.h / 200), 3, 6);
    this.iw = Math.ceil(this.w / this.px);
    this.ih = Math.ceil(this.h / this.px);
    if (!this.off) this.off = document.createElement('canvas');
    this.off.width = this.iw;
    this.off.height = this.ih;
    this.g = this.off.getContext('2d')!;
    if (this.cv) {
      this.cv.width = this.w;
      this.cv.height = this.h;
      this.ctx = this.cv.getContext('2d')!;
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  /** Ground height at a world X. Two summed sines give the rolling coastline. */
  private gy(wx: number): number {
    const ih = this.ih;
    return Math.round(
      ih * 0.7 + Math.sin(wx * 0.0031) * ih * 0.03 + Math.sin(wx * 0.0011 + 1.4) * ih * 0.045,
    );
  }

  // --- commands from the host --------------------------------------------

  /** Walk to a world X (HUD travel, or a click on the ground). */
  walkTo(worldX: number): void {
    this.target = clamp(worldX, 60, WORLD - 60);
    this.acting = null;
  }

  /** Walk to a chapter by index. */
  travelTo(chapter: number): void {
    this.target = CH[chapter].x;
    this.acting = null;
  }

  /** Cancel any pending auto-walk, e.g. because the user took manual control. */
  cancelTarget(): void {
    this.target = null;
  }

  /** Toggle the "press E" interaction at the current stop. */
  toggleAction(): void {
    if (this.detail >= 0) return;
    if (this.acting !== null) {
      this.acting = null;
      return;
    }
    if (this.actIdx >= 0) {
      this.acting = this.actIdx;
      this.actT = 0;
      this.target = null;
    }
  }

  /** Freeze the sim behind a project detail overlay. */
  setDetailOpen(index: number): void {
    this.detail = index;
  }

  /** Nudge the avatar horizontally, from a wheel/trackpad gesture. */
  nudge(delta: number): void {
    this.ax += delta;
    this.target = null;
    this.wheelT = 8;
    this.acting = null;
  }

  /** Convert a viewport X (CSS px) to a world X. */
  toWorldX(clientX: number): number {
    return this.camX + clientX / this.px;
  }

  /**
   * Handle a click in the world. Returns what was hit so the host can decide
   * whether the click also means something to the UI.
   */
  pointerAt(clientX: number): 'dog' | 'avatar' | 'ground' {
    const wx = this.toWorldX(clientX);
    const hx = this.spriteWX === undefined ? this.ax : this.spriteWX;

    if (Math.abs(wx - this.dogX) < 12 && Math.abs(wx - this.dogX) < Math.abs(wx - hx)) {
      this.dogBark = 1.1;
      this.dogHop = 0.5;
      this.dogIdle = 0.2;
      for (let i = 0; i < 8; i++) {
        this.parts.push({
          x: this.dogX + (Math.random() - 0.5) * 8,
          y: this.gy(this.dogX) - 10 - Math.random() * 5,
          vx: (Math.random() - 0.5) * 0.7,
          vy: -0.4 - Math.random() * 0.4,
          life: 1,
          c: '#ffd9a0',
        });
      }
      return 'dog';
    }

    if (Math.abs(wx - hx) < 16) {
      const kinds = [
        { p: 'wave', icon: 'hand', hop: 0, c: '#ffe6ac' },
        { p: 'cheer', icon: 'bang', hop: 1, c: '#ffd15c' },
        { p: 'wave', icon: 'heart', hop: 0, c: '#ff8fa3' },
        { p: 'cheer', icon: 'star', hop: 1, c: '#a8e6ff' },
      ] as const;
      this.emoteSeq += 1;
      const kk = kinds[this.emoteSeq % kinds.length];
      this.emote = { type: kk.p, icon: kk.icon, hop: kk.hop, life: 1.8, max: 1.8 };
      this.acting = null;
      this.dogBark = 0.9;
      this.dogHop = 0.45;
      this.dogIdle = 0;
      const n = kk.hop ? 16 : 10;
      for (let i = 0; i < n; i++) {
        this.parts.push({
          x: this.ax + (Math.random() - 0.5) * 10,
          y: this.gy(this.ax) - 20 - Math.random() * 8,
          vx: (Math.random() - 0.5) * 0.9,
          vy: -0.4 - Math.random() * 0.6,
          life: 1,
          c: kk.c,
        });
      }
      return 'avatar';
    }

    this.walkTo(wx);
    this.ping = { x: wx, life: 1 };
    return 'ground';
  }

  // --- frame --------------------------------------------------------------

  /** Advance one frame and paint. Assumes a ~60Hz cadence, as the original did. */
  step(): void {
    if (!this.g) this.resize();
    this.t += 1 / 60;
    const detailOpen = this.detail >= 0;

    let dir = 0;
    if (!detailOpen) {
      if (this.input.right) dir += 1;
      if (this.input.left) dir -= 1;
      if (!dir && this.target !== null) {
        const d = this.target - this.ax;
        if (Math.abs(d) < 8) this.target = null;
        else dir = Math.sign(d) * 1.4;
      }
    }
    if (dir !== 0 || detailOpen) this.acting = null;
    if (this.acting !== null && Math.abs(this.ax - CH[this.acting].x) > CH[this.acting].r) {
      this.acting = null;
    }
    this.actT = this.acting !== null ? this.actT + 1 / 60 : 0;
    const spd = (this.input.run ? 3.6 : 1.8) * (this.options.walkSpeed ?? 1);
    this.vx += (dir * spd - this.vx) * 0.18;
    if (this.wheelT > 0) this.wheelT--;
    this.ax = clamp(this.ax + this.vx, 60, WORLD - 60);
    if (Math.abs(this.vx) > 0.12) {
      this.face = this.vx > 0 ? 1 : -1;
      this.idle = 0;
      this.stride += Math.abs(this.vx) * 0.12;
    } else {
      this.idle += 1 / 60;
    }
    if (this.ping) {
      this.ping.life -= 0.02;
      if (this.ping.life <= 0) this.ping = null;
    }
    this.dogTick();

    const ph = clamp(this.ax / WORLD, 0, 1);
    const night = clamp((ph - 0.74) / 0.26, 0, 1);
    this.camX = Math.round(clamp(this.ax - this.iw * 0.7, 0, Math.max(0, WORLD - this.iw)));

    const prevAx = this.prevAx === undefined ? this.ax : this.prevAx;
    this.prevAx = this.ax;
    CH.forEach((c, i) => {
      const lo = Math.min(prevAx, this.ax) - 90;
      const hi = Math.max(prevAx, this.ax) + 90;
      if (c.x > lo && c.x < hi) this.visited[i] = true;
      if (this.visited[i]) this.raise[i] = Math.min(1, this.raise[i] + 0.05);
    });

    this.paint(ph, night);
  }

  /**
   * Derived state for the UI layer. Called once per frame by the host, which
   * diffs it into signals — so panels only re-render when something changes.
   */
  snapshot(): WorldSnapshot {
    const ph = clamp(this.ax / WORLD, 0, 1);

    let nearest = 0;
    let nd = 1e9;
    CH.forEach((c, i) => {
      const d = Math.abs(this.ax - c.x);
      if (d < nd) {
        nd = d;
        nearest = i;
      }
    });

    let ai = -1;
    let ad = 1e9;
    CH.forEach((c, i) => {
      const d = Math.abs(this.ax - c.x);
      if (d < c.r && d < ad) {
        ad = d;
        ai = i;
      }
    });
    this.actIdx = ai;

    const anchorX = this.acting !== null ? CH[this.acting].x : this.ax;
    return {
      phase: ph,
      nearest,
      nearestDistance: nd,
      actionable: ai,
      acting: this.acting,
      visited: this.visited,
      promptAt: {
        x: Math.round((anchorX - this.camX) * this.px),
        y: Math.round((this.gy(anchorX) - 26) * this.px),
      },
    };
  }

  /** True when the avatar is settled enough for the prompt to read cleanly. */
  get isStill(): boolean {
    return Math.abs(this.vx) < 0.3;
  }

  private sprite(g: CanvasRenderingContext2D, map: readonly string[], x: number, y: number, flip: boolean, over?: Record<string, string>): void {
    g.save();
    if (flip) { g.translate(x + 16, 0); g.scale(-1, 1); } else { g.translate(x, 0); }
    for (let r = 0; r < map.length; r++) {
      const row = map[r];
      for (let q = 0; q < row.length; q++) {
        const ch = row[q];
        if (ch === '.' || ch === ' ') continue;
        g.fillStyle = (over && over[ch]) || PAL[ch] || '#000';
        g.fillRect(q, y + r, 1, 1);
      }
    }
    g.restore();
  }

  private paint(ph: number, night: number): void {
    const g = this.g, iw = this.iw, ih = this.ih, C = pal(ph), cam = this.camX;
    const hor = Math.round(ih * 0.52);

    for (let y = 0; y < hor; y++) { g.fillStyle = mix(C.skyTop, C.skyBot, y / hor); g.fillRect(0, y, iw, 1); }

    if (night > 0.02) {
      for (let i = 0; i < 90; i++) {
        g.globalAlpha = night * (0.35 + 0.65 * Math.abs(Math.sin(this.t * 1.2 + i)));
        g.fillStyle = '#fdf7e6'; g.fillRect(Math.round(hash(i) * iw), Math.round(hash(i + 99) * hor), 1, 1);
      }
      g.globalAlpha = 1;
    }

    const sunX = Math.round(iw * 0.74 - ph * iw * 0.52), sunY = Math.round(ih * 0.14 + ph * ih * 0.34);
    g.fillStyle = night > 0.55 ? '#e8eeff' : C.sun;
    g.globalAlpha = 0.28; g.beginPath(); g.arc(sunX, sunY, 13, 0, 6.284); g.fill();
    g.globalAlpha = 1; g.beginPath(); g.arc(sunX, sunY, night > 0.55 ? 5 : 7, 0, 6.284); g.fill();
    if (night > 0.55) { g.fillStyle = mix('#0a1230', '#1e2f5c', 0.5); g.beginPath(); g.arc(sunX + 3, sunY - 2, 5, 0, 6.284); g.fill(); }

    g.fillStyle = C.cloud; g.globalAlpha = 0.85;
    for (let i = 0; i < 7; i++) {
      const cx = ((hash(i) * 2400 - cam * 0.22) % (iw + 90)) - 45;
      const cy = ih * 0.1 + hash(i + 7) * ih * 0.22;
      const s = 5 + hash(i + 21) * 6;
      g.beginPath(); g.arc(cx, cy, s, 0, 6.284); g.arc(cx + s * 0.9, cy + 1, s * 0.75, 0, 6.284); g.arc(cx - s * 0.9, cy + 2, s * 0.6, 0, 6.284); g.fill();
    }
    g.globalAlpha = 1;

    for (let y = hor; y < ih; y++) { g.fillStyle = mix(C.sea, C.seaDeep, (y - hor) / (ih - hor)); g.fillRect(0, y, iw, 1); }
    g.globalAlpha = 0.5;
    for (let i = 0; i < 26; i++) {
      const wy = hor + 2 + hash(i) * (ih - hor) * 0.6;
      const wx = ((hash(i + 3) * iw + Math.sin(this.t * 0.6 + i) * 6) % iw);
      g.fillStyle = night > 0.5 ? '#8fa8d8' : '#e8fbff';
      g.fillRect(Math.round(wx), Math.round(wy), 3 + Math.round(hash(i + 9) * 4), 1);
    }
    g.globalAlpha = 1;

    this.jetty(g, C, cam);

    for (let x = 0; x < iw; x++) {
      const wx = cam + x, y = this.gy(wx);
      g.fillStyle = C.land; g.fillRect(x, y, 1, ih - y);
      g.fillStyle = C.landEdge; g.fillRect(x, y, 1, 2);
      if (hash(Math.floor(wx * 0.7)) > 0.86) { g.fillStyle = C.landDark; g.fillRect(x, y + 4 + Math.round(hash(wx) * 10), 1, 2); }
    }
    for (let wx = Math.floor(cam / 9) * 9; wx < cam + iw + 9; wx += 9) {
      const hh = hash(wx * 0.31);
      if (hh < 0.45) continue;
      const x = wx - cam, y = this.gy(wx), th = 1 + Math.round(hh * 2);
      g.fillStyle = hh > 0.9 ? '#f2e26a' : C.landEdge;
      g.fillRect(x, y - th, 1, th);
      if (hh > 0.94) { g.fillStyle = night > 0.5 ? '#8a6ea8' : '#ff9fc0'; g.fillRect(x, y - th - 1, 1, 1); }
    }

    this.trees(g, C, cam, night);
    this.stage(g, C, cam, night);
    this.bench(g, C, cam);
    this.signpost(g, C, cam);
    this.fire(g, C, cam, night);
    this.flags(g, cam);
    if (this.ping) this.pingMark(g, cam);
    this.dog(g, cam);
    this.avatar(g, cam);
    this.foreground(g, C, cam);
    this.ambient(g, night);

    this.ctx!.imageSmoothingEnabled = false;
    this.ctx!.drawImage(this.off!, 0, 0, iw, ih, 0, 0, iw * this.px, ih * this.px);
  }

  private pingMark(g: CanvasRenderingContext2D, cam: number): void {
    const x = Math.round(this.ping!.x - cam), y = this.gy(this.ping!.x);
    g.globalAlpha = this.ping!.life * 0.9;
    g.strokeStyle = '#ffe6ac'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(x, y, 4 + (1 - this.ping!.life) * 5, 1.6 + (1 - this.ping!.life) * 2, 0, 0, 6.284); g.stroke();
    g.globalAlpha = 1;
  }

  private tree(g: CanvasRenderingContext2D, C: ScenePalette, x: number, y: number, s: number, lit: string): void {
    g.fillStyle = C.trunk;
    g.fillRect(Math.round(x - s * 0.14), Math.round(y - s * 1.15), Math.max(2, Math.round(s * 0.28)), Math.round(s * 1.2));
    const blobs = [[0, -1.55, 0.72], [-0.62, -1.28, 0.52], [0.62, -1.3, 0.55], [-0.3, -1.85, 0.48], [0.34, -1.86, 0.46]];
    g.fillStyle = C.tree;
    for (const b of blobs) { g.beginPath(); g.arc(x + b[0] * s, y + b[1] * s, b[2] * s, 0, 6.284); g.fill(); }
    g.fillStyle = lit;
    for (const b of blobs) { g.beginPath(); g.arc(x + b[0] * s - s * 0.12, y + b[1] * s - s * 0.14, b[2] * s * 0.62, 0, 6.284); g.fill(); }
  }

  private trees(g: CanvasRenderingContext2D, C: ScenePalette, cam: number, night: number): void {
    const lit = mix(C.treeLit, C.tree, night * 0.55);
    for (const [wx, s] of [[180, 30], [480, 15], [660, 12], [1120, 18], [1660, 13], [2260, 20], [2860, 15], [3210, 22]]) {
      const x = wx - cam;
      if (x < -60 || x > this.iw + 60) continue;
      this.tree(g, C, x, this.gy(wx) + 1, s, lit);
    }
    const ox = HILL_X - cam, oy = this.gy(HILL_X) + 1;
    if (ox > -80 && ox < this.iw + 80) {
      const sw = this.swingSway();
      g.strokeStyle = '#c9a06a'; g.lineWidth = 1;
      g.beginPath();
      g.moveTo(ox + 9, oy - 36); g.lineTo(ox + 9 + sw, oy - 13);
      g.moveTo(ox + 23, oy - 36); g.lineTo(ox + 23 + sw, oy - 13);
      g.stroke();
      g.fillStyle = C.wood; g.fillRect(Math.round(ox + 8 + sw), Math.round(oy - 13), 16, 2);
      g.fillStyle = mix(C.wood, '#000000', 0.5); g.fillRect(Math.round(ox + 8 + sw), Math.round(oy - 11), 16, 1);
    }
  }

  private logSeat(g: CanvasRenderingContext2D, C: ScenePalette, x: number, y: number): void {
    g.fillStyle = mix(C.wood, '#000000', 0.42); g.fillRect(x - 8, y - 3, 16, 3);
    g.fillStyle = C.wood; g.fillRect(x - 8, y - 5, 16, 2);
    g.fillStyle = mix(C.wood, '#ffffff', 0.22); g.fillRect(x - 7, y - 5, 14, 1);
    g.fillStyle = mix(C.wood, '#000000', 0.62); g.fillRect(x - 8, y - 1, 16, 1);
  }

  private swingSway(): number { return Math.sin(this.t * 1.15) * 5; }

  private stage(g: CanvasRenderingContext2D, C: ScenePalette, cam: number, night: number): void {
    const x = Math.round(STAGE_X - cam), y = this.gy(STAGE_X);
    if (x < -140 || x > this.iw + 140) return;
    g.fillStyle = mix(C.wood, '#000000', 0.15);
    g.fillRect(x - 30, y - 5, 60, 3);
    g.fillStyle = C.wood; g.fillRect(x - 30, y - 7, 60, 2);
    for (let i = 0; i < 5; i++) g.fillRect(x - 26 + i * 13, y - 4, 2, 4);

    const sx = x + 6, sy = y - 44;
    g.fillStyle = '#4a3a2c'; g.fillRect(sx + 15, sy + 6, 2, 32);
    g.fillStyle = mix('#0e1a24', '#20364a', 0.5 + 0.5 * Math.sin(this.t * 0.6));
    g.fillRect(sx - 16, sy - 4, 34, 24);
    g.strokeStyle = '#ffd98a'; g.lineWidth = 1; g.strokeRect(sx - 16.5, sy - 4.5, 35, 25);
    g.fillStyle = '#ffd98a'; g.fillRect(sx - 13, sy - 1, 16, 2);
    g.fillStyle = 'rgba(143,199,255,.85)';
    for (let r = 0; r < 4; r++) g.fillRect(sx - 13, sy + 4 + r * 4, 8 + Math.round(hash(r + Math.floor(this.t * 0.5)) * 16), 2);
    if (night > 0.1) {
      const gr = g.createRadialGradient(sx, sy + 8, 0, sx, sy + 8, 40);
      gr.addColorStop(0, 'rgba(150,190,255,' + (0.16 * night).toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(150,190,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(sx, sy + 8, 40, 0, 6.284); g.fill();
    }

    const onStage = Math.abs(this.ax - STAGE_X) < 90;
    AUDIENCE.forEach((a, i) => {
      const axp = STAGE_X + a.dx * 1.6, gyp = this.gy(axp), sxp = Math.round(axp - cam);
      const bob = Math.round(Math.sin(this.t * 2 + i) * 0.5);
      this.logSeat(g, C, sxp, gyp);
      this.sprite(g, i % 2 ? S.sitCap : S.sit, sxp - 8, gyp - 18 + bob, a.dx > 0, a.o);
      if (onStage && Math.random() < 0.012) this.parts.push({ x: axp, y: gyp - 22, vx: (Math.random() - 0.5) * 0.4, vy: -0.5, life: 1, c: '#ffe6ac' });
    });
  }

  private signpost(g: CanvasRenderingContext2D, C: ScenePalette, cam: number): void {
    const x = Math.round(TRAIL_X - cam), y = this.gy(TRAIL_X);
    if (x < -50 || x > this.iw + 50) return;
    const wood = mix('#c9a06a', C.wood, 0.35), lite = mix(wood, '#ffffff', 0.3), dark = mix(wood, '#000000', 0.55);
    g.fillStyle = dark; g.fillRect(x - 1, y - 32, 3, 32);
    g.fillStyle = wood; g.fillRect(x - 1, y - 32, 1, 32);
    [[-1, -30], [1, -22], [-1, -14]].forEach(([d, py]) => {
      const w = 19, px = d < 0 ? x - w + 2 : x - 1;
      g.fillStyle = wood; g.fillRect(px, y + py, w, 6);
      g.fillStyle = lite; g.fillRect(px, y + py, w, 1);
      g.fillStyle = dark; g.fillRect(px, y + py + 5, w, 1);
      g.fillStyle = d < 0 ? lite : dark; g.fillRect(px, y + py, 1, 6);
      g.fillStyle = 'rgba(38,26,16,.8)';
      g.fillRect(px + 4, y + py + 2, w - 9, 1);
      g.fillRect(px + 4, y + py + 4, w - 12, 1);
    });
    g.fillStyle = mix(C.landDark, '#000000', 0.2);
    g.fillRect(x - 4, y - 1, 9, 1);
  }

  private bench(g: CanvasRenderingContext2D, C: ScenePalette, cam: number): void {
    const wx = BENCH_X, x = Math.round(wx - cam), y = this.gy(wx);
    if (x < -50 || x > this.iw + 50) return;
    g.fillStyle = mix(C.wood, '#000000', 0.42); g.fillRect(x - 17, y - 3, 34, 3);
    g.fillStyle = C.wood; g.fillRect(x - 17, y - 5, 34, 2);
    g.fillStyle = mix(C.wood, '#ffffff', 0.2); g.fillRect(x - 16, y - 5, 32, 1);
    g.fillStyle = mix(C.wood, '#000000', 0.62); g.fillRect(x - 17, y - 1, 34, 1);
    g.fillStyle = '#9fb3c8'; g.fillRect(x + 7, y - 10, 9, 5);
    g.fillStyle = mix('#9fb3c8', '#000000', 0.4); g.fillRect(x + 7, y - 6, 9, 1);
    g.fillStyle = '#c9a06a'; g.fillRect(x + 10, y - 12, 3, 2);
  }

  private jetty(g: CanvasRenderingContext2D, C: ScenePalette, cam: number): void {
    const wx = JETTY_X, x = Math.round(wx - cam);
    if (x < -60 || x > this.iw + 60) return;
    const y = this.gy(wx) - 1;
    g.fillStyle = C.wood;
    g.fillRect(x - 30, y - 2, 34, 2);
    for (let i = 0; i < 4; i++) g.fillRect(x - 28 + i * 9, y, 2, 5);
  }

  private fire(g: CanvasRenderingContext2D, C: ScenePalette, cam: number, night: number): void {
    const wx = FIRE_X, x = Math.round(wx - cam), y = this.gy(wx);
    if (x < -50 || x > this.iw + 50) return;
    this.campLog(g, C, x - 22, y);
    g.fillStyle = '#4a3524';
    g.fillRect(x - 7, y - 2, 14, 2); g.fillRect(x - 5, y - 4, 10, 2);
    const f = 3 + Math.sin(this.t * 9) * 1.2;
    g.fillStyle = '#ff9d3c'; g.beginPath(); g.arc(x, y - 7, f + 1.5, 0, 6.284); g.fill();
    g.fillStyle = '#ffd66b'; g.beginPath(); g.arc(x, y - 8, f * 0.6, 0, 6.284); g.fill();
    if (night > 0.05) {
      const gr = g.createRadialGradient(x, y - 8, 0, x, y - 8, 46);
      gr.addColorStop(0, 'rgba(255,168,80,' + (0.34 * night).toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(255,168,80,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y - 8, 46, 0, 6.284); g.fill();
    }
    if (Math.random() < 0.25) this.parts.push({ x: wx + (Math.random() - 0.5) * 6, y: y - 10, vx: (Math.random() - 0.5) * 0.3, vy: -0.7 - Math.random() * 0.5, life: 1, c: '#ffb347' });
  }

  private campLog(g: CanvasRenderingContext2D, C: ScenePalette, x: number, y: number): void {
    const w = mix('#6b4a2e', C.wood, 0.4), lite = mix(w, '#ffffff', 0.22), dk = mix(w, '#000000', 0.5);
    g.fillStyle = dk; g.fillRect(x - 11, y - 7, 22, 7);
    g.fillStyle = w; g.fillRect(x - 11, y - 7, 22, 5);
    g.fillStyle = lite; g.fillRect(x - 10, y - 7, 20, 1);
    g.fillStyle = dk; g.fillRect(x - 12, y - 6, 1, 5); g.fillRect(x + 11, y - 6, 1, 5);
    g.fillStyle = mix(w, '#000000', 0.28);
    g.fillRect(x - 6, y - 5, 4, 1); g.fillRect(x + 2, y - 4, 5, 1);
    g.fillStyle = mix(C.landDark, '#000000', 0.3);
    g.globalAlpha = 0.35; g.fillRect(x - 12, y, 24, 1); g.globalAlpha = 1;
  }

  private flags(g: CanvasRenderingContext2D, cam: number): void {
    CH.forEach((c, i) => {
      const x = Math.round(c.x + 60 - cam), y = this.gy(c.x + 60);
      if (x < -20 || x > this.iw + 20) return;
      g.fillStyle = '#7d6a55'; g.fillRect(x, y - 20, 1, 20);
      const r = this.raise[i];
      if (r <= 0) return;
      const fy = y - 20 + (1 - r) * 14;
      g.fillStyle = '#ffd98a';
      const wob = Math.sin(this.t * 4 + i);
      g.beginPath(); g.moveTo(x + 1, fy); g.lineTo(x + 9 + wob, fy + 3); g.lineTo(x + 1, fy + 6); g.closePath(); g.fill();
    });
  }

  private dogTick(): void {
    const act = this.acting !== null && CH[this.acting] ? CH[this.acting] : null;
    const want = act ? act.x - (act.x === FIRE_X ? 64 : 42) : this.ax - this.face * 19;
    const d = want - this.dogX;
    const near = Math.abs(d) < 6;
    this.dogV += ((near ? 0 : Math.sign(d) * Math.min(4.2, Math.abs(d) * 0.11)) - this.dogV) * 0.2;
    this.dogX = clamp(this.dogX + this.dogV, 40, WORLD - 40);
    if (Math.abs(this.dogV) > 0.15) { this.dogFace = this.dogV > 0 ? 1 : -1; this.dogIdle = 0; this.dogStride += Math.abs(this.dogV) * 0.16; }
    else { this.dogIdle += 1 / 60; this.dogFace = this.face; }
    if (this.dogBark > 0) this.dogBark -= 1 / 60;
    if (this.dogHop > 0) this.dogHop -= 1 / 60;
  }

  private dog(g: CanvasRenderingContext2D, cam: number): void {
    const moving = Math.abs(this.dogV) > 0.15;
    const owner = this.pose();
    let map = DOG.walkA;
    if (moving) map = (Math.floor(this.dogStride) % 2 === 0) ? DOG.walkA : DOG.walkB;
    else if (owner === 'sleep' && this.dogIdle > 1.5) map = DOG.sleep;
    else if (this.dogIdle > 1) map = (Math.floor(this.t * 4) % 2 === 0) ? DOG.sit : DOG.sitB;
    const gy = this.gy(this.dogX);
    const x = Math.round(this.dogX - cam) - 8;
    let y = gy - 11;
    if (moving) y += Math.round(Math.sin(this.dogStride * Math.PI) * 0.5);
    if (this.dogHop > 0) y -= Math.round(Math.abs(Math.sin(this.dogHop * 11)) * 3);
    if (x < -30 || x > this.iw + 30) return;
    g.globalAlpha = 0.18; g.fillStyle = '#12301f';
    g.beginPath(); g.ellipse(x + 8, gy + 1, 7, 1.4, 0, 0, 6.284); g.fill(); g.globalAlpha = 1;
    this.sprite(g, map, x, y, this.dogFace < 0);
    if (map === DOG.sleep) {
      const zt = (this.t * 0.45) % 1;
      g.globalAlpha = 0.8 * (1 - zt) * (1 - zt); g.fillStyle = '#fffaf0';
      g.fillRect(Math.round(x + 13 + zt * 4), Math.round(y + 5 - zt * 9), 2, 1);
      g.globalAlpha = 1;
    }
    if (this.dogBark > 0) {
      const bx = x + (this.dogFace < 0 ? -3 : 13), by = y - 5;
      g.globalAlpha = Math.min(1, this.dogBark * 3);
      g.fillStyle = '#241d2b'; g.fillRect(bx - 1, by - 1, 8, 9); g.fillRect(bx + 2, by + 8, 3, 2);
      g.fillStyle = '#fffaf0'; g.fillRect(bx, by, 6, 7); g.fillRect(bx + 3, by + 7, 1, 1);
      g.fillStyle = '#e0913a'; g.fillRect(bx + 2, by + 1, 2, 4); g.fillRect(bx + 2, by + 6, 2, 1);
      g.globalAlpha = 1;
    }
  }

  private pose(): Pose {
    if (this.detail >= 0) return 'stand';
    if (this.emote && this.emote.life > 0) return this.emote.type;
    if (Math.abs(this.vx) > 0.12 || this.wheelT > 0) return (Math.floor(this.stride) % 2 === 0) ? 'walkA' : 'walkB';
    if (this.acting !== null && CH[this.acting]) {
      const a = CH[this.acting].act;
      if (a === 'campsit' && this.actT > 7) return 'sleep';
      return a;
    }
    return 'stand';
  }

  private avatar(g: CanvasRenderingContext2D, cam: number): void {
    if (this.emote) { this.emote.life -= 1 / 60; if (this.emote.life <= 0) this.emote = null; }
    const p = this.pose();
    let x = Math.round(this.ax - cam) - 8;
    let y = this.gy(this.ax) - 18;
    let flip = this.face < 0;
    let shadow = true;

    if (p === 'swing') {
      const sw = this.swingSway();
      x = Math.round(HILL_X - cam + sw) + 8;
      y = this.gy(HILL_X) + 1 - 27;
      flip = true; shadow = false;
    } else if (p === 'present') {
      x = Math.round(STAGE_X - cam) - 16;
      y = this.gy(STAGE_X) - 24 + Math.round(Math.sin(this.t * 2) * 0.5);
      flip = false; shadow = false;
    } else if (p === 'benchsit') {
      x = Math.round(BENCH_X - 8 - cam) - 8;
      y = this.gy(BENCH_X) - 18;
      flip = false; shadow = false;
    } else if (p === 'point') {
      x = Math.round(TRAIL_X - 27 - cam) - 8;
      y = this.gy(TRAIL_X - 27) - 18; flip = false;
    } else if (p === 'campsit') {
      x = Math.round(FIRE_X - 22 - cam) - 8;
      y = this.gy(FIRE_X - 22) - 18; flip = false;
    } else if (p === 'sleep') {
      x = Math.round(FIRE_X - 44 - cam) - 8;
      y = this.gy(FIRE_X - 44) - 17; flip = false; shadow = false;
    } else if (p === 'fish') {
      x = Math.round(JETTY_X - 14 - cam) - 8;
      y = this.gy(JETTY_X - 14) - 18; flip = true;
    }

    this.spriteWX = cam + x + 8;
    let bob = (p === 'walkA' || p === 'walkB') ? Math.round(Math.sin(this.stride * Math.PI)) : 0;
    if (this.emote && this.emote.hop) {
      const el = (this.emote.max - this.emote.life);
      bob -= Math.round(Math.abs(Math.sin(el * 7)) * Math.max(0, 1 - el / 0.9) * 3);
    }
    if (p === 'sleep') bob += Math.round(Math.sin(this.t * 1.1) * 0.5);

    if (shadow) {
      g.globalAlpha = 0.2; g.fillStyle = '#12301f';
      g.beginPath(); g.ellipse(x + 8, this.gy(this.ax) + 1, 6, 1.4, 0, 0, 6.284); g.fill(); g.globalAlpha = 1;
    }


    this.sprite(g, S[p as Pose], x, y + bob, flip);

    if (p === 'present') {
      g.strokeStyle = '#ffe6ac'; g.lineWidth = 1;
      const hxp = x + 14, hy = y + 9;
      g.beginPath(); g.moveTo(hxp, hy); g.lineTo(hxp + 9, hy - 8 + Math.sin(this.t * 1.4) * 2); g.stroke();
    }

    if (p === 'fish') {
      const rodBase = { x: x + 4, y: y + 9 };
      const tip = { x: rodBase.x - 17, y: rodBase.y - 13 };
      g.strokeStyle = '#c9a06a'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(rodBase.x, rodBase.y); g.lineTo(tip.x, tip.y); g.stroke();
      const bx = tip.x - 6, by = this.gy(JETTY_X) - 13;
      g.strokeStyle = 'rgba(255,250,240,.55)';
      g.beginPath(); g.moveTo(tip.x, tip.y);
      g.quadraticCurveTo(tip.x - 4, (tip.y + by) / 2 + 3, bx, by + Math.sin(this.t * 2) * 0.6);
      g.stroke();
      g.fillStyle = '#e05b4a'; g.fillRect(Math.round(bx) - 1, Math.round(by), 2, 2);
      g.strokeStyle = 'rgba(255,255,255,.35)';
      for (let r = 0; r < 2; r++) {
        const rr = ((this.t * 0.7 + r * 0.5) % 1);
        g.globalAlpha = (1 - rr) * 0.5;
        g.beginPath(); g.ellipse(bx, by + 1, 2 + rr * 6, 0.7 + rr * 1.6, 0, 0, 6.284); g.stroke();
      }
      g.globalAlpha = 1;
    }

    if (p === 'sleep') {
      for (let i = 0; i < 3; i++) {
        const zt = (this.t * 0.4 + i * 0.34) % 1;
        g.globalAlpha = 0.9 * (1 - zt) * (1 - zt);
        const zx = Math.round(x + 14 + zt * 6), zy = Math.round(y + 9 - zt * 14), s = zt < 0.4 ? 1 : 2;
        g.fillStyle = '#fffaf0';
        g.fillRect(zx, zy, s * 2 + 1, 1);
        g.fillRect(zx, zy + s * 2, s * 2 + 1, 1);
        for (let d = 0; d < s * 2; d++) g.fillRect(zx + s * 2 - d, zy + d, 1, 1);
      }
      g.globalAlpha = 1;
    }

    if (this.emote) this.bubble(g, x, y, bob);
  }

  private bubble(g: CanvasRenderingContext2D, x: number, y: number, bob: number): void {
    const e = this.emote;
    if (!e) return;
    const k = 1 - e.life / e.max;
    const pop = Math.min(1, k * 6);
    if (pop <= 0.02) return;
    const ey = Math.round(y + bob - 11 - Math.sin(e.life * 3));
    const bw = Math.round(13 * pop), bh = Math.round(10 * pop);
    const bx = x + 8 - Math.round(bw / 2);
    g.globalAlpha = Math.min(1, e.life * 2.2);
    g.fillStyle = '#241d2b';
    g.fillRect(bx - 1, ey - 1, bw + 2, bh + 2);
    g.fillRect(x + 6, ey + bh + 1, 4, 2);
    g.fillStyle = '#fffaf0';
    g.fillRect(bx, ey, bw, bh);
    g.fillRect(x + 7, ey + bh, 2, 2);
    if (pop > 0.85) {
      const cx = x + 8, cy = ey + Math.round(bh / 2);
      g.fillStyle = '#e0913a';
      if (e.icon === 'hand') {
        g.fillStyle = '#c98f63';
        g.fillRect(cx - 2, cy - 3, 4, 5); g.fillRect(cx - 3, cy - 2, 1, 3); g.fillRect(cx + 2, cy - 2, 1, 3);
        g.fillStyle = '#241d2b'; g.fillRect(cx - 2, cy + 2, 4, 1);
      } else if (e.icon === 'bang') {
        g.fillRect(cx - 1, cy - 4, 2, 5); g.fillRect(cx - 1, cy + 2, 2, 2);
      } else if (e.icon === 'heart') {
        g.fillStyle = '#e05b6a';
        g.fillRect(cx - 3, cy - 3, 2, 2); g.fillRect(cx + 1, cy - 3, 2, 2);
        g.fillRect(cx - 4, cy - 2, 8, 2); g.fillRect(cx - 3, cy, 6, 1);
        g.fillRect(cx - 2, cy + 1, 4, 1); g.fillRect(cx - 1, cy + 2, 2, 1);
      } else {
        g.fillStyle = '#e8a63a';
        g.fillRect(cx - 1, cy - 4, 2, 8); g.fillRect(cx - 4, cy - 1, 8, 2);
        g.fillRect(cx - 2, cy - 2, 1, 1); g.fillRect(cx + 1, cy - 2, 1, 1);
        g.fillRect(cx - 2, cy + 1, 1, 1); g.fillRect(cx + 1, cy + 1, 1, 1);
      }
    }
    g.globalAlpha = 1;
  }

  private foreground(g: CanvasRenderingContext2D, C: ScenePalette, cam: number): void {
    const iw = this.iw, ih = this.ih, fc = mix(C.landDark, '#000000', 0.35);
    for (let x = 0; x < iw; x++) {
      const wx = Math.round(cam * 1.45) + x;
      const y = Math.round(ih * 0.93 + Math.sin(wx * 0.02) * 2 + Math.sin(wx * 0.006) * 3);
      g.fillStyle = fc; g.fillRect(x, y, 1, ih - y);
      const hh = hash(Math.floor(wx * 0.5));
      if (hh > 0.72) g.fillRect(x, y - 1 - Math.round(hh * 4), 1, 5);
    }
  }

  private ambient(g: CanvasRenderingContext2D, night: number): void {
    const iw = this.iw, ih = this.ih;
    if (!this.motes) this.motes = Array.from({ length: 26 }, () => ({ x: Math.random() * iw, y: ih * 0.4 + Math.random() * ih * 0.55, s: 0.2 + Math.random() * 0.5, ph: Math.random() * 6.3 }));
    for (const m of this.motes) {
      const x = (m.x + this.t * m.s * 6) % iw;
      const y = m.y + Math.sin(this.t * m.s + m.ph) * 4;
      if (night > 0.2) {
        const bl = 0.3 + 0.7 * Math.pow(Math.max(0, Math.sin(this.t * 1.3 + m.ph)), 3);
        g.globalAlpha = night * bl;
        g.fillStyle = '#d6ff96'; g.fillRect(Math.round(x), Math.round(y), 1, 1);
        g.globalAlpha = night * bl * 0.35; g.beginPath(); g.arc(x, y, 2.5, 0, 6.284); g.fill();
      } else {
        g.globalAlpha = (1 - night) * 0.5;
        g.fillStyle = '#fffbe8'; g.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }
    g.globalAlpha = 1;
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const q = this.parts[i];
      q.x += q.vx; q.y += q.vy; q.life -= 0.02;
      if (q.life <= 0) { this.parts.splice(i, 1); continue; }
      g.globalAlpha = Math.max(0, q.life);
      g.fillStyle = q.c;
      g.fillRect(Math.round(q.x - this.camX), Math.round(q.y), 1, 1);
    }
    g.globalAlpha = 1;
  }
}
