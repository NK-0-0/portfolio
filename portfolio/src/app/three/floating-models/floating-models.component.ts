import { Component, inject, signal, PLATFORM_ID, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { injectLoader, injectBeforeRender, NgtArgs } from 'angular-three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Mesh, MeshStandardMaterial, Object3D } from 'three';
import { ModelLoadingService } from '../../core/services/model-loading.service';
import { ScrollStateService } from '../../core/services/scroll-state.service';

/**
 * Per-section floating props alongside the section cards.
 *
 *  Section 2 (Experience) → Icha Icha book — left side
 *  Section 3 (Skills)     → Kunai           — right side
 *  Section 4 (Projects)   → Kunai           — left side
 *
 *  Models fade in/out by lerping material opacity.
 *  Position animates to a resting spot + gentle float.
 */
@Component({
  selector: 'app-floating-models',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgtArgs],
  template: `
    @if (isBrowser) {
      @if (bookGltf(); as book) {
        <ngt-primitive *args="[book.scene]" [scale]="[0.3, 0.3, 0.3]" />
      }
      @if (kunaiGltf(); as kunai) {
        <ngt-primitive *args="[kunai.scene]" [scale]="[0.9, 0.9, 0.9]" />
      }
    }
  `,
})
export class FloatingModelsComponent {
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #loading     = inject(ModelLoadingService);
  readonly #scrollState = inject(ScrollStateService);

  readonly bookGltf = this.isBrowser
    ? injectLoader(() => GLTFLoader, () => 'models/book/icha_icha.glb')
    : signal(null);

  readonly kunaiGltf = this.isBrowser
    ? injectLoader(() => GLTFLoader, () => 'models/kunai/kunai_do_minato_namikaze.glb')
    : signal(null);

  // ── Load tracking ──────────────────────────────────────────────────────────
  readonly #bookLoaded  = signal(false);
  readonly #kunaiLoaded = signal(false);

  // ── Scene object refs ──────────────────────────────────────────────────────
  #bookScene:  Object3D | null = null;
  #kunaiScene: Object3D | null = null;

  // ── Interpolated opacity values (plain fields — mutated every frame) ───────
  #bookOpacity  = 0;
  #kunaiOpacity = 0;

  // ── Elapsed time for float animation ──────────────────────────────────────
  #elapsed = 0;

  constructor() {
    injectBeforeRender(({ delta }) => {
      if (!this.isBrowser) return;

      this.#elapsed += delta;
      const section = this.#scrollState.activeSection();

      // ── Book (Icha Icha) ────────────────────────────────────────────────
      const bookModel = this.bookGltf();
      if (bookModel) {
        if (!this.#bookLoaded()) {
          this.#bookLoaded.set(true);
          this.#loading.markLoaded();
          this.#bookScene = bookModel.scene;
          // Park off-screen initially
          this.#bookScene.position.set(-8, 0.5, -0.8);
        }

        if (this.#bookScene) {
          const targetOpacity = section === 2 ? 1.0 : 0.0;
          this.#bookOpacity += (targetOpacity - this.#bookOpacity) * Math.min(delta * 2.5, 1);

          // Idle float + slow spin
          const t = this.#elapsed;
          this.#bookScene.position.x = -2.2;
          this.#bookScene.position.y = 0.3 + Math.sin(t * 0.9) * 0.10;
          this.#bookScene.position.z = -1.5;
          this.#bookScene.rotation.y += delta * 0.35;

          this.#applyOpacity(this.#bookScene, this.#bookOpacity);
        }
      }

      // ── Kunai ────────────────────────────────────────────────────────────
      const kunaiModel = this.kunaiGltf();
      if (kunaiModel) {
        if (!this.#kunaiLoaded()) {
          this.#kunaiLoaded.set(true);
          this.#loading.markLoaded();
          this.#kunaiScene = kunaiModel.scene;
          this.#kunaiScene.position.set(8, 2.0, -1.5);
        }

        if (this.#kunaiScene) {
          const targetOpacity = (section === 3 || section === 4) ? 1.0 : 0.0;
          this.#kunaiOpacity += (targetOpacity - this.#kunaiOpacity) * Math.min(delta * 2.5, 1);

          // Kunai hovers on right for Skills, left for Projects
          const targetX = section === 4 ? -2.2 : 2.8;
          this.#kunaiScene.position.x +=
            (targetX - this.#kunaiScene.position.x) * Math.min(delta * 3, 1);

          const t = this.#elapsed;
          this.#kunaiScene.position.y = 2.0 + Math.sin(t * 1.1) * 0.14;
          this.#kunaiScene.position.z = -1.5;
          this.#kunaiScene.rotation.z += delta * 0.5; // spinning kunai

          this.#applyOpacity(this.#kunaiScene, this.#kunaiOpacity);
        }
      }
    });
  }

  /** Traverse all meshes and set material opacity. */
  #applyOpacity(root: Object3D, opacity: number): void {
    root.traverse(obj => {
      if (!(obj instanceof Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats as MeshStandardMaterial[]) {
        mat.transparent = true;
        mat.opacity     = opacity;
        mat.depthWrite  = opacity > 0.5; // avoid z-fighting when fading
      }
    });
  }
}
