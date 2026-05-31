import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class DeviceCapabilityService {
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly is3DSupported = signal(false);

  constructor() {
    if (this.#isBrowser) {
      this.is3DSupported.set(this.#checkWebGL() && !this.#isMobileDevice());
    }
  }

  #checkWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      return false;
    }
  }

  #isMobileDevice(): boolean {
    return window.innerWidth < 768 || 'ontouchstart' in window;
  }
}
