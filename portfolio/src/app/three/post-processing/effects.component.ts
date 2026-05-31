import {
  Component,
  OnDestroy,
  PLATFORM_ID,
  inject,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { addAfterEffect, injectStore } from 'angular-three';
import { SectionStore } from '../../core/services/section-store';
import { Color, Vector2 } from 'three';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * Post-processing overlay using Three.js built-in EffectComposer.
 *
 * Uses `addAfterEffect` to run the EffectComposer AFTER the default NGT render
 * each frame, overwriting it with the outlined + bloomed output.
 * The default NGT render is redundant but harmless — acceptable for a portfolio.
 *
 * OutlinePass reads `SectionStore.hoveredMeshes` every frame to highlight
 * whatever the InteractionComponent has detected under the cursor.
 */
@Component({
  selector: 'app-effects',
  standalone: true,
  template: '',
})
export class EffectsComponent implements OnDestroy {
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #store     = injectStore();
  readonly #section   = inject(SectionStore);

  #composer: EffectComposer | null = null;
  #outlinePass: OutlinePass | null = null;
  #cleanupAfterEffect?: () => void;
  #cleanupResize?: () => void;

  constructor() {
    if (!this.#isBrowser) return;

    afterNextRender(() => {
      const { gl, scene, camera, size } = this.#store.snapshot;
      const w = size.width;
      const h = size.height;
      const res = new Vector2(w, h);

      this.#composer = new EffectComposer(gl);
      this.#composer.addPass(new RenderPass(scene, camera));

      this.#outlinePass = new OutlinePass(res, scene, camera);
      this.#outlinePass.visibleEdgeColor = new Color('#00e5ff');
      this.#outlinePass.hiddenEdgeColor  = new Color('#003344');
      this.#outlinePass.edgeStrength     = 6;
      this.#outlinePass.edgeGlow         = 0.6;
      this.#outlinePass.pulsePeriod      = 3;
      this.#composer.addPass(this.#outlinePass);

      this.#composer.addPass(new UnrealBloomPass(new Vector2(512, 512), 0.35, 0.5, 0.85));
      this.#composer.addPass(new OutputPass());

      this.#cleanupAfterEffect = addAfterEffect(() => {
        const outline = this.#outlinePass;
        if (outline) outline.selectedObjects = this.#section.hoveredMeshes;
        this.#composer!.render();
      });

      const onResize = (): void => {
        const nw = window.innerWidth;
        const nh = window.innerHeight;
        gl.setSize(nw, nh);
        this.#composer!.setSize(nw, nh);
      };
      window.addEventListener('resize', onResize);
      this.#cleanupResize = () => window.removeEventListener('resize', onResize);
    });
  }

  ngOnDestroy(): void {
    this.#cleanupAfterEffect?.();
    this.#cleanupResize?.();
    this.#composer?.dispose();
  }
}
