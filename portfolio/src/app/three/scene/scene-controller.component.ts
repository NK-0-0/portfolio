import {
  Component,
  PLATFORM_ID,
  OnDestroy,
  afterNextRender,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { injectBeforeRender, injectStore } from 'angular-three';
import { Color, FogExp2, PerspectiveCamera } from 'three';
import { ScrollStateService } from '../../core/services/scroll-state.service';

/** Fog hex per section (0 = hero … 5 = contact). */
const FOG_COLORS: Color[] = [
  new Color('#0d0d1a'), // hero    — deep dark navy
  new Color('#0a1a2e'), // about   — deep blue
  new Color('#1a0a2e'), // exp     — violet
  new Color('#0d1f1a'), // skills  — dark teal
  new Color('#1a1a0a'), // projects — dark amber
  new Color('#1a0d0d'), // contact — deep crimson
];

/** Camera Y target per section. */
const CAMERA_Y: number[] = [1.5, 1.2, 0.9, 1.6, 1.1, 0.7];

/**
 * Invisible scene-graph component.
 * Runs inside NgtCanvas — manages scene fog and camera parallax per section.
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

  constructor() {
    afterNextRender(() => {
      if (!this.#isBrowser) return;
      const scene = this.#store.snapshot.scene;
      scene.fog = new FogExp2(0x0d0d1a, 0.038);
    });

    injectBeforeRender(({ delta }) => {
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

  ngOnDestroy(): void {
    if (!this.#isBrowser) return;
    const scene = this.#store.snapshot.scene;
    scene.fog = null;
  }
}
