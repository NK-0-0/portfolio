import { Component, inject } from '@angular/core';
import { DeviceCapabilityService } from './core/services/device-capability';
import { SceneComponent } from './three/scene/scene.component';
import { FallbackComponent } from './ui/fallback/fallback.component';

/**
 * Root component. Switches between the 3D experience (SceneComponent)
 * and the 2D fallback (FallbackComponent) based on device capability.
 *
 * Both branches live in @defer blocks so Angular's build system splits
 * them into separate lazy chunks. Three.js (~600kB) only downloads
 * when the browser can actually render WebGL.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SceneComponent, FallbackComponent],
  template: `
    @if (capability.is3DSupported()) {
      @defer (on immediate) {
        <app-scene />
      } @loading {
        <div class="bootstrap-loading" aria-hidden="true"></div>
      }
    } @else {
      @defer (on immediate) {
        <app-fallback />
      } @loading {
        <div class="bootstrap-loading" aria-hidden="true"></div>
      }
    }
  `,
  styleUrl: './app.scss',
})
export class App {
  protected readonly capability = inject(DeviceCapabilityService);
}
