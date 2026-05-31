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
import { ScrollStateService } from '../../core/services/scroll-state.service';
import { environment } from '../../../environments/environment';

/** Target X position per section (0=hero … 5=contact).
 *  Left-card sections: Kakashi moves screen-right (+x).
 *  Right-card sections: Kakashi moves screen-left  (-x).  */
const KAKASHI_X: number[] = [0, 1.8, -1.8, 1.8, -1.8, 1.8];

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
  readonly #loading     = inject(ModelLoadingService);
  readonly #scrollState = inject(ScrollStateService);

  readonly gltf = this.isBrowser
    ? injectLoader(() => GLTFLoader, () => 'models/kakashi/kakashi.glb')
    : signal(null);

  readonly loaded = signal(false);
  #scene: Object3D | null = null;

  constructor() {
    injectBeforeRender(({ clock, delta }) => {
      const model = this.gltf();

      if (model && !this.loaded()) {
        this.loaded.set(true);
        this.#loading.markLoaded();
        this.#scene = model.scene;
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

      if (this.#scene) {
        const t = clock.elapsedTime;

        // Idle: breathing bob + sway
        this.#scene.position.y = -1.5 + Math.sin(t * 0.7)  * 0.025;
        this.#scene.rotation.y =  0.15 + Math.sin(t * 0.25) * 0.04;

        // Scroll-driven: smooth lateral shift per section
        const targetX = KAKASHI_X[this.#scrollState.activeSection()];
        this.#scene.position.x += (targetX - this.#scene.position.x)
          * Math.min(delta * 2.2, 1);
      }
    });
  }
}
