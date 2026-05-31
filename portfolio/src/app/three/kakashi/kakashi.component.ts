import {
  Component,
  inject,
  signal,
  PLATFORM_ID,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { injectLoader, injectBeforeRender, NgtArgs } from 'angular-three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Object3D } from 'three';
import { ModelLoadingService } from '../../core/services/model-loading.service';
import { environment } from '../../../environments/environment';

/**
 * Loads the Kakashi Hatake GLB and plays a gentle idle animation.
 * Position and rotation are driven entirely by injectBeforeRender —
 * no [position]/[rotation] bindings in the template to avoid conflicts.
 *
 * Idle motion:
 *  - Slow vertical bob (simulates breathing)
 *  - Slight left/right sway
 */
@Component({
  selector: 'app-kakashi',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgtArgs],
  template: `
    @if (isBrowser) {
      @if (gltf(); as model) {
        <ngt-primitive *args="[model.scene]" [scale]="[1, 1, 1]" />
      }
    }
  `,
})
export class KakashiComponent {
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #loading = inject(ModelLoadingService);

  readonly gltf = this.isBrowser
    ? injectLoader(() => GLTFLoader, () => 'models/kakashi/kakashi.glb')
    : signal(null);

  readonly loaded = signal(false);
  #scene: Object3D | null = null;

  constructor() {
    injectBeforeRender(({ clock }) => {
      const model = this.gltf();

      if (model && !this.loaded()) {
        this.loaded.set(true);
        this.#loading.markLoaded();
        this.#scene = model.scene;

        // Set initial transform once
        this.#scene.position.set(0, -1.5, 0);
        this.#scene.rotation.y = 0.15;

        if (environment.showDebugHelpers) {
          const names: string[] = [];
          model.scene.traverse((child: { name: string }) => {
            if (child.name) names.push(child.name);
          });
          console.log('[Kakashi] mesh names:', names);
        }
      }

      // Idle animation — runs every frame once model is available
      if (this.#scene) {
        const t = clock.elapsedTime;
        this.#scene.position.y = -1.5 + Math.sin(t * 0.7)  * 0.025;
        this.#scene.rotation.y =  0.15 + Math.sin(t * 0.25) * 0.04;
      }
    });
  }
}
