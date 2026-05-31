import { Component, inject, signal, PLATFORM_ID, CUSTOM_ELEMENTS_SCHEMA, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { injectLoader, injectBeforeRender, NgtArgs } from 'angular-three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ModelLoadingService } from '../../core/services/model-loading.service';
import { environment } from '../../../environments/environment';

/**
 * Loads the Kakashi Hatake GLB and displays it via ngt-primitive.
 * Reports to ModelLoadingService when the download completes so the
 * loading screen can dismiss at the right time.
 *
 * ── HOTSPOT MESH NAMES — UPDATE BEFORE SHIPPING ──────────────────────
 * 1. Run `npm start`, open DevTools console.
 * 2. Look for the "[Kakashi] mesh names:" log (dev mode only).
 * 3. Identify which names match the face, book, kunai, headband.
 * 4. Update HOTSPOT_MAP in interaction.component.ts with those names.
 * ─────────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-kakashi',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgtArgs],
  template: `
    @if (isBrowser) {
      @if (gltf(); as model) {
        <ngt-primitive
          *args="[model.scene]"
          [position]="[0, -1.5, 0]"
          [scale]="[1, 1, 1]"
          [rotation]="[0, 0.15, 0]"
        />
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

  constructor() {
    // Report to the loading service as soon as the GLB signal is non-null.
    effect(() => {
      const model = this.gltf();
      if (model && !this.loaded()) {
        this.loaded.set(true);
        this.#loading.markLoaded();

        if (environment.showDebugHelpers) {
          const names: string[] = [];
          model.scene.traverse((child: { name: string }) => {
            if (child.name) names.push(child.name);
          });
          console.log('[Kakashi] mesh names (update HOTSPOT_MAP with these):', names);
        }
      }
    });
  }
}
