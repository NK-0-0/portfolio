import { Component, inject, signal, PLATFORM_ID, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { injectLoader, injectBeforeRender, NgtArgs } from 'angular-three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Object3D } from 'three';
import { ModelLoadingService } from '../../core/services/model-loading.service';

export const MASK_OBJECT_NAME = 'anbu_mask_root';

/**
 * Standalone floating ANBU mask — a separate GLB that orbits near Kakashi.
 * Reports to ModelLoadingService when its download completes.
 * Uses injectBeforeRender (not effect()) to avoid allowSignalWrites issues.
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
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly maskObjectName = MASK_OBJECT_NAME;
  readonly #loading = inject(ModelLoadingService);

  readonly gltf = this.isBrowser
    ? injectLoader(() => GLTFLoader, () => 'models/mask/anbu_kakashi_mask.glb')
    : signal(null);

  readonly #maskLoaded = signal(false);
  #maskScene: Object3D | null = null;
  #elapsed = 0;

  constructor() {
    injectBeforeRender(({ delta }) => {
      if (!this.isBrowser) return;
      const model = this.gltf();
      if (!model) return;

      // Report loaded on first frame the model is available.
      if (!this.#maskLoaded()) {
        this.#maskLoaded.set(true);
        this.#loading.markLoaded();
      }

      if (!this.#maskScene) this.#maskScene = model.scene;
      const sceneNode = this.#maskScene;
      if (!sceneNode) return;

      this.#elapsed += delta;
      sceneNode.rotation.y = sceneNode.rotation.y + delta * 0.4;
      sceneNode.position.y = 1.8 + Math.sin(this.#elapsed * 0.8) * 0.15;
    });
  }
}
