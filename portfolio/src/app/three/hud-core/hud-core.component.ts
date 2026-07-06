import { Component, inject, signal, PLATFORM_ID, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { beforeRender, NgtArgs } from 'angular-three';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  IcosahedronGeometry,
  TorusGeometry,
} from 'three';
import { ScrollStateService } from '../../core/services/scroll-state.service';

/**
 * HUD-core — the primary 3D focal element (procedural, no GLB).
 *
 * The primary focal prop. A near-black faceted "glass artifact" core with two
 * thin emissive rings that read as visible circuitry (Signal Ghost direction).
 *
 * Per FR-3, the emissive channel lives ONLY on the thin overlay rings; the body
 * material carries no emissive at all (no full-surface glow). Keeping the two
 * material families in separate `#build*` helpers makes that split mechanically
 * verifiable, not just a visual read.
 *
 * Motion is a like-for-like copy of the old mask's per-section lerp targets so
 * the swap changes *what* renders, not *when/where* it moves:
 *   Hero  (section 0): large, right of hero copy, slow oscillating rock
 *   About (section 1): badge-size, right side
 *   Other sections   : ghost (opacity → 0.04), gentle continuous spin
 */
const BASE_COLOR = 0x14161d;
const ACCENT_CYAN = 0x00e5ff;
const ACCENT_MAGENTA = 0xb464ff;
const EMISSIVE_INTENSITY = 1.5; // FR-3 range 1.2–1.8

@Component({
  selector: 'app-hud-core',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgtArgs],
  template: `
    @if (isBrowser) {
      @if (core(); as group) {
        <ngt-primitive *args="[group]" />
      }
    }
  `,
})
export class HudCoreComponent {
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #scrollState = inject(ScrollStateService);

  readonly core = signal<Group | null>(null);
  #group: Group | null = null;

  // Interpolated state (plain fields — mutated each frame). Initial values match
  // the old mask so the intro lerp into the hero pose is identical.
  #posX = 0;
  #posY = 0.4;
  #posZ = 2.0;
  #scale = 1.5;
  #opacity = 1.0;
  #elapsed = 0;

  constructor() {
    if (this.isBrowser) {
      this.#group = this.#buildCore();
      this.#group.position.set(this.#posX, this.#posY, this.#posZ);
      this.#group.scale.setScalar(this.#scale);
      this.core.set(this.#group);
    }

    beforeRender(({ delta }) => {
      if (!this.#group) return;

      const section = this.#scrollState.activeSection();
      const lf = Math.min(delta * 2.2, 1); // lerp factor ~0.5 s transition

      let tX: number, tY: number, tZ: number, tScale: number, tOpacity: number;

      if (section === 0) {
        // Hero: right of text, close — clear negative space beside hero copy
        tX = 2.2;  tY = 0.3;  tZ = 1.6;
        tScale   = 1.4;
        tOpacity = 1.0;
      } else if (section === 1) {
        // About: medium, right side
        tX = 2.6;  tY = 1.4;  tZ = -0.5;
        tScale   = 0.72;
        tOpacity = 1.0;
      } else {
        // Other: ghost at About position
        tX = 2.6;  tY = 1.4;  tZ = -0.5;
        tScale   = 0.72;
        tOpacity = 0.04;
      }

      this.#posX  += (tX - this.#posX)   * lf;
      this.#posZ  += (tZ - this.#posZ)   * lf;
      this.#scale += (tScale - this.#scale) * lf;

      this.#elapsed += delta;
      const floatY = Math.sin(this.#elapsed * 0.75) * 0.10;
      this.#posY   += (tY - this.#posY) * lf;

      this.#group.position.set(this.#posX, this.#posY + floatY, this.#posZ);
      this.#group.scale.setScalar(this.#scale);

      if (section === 0) {
        this.#group.rotation.y = Math.sin(this.#elapsed * 0.5) * 0.45;
        this.#group.rotation.x = Math.sin(this.#elapsed * 0.3) * 0.12;
      } else {
        this.#group.rotation.x = 0;
        this.#group.rotation.y += delta * 0.28;
      }

      this.#opacity += (tOpacity - this.#opacity) * Math.min(delta * 2.5, 1);
      this.#applyOpacity(this.#group, this.#opacity);
    });
  }

  /** Faceted near-black core — no emissive (FR-3: no full-surface glow). */
  #buildBody(): Mesh {
    const geometry = new IcosahedronGeometry(0.85, 0);
    const material = new MeshStandardMaterial({
      color: BASE_COLOR,
      roughness: 0.15,
      metalness: 0.25,
    });
    return new Mesh(geometry, material);
  }

  /** Thin emissive overlay ring — the only place emissive lives on this prop. */
  #buildRing(radius: number, tube: number, emissive: number): Mesh {
    const geometry = new TorusGeometry(radius, tube, 8, 96);
    const material = new MeshStandardMaterial({
      color: BASE_COLOR,
      emissive,
      emissiveIntensity: EMISSIVE_INTENSITY,
      roughness: 0.4,
      metalness: 0.0,
    });
    return new Mesh(geometry, material);
  }

  #buildCore(): Group {
    const group = new Group();
    group.add(this.#buildBody());

    const cyanRing = this.#buildRing(0.98, 0.02, ACCENT_CYAN);
    cyanRing.rotation.x = Math.PI / 2;
    group.add(cyanRing);

    const magentaRing = this.#buildRing(1.08, 0.018, ACCENT_MAGENTA);
    magentaRing.rotation.y = Math.PI / 2.4;
    group.add(magentaRing);

    return group;
  }

  #applyOpacity(root: Group, opacity: number): void {
    root.traverse(obj => {
      if (!(obj instanceof Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats as MeshStandardMaterial[]) {
        mat.transparent = true;
        mat.opacity = opacity;
      }
    });
  }
}
