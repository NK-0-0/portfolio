import { Component, inject, signal, PLATFORM_ID, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { beforeRender, NgtArgs } from 'angular-three';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { ScrollStateService } from '../../core/services/scroll-state.service';

/**
 * Data-shard — the Experience-section floating prop (procedural, no GLB).
 *
 * The Experience-section floating prop. A matte gunmetal `RoundedBoxGeometry` tablet
 * with a thin emissive "screen" plane on its front face carrying a fake data
 * readout drawn to a `CanvasTexture` (Signal Ghost "mission log" direction).
 *
 * The readout scrolls by animating the texture's UV offset every frame rather
 * than redrawing the canvas — the canvas is drawn once with vertically periodic
 * rows and `RepeatWrapping`, so an offset tick gives an endless scroll at
 * near-zero per-frame cost (mobile-safe; no canvas re-raster on the hot path).
 *
 * Per VISION.md "Floating props" spec: matte body (roughness ~0.7, metalness
 * 0.8), emissive lives ONLY on the accent (the screen), never full-surface.
 *
 * Motion is a like-for-like copy of the old book's per-section behaviour so the
 * swap changes *what* renders, not *when/where* it moves:
 *   Experience (section 2): fades in, left side, slow float + spin
 *   All other sections     : faded out (opacity → 0)
 */
const BODY_COLOR = 0x1a1e27; // matte gunmetal
const READOUT_W = 256;
const READOUT_H = 512; // tall so RepeatWrapping scroll tiles seamlessly

@Component({
  selector: 'app-data-shard',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgtArgs],
  template: `
    @if (isBrowser) {
      @if (shard(); as group) {
        <ngt-primitive *args="[group]" />
      }
    }
  `,
})
export class DataShardComponent {
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #scrollState = inject(ScrollStateService);

  readonly shard = signal<Group | null>(null);
  #group: Group | null = null;
  #readout: CanvasTexture | null = null;

  #opacity = 0;
  #elapsed = 0;

  constructor() {
    if (this.isBrowser) {
      this.#group = this.#buildShard();
      // Park off-screen initially (matches the old book's first-frame position).
      this.#group.position.set(-8, 0.5, -0.8);
      this.shard.set(this.#group);
    }

    beforeRender(({ delta }) => {
      if (!this.#group) return;

      this.#elapsed += delta;
      const section = this.#scrollState.activeSection();

      // Endless scrolling readout — UV offset only, no canvas re-raster.
      if (this.#readout) {
        this.#readout.offset.y = (this.#readout.offset.y + delta * 0.14) % 1;
      }

      // Visible only in the Experience section (index 2).
      const targetOpacity = section === 2 ? 1.0 : 0.0;
      this.#opacity += (targetOpacity - this.#opacity) * Math.min(delta * 2.5, 1);

      const t = this.#elapsed;
      this.#group.position.x = -2.2;
      this.#group.position.y = 0.3 + Math.sin(t * 0.9) * 0.1;
      this.#group.position.z = -1.5;
      this.#group.rotation.y += delta * 0.35;

      this.#applyOpacity(this.#group, this.#opacity);
    });
  }

  #buildShard(): Group {
    const group = new Group();

    const body = new Mesh(
      new RoundedBoxGeometry(1.3, 1.7, 0.14, 4, 0.06),
      new MeshStandardMaterial({ color: BODY_COLOR, roughness: 0.7, metalness: 0.8 }),
    );
    group.add(body);

    this.#readout = this.#buildReadoutTexture();
    const screen = new Mesh(
      new PlaneGeometry(1.05, 1.45),
      new MeshStandardMaterial({
        color: 0x05080e,
        map: this.#readout,
        emissive: 0xffffff, // emissiveMap * white ⇒ the canvas' own colours glow
        emissiveMap: this.#readout,
        emissiveIntensity: 1.3,
        roughness: 0.4,
        metalness: 0.0,
      }),
    );
    screen.position.z = 0.075; // just proud of the front face
    group.add(screen);

    return group;
  }

  /** Fake scrolling mission-log readout drawn once; scrolled via UV offset. */
  #buildReadoutTexture(): CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = READOUT_W;
    canvas.height = READOUT_H;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#05080e';
      ctx.fillRect(0, 0, READOUT_W, READOUT_H);

      const rowH = 22;
      const rows = READOUT_H / rowH; // integer ⇒ periodic, seamless wrap
      const hex = '0123456789ABCDEF';
      ctx.font = '13px monospace';
      ctx.textBaseline = 'middle';

      for (let r = 0; r < rows; r++) {
        const y = r * rowH + rowH / 2;
        // Occasional accent bar reads as a highlighted log entry.
        if (r % 6 === 0) {
          ctx.fillStyle = 'rgba(0,229,255,0.14)';
          ctx.fillRect(0, r * rowH, READOUT_W, rowH);
        }
        // Row index gutter (muted) + hex payload (cyan).
        ctx.fillStyle = '#39ff9d';
        ctx.fillText(((r * 4) % 256).toString(16).padStart(2, '0').toUpperCase(), 8, y);
        ctx.fillStyle = '#00e5ff';
        let line = '';
        for (let c = 0; c < 12; c++) {
          line += hex[(r * 7 + c * 3) % 16] + hex[(r * 5 + c * 2) % 16] + ' ';
        }
        ctx.fillText(line, 34, y);
      }
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapT = RepeatWrapping;
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }

  #applyOpacity(root: Group, opacity: number): void {
    root.traverse(obj => {
      if (!(obj instanceof Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats as MeshStandardMaterial[]) {
        mat.transparent = true;
        mat.opacity = opacity;
        mat.depthWrite = opacity > 0.5; // avoid z-fighting while fading
      }
    });
  }
}
