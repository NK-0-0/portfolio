import { Component, inject, signal, PLATFORM_ID, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { injectLoader, injectBeforeRender, NgtArgs } from 'angular-three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Mesh, MeshStandardMaterial, Object3D } from 'three';
import { ModelLoadingService } from '../../core/services/model-loading.service';
import { ScrollStateService } from '../../core/services/scroll-state.service';

/**
 * ANBU mask — the primary 3D focal element of the portfolio.
 *
 * Hero  (section 0): large, centred [0, 0.4, 2.0], scale 1.5, full opacity
 * About (section 1): smaller, right side [2.6, 1.5, -0.5], scale 0.7
 * Other sections   : ghost (opacity → 0.04), stays at About position
 *
 * All position, scale, and opacity transitions are lerped every frame.
 */
@Component({
  selector: 'app-mask',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgtArgs],
  template: `
    @if (isBrowser) {
      @if (gltf(); as model) {
        <ngt-primitive *args="[model.scene]" />
      }
    }
  `,
})
export class MaskComponent {
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #loading     = inject(ModelLoadingService);
  readonly #scrollState = inject(ScrollStateService);

  readonly gltf = this.isBrowser
    ? injectLoader(() => GLTFLoader, () => 'models/mask/anbu_kakashi_mask.glb')
    : signal(null);

  readonly #maskLoaded = signal(false);
  #scene: Object3D | null = null;

  // Interpolated state (plain fields — mutated each frame)
  #posX    = 0;
  #posY    = 0.4;
  #posZ    = 2.0;
  #scale   = 1.5;
  #opacity = 1.0;
  #elapsed = 0;

  constructor() {
    injectBeforeRender(({ delta }) => {
      if (!this.isBrowser) return;
      const model = this.gltf();
      if (!model) return;

      if (!this.#maskLoaded()) {
        this.#maskLoaded.set(true);
        this.#loading.markLoaded();
        this.#scene = model.scene;
        // Set initial transform — hero centred position
        this.#scene.position.set(this.#posX, this.#posY, this.#posZ);
        this.#scene.scale.setScalar(this.#scale);
      }

      if (!this.#scene) return;

      const section = this.#scrollState.activeSection();
      const lf = Math.min(delta * 2.2, 1); // lerp factor ~0.5 s transition

      // ── Target values per section ──────────────────────────────────────
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

      // ── Lerp position & scale ──────────────────────────────────────────
      this.#posX  += (tX - this.#posX)   * lf;
      this.#posZ  += (tZ - this.#posZ)   * lf;
      this.#scale += (tScale - this.#scale) * lf;

      // Float offset — smooth vertical bob
      this.#elapsed += delta;
      const floatY = Math.sin(this.#elapsed * 0.75) * 0.10;
      this.#posY   += (tY - this.#posY) * lf;

      this.#scene.position.set(this.#posX, this.#posY + floatY, this.#posZ);
      this.#scene.scale.setScalar(this.#scale);

      // Hero: slow oscillating rock so front face always faces viewer
      // Other: gentle continuous spin
      if (section === 0) {
        this.#scene.rotation.y = Math.sin(this.#elapsed * 0.5) * 0.45;
        this.#scene.rotation.x = Math.sin(this.#elapsed * 0.3) * 0.12;
      } else {
        this.#scene.rotation.x = 0;
        this.#scene.rotation.y += delta * 0.28;
      }

      // ── Lerp opacity ───────────────────────────────────────────────────
      this.#opacity += (tOpacity - this.#opacity) * Math.min(delta * 2.5, 1);

      this.#scene.traverse(obj => {
        if (!(obj instanceof Mesh)) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of mats as MeshStandardMaterial[]) {
          mat.transparent = true;
          mat.opacity     = this.#opacity;
        }
      });
    });
  }
}
