import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const TOTAL_ASSETS = 0; // All live props are procedural (HUD-core, data-shard, drone) — no GLBs
const TIMEOUT_MS   = 20_000; // Force-dismiss after 20 s if a model fails to load

/**
 * Tracks GLB download completion across the live scene's loaded models.
 * The live scene graph now renders three fully procedural props (HUD-core,
 * data-shard, drone) and loads zero GLBs, so TOTAL_ASSETS is 0 and the loader
 * dismisses immediately. SceneComponent reads allLoaded to know when to dismiss
 * the loading screen; the counter/timeout are retained so re-introducing a GLB
 * prop is a one-line TOTAL_ASSETS change, not a service rewrite.
 */
@Injectable({ providedIn: 'root' })
export class ModelLoadingService {
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #loaded    = signal(0);

  readonly allLoaded = computed(() => this.#loaded() >= TOTAL_ASSETS);
  readonly progress  = computed(() =>
    // Guard against 0/0 ⇒ NaN when there are no GLB assets to track.
    TOTAL_ASSETS === 0 ? 100 : Math.min(100, Math.round((this.#loaded() / TOTAL_ASSETS) * 100))
  );

  constructor() {
    if (!this.#isBrowser) {
      // Pre-render / server context — no models will ever load; skip loader.
      this.#loaded.set(TOTAL_ASSETS);
      return;
    }
    // Safety net: dismiss after timeout so users are never permanently blocked.
    setTimeout(() => this.#loaded.set(TOTAL_ASSETS), TIMEOUT_MS);
  }

  markLoaded(): void {
    this.#loaded.update(n => Math.min(n + 1, TOTAL_ASSETS));
  }
}
