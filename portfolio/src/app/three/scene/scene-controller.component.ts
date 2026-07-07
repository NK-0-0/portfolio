import {
  Component,
  PLATFORM_ID,
  OnDestroy,
  afterNextRender,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { beforeRender, injectStore } from 'angular-three';
import {
  Color,
  EquirectangularReflectionMapping,
  FogExp2,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { ScrollStateService } from '../../core/services/scroll-state.service';

/**
 * Fog hex per section (0 = hero … 5 = contact) — VISION.md beat-sheet, on the
 * consolidated cyan↔magenta identity axis (no other hue family owns a section).
 */
const FOG_COLORS: Color[] = [
  new Color('#0a0e18'), // hero     — near-black, faint cyan tint (void)
  new Color('#24cbff'), // about    — cyan blended ~20% toward magenta
  new Color('#b464ff'), // exp      — Signal Magenta, axis peak
  new Color('#1bd2ff'), // skills   — cyan, operational/practical end
  new Color('#9977ff'), // projects — cyan blended ~85% toward magenta
  new Color('#00ffcc'), // contact  — warm-shifted cyan (teal), replaces cut coral
];

/** Camera Y target per section. */
const CAMERA_Y: number[] = [1.5, 1.2, 0.9, 1.6, 1.1, 0.7];

/**
 * Invisible scene-graph component.
 * Runs inside NgtCanvas — sets scene-level state (fog + HDRI environment map for
 * image-based lighting) and lerps fog colour + camera parallax per section.
 */
@Component({
  selector: 'app-scene-controller',
  standalone: true,
  template: '',
})
export class SceneControllerComponent implements OnDestroy {
  readonly #isBrowser   = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #store       = injectStore();
  readonly #scrollState = inject(ScrollStateService);

  #envRenderTarget: WebGLRenderTarget | null = null;
  #destroyed = false;

  constructor() {
    afterNextRender(() => {
      if (!this.#isBrowser) return;
      const { scene, gl } = this.#store.snapshot;
      scene.fog = new FogExp2(0x0a0e18, 0.038);
      this.#loadEnvironment(scene, gl);
    });

    beforeRender(({ delta }) => {
      if (!this.#isBrowser) return;

      const section = this.#scrollState.activeSection();
      const snap    = this.#store.snapshot;

      // ── Fog colour lerp ────────────────────────────────────────────────
      const fog = snap.scene.fog as FogExp2 | null;
      if (fog) {
        fog.color.lerp(FOG_COLORS[section], Math.min(delta * 1.8, 1));
      }

      // ── Camera Y parallax lerp ─────────────────────────────────────────
      const camera = snap.camera as PerspectiveCamera;
      const targetY = CAMERA_Y[section];
      camera.position.y += (targetY - camera.position.y) * Math.min(delta * 2.5, 1);
    });
  }

  /**
   * Generate a PMREM environment map from the CC0 night-sky HDRI and assign it
   * as `scene.environment` for image-based lighting. Loads via `HDRLoader`
   * (the non-deprecated successor to `RGBELoader` in three@0.182), which is a
   * plain texture fetch — deliberately NOT counted by `ModelLoadingService`'s
   * GLB gate, so `TOTAL_ASSETS` stays 0.
   */
  #loadEnvironment(scene: Scene, gl: WebGLRenderer): void {
    const pmrem = new PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();

    // Relative path (no leading slash) resolves against <base href> — /portfolio/ in prod.
    new HDRLoader().load('env/night-sky.hdr', (texture) => {
      if (this.#destroyed) {
        texture.dispose();
        pmrem.dispose();
        return;
      }
      texture.mapping = EquirectangularReflectionMapping;
      this.#envRenderTarget = pmrem.fromEquirectangular(texture);
      scene.environment = this.#envRenderTarget.texture;
      texture.dispose();
      pmrem.dispose();
    });
  }

  ngOnDestroy(): void {
    this.#destroyed = true;
    if (!this.#isBrowser) return;
    const scene = this.#store.snapshot.scene;
    scene.fog = null;
    scene.environment = null;
    this.#envRenderTarget?.dispose();
    this.#envRenderTarget = null;
  }
}
