import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const TOTAL_ASSETS = 2; // Kakashi GLB + ANBU mask GLB
const TIMEOUT_MS   = 20_000; // Force-dismiss after 20 s if a model fails to load

/**
 * Tracks GLB download completion across KakashiComponent and MaskComponent.
 * SceneComponent reads allLoaded to know when to dismiss the loading screen.
 *
 * Uses a timeout fallback so the loader never blocks forever if a model 404s
 * or the network is very slow.
 */
@Injectable({ providedIn: 'root' })
export class ModelLoadingService {
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #loaded    = signal(0);

  readonly allLoaded = computed(() => this.#loaded() >= TOTAL_ASSETS);
  readonly progress  = computed(() =>
    Math.min(100, Math.round((this.#loaded() / TOTAL_ASSETS) * 100))
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
