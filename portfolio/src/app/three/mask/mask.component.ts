import { Component, inject, signal, PLATFORM_ID, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { injectLoader, injectBeforeRender, NgtArgs } from 'angular-three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Mesh, MeshStandardMaterial, Object3D } from 'three';
import { ModelLoadingService } from '../../core/services/model-loading.service';
import { ScrollStateService } from '../../core/services/scroll-state.service';

export const MASK_OBJECT_NAME = 'anbu_mask_root';

/**
 * Floating ANBU mask. Prominent on the About section (AS=1),
 * fades to a dim ghost on all other sections.
 */
@Component({
  selector: 'app-mask',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgtArgs],
  template: `
    @if (isBrowser) {
      @if (gltf(); as model) {
        <ngt-primitive
          *args="[model.scene]"
          [name]="maskObjectName"
          [position]="[2.2, 1.8, -1.0]"
          [scale]="[0.8, 0.8, 0.8]"
        />
      }
    }
  `,
})
export class MaskComponent {
  protected readonly isBrowser     = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly maskObjectName = MASK_OBJECT_NAME;
  readonly #loading     = inject(ModelLoadingService);
  readonly #scrollState = inject(ScrollStateService);

  readonly gltf = this.isBrowser
    ? injectLoader(() => GLTFLoader, () => 'models/mask/anbu_kakashi_mask.glb')
    : signal(null);

  readonly #maskLoaded = signal(false);
  #maskScene: Object3D | null = null;
  #elapsed  = 0;
  #opacity  = 1;

  constructor() {
    injectBeforeRender(({ delta }) => {
      if (!this.isBrowser) return;
      const model = this.gltf();
      if (!model) return;

      if (!this.#maskLoaded()) {
        this.#maskLoaded.set(true);
        this.#loading.markLoaded();
      }

      if (!this.#maskScene) this.#maskScene = model.scene;
      const node = this.#maskScene;
      if (!node) return;

      // Float animation
      this.#elapsed += delta;
      node.rotation.y += delta * 0.4;
      node.position.y  = 1.8 + Math.sin(this.#elapsed * 0.8) * 0.15;

      // Opacity: full on About (section 1), ghost (0.06) elsewhere
      const targetOpacity = this.#scrollState.activeSection() === 1 ? 1.0 : 0.06;
      this.#opacity += (targetOpacity - this.#opacity) * Math.min(delta * 2.5, 1);

      node.traverse(obj => {
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
