import { Component, inject } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraphComponent }   from './scene-graph.component';
import { ModelLoadingService }   from '../../core/services/model-loading.service';
import { ScrollLayoutComponent } from '../../ui/scroll-layout/scroll-layout.component';
import { LoaderComponent }       from '../../ui/loader/loader.component';
import { FooterComponent }       from '../../ui/footer/footer.component';
import { SECTIONS }              from '../../core/models/section.types';

/**
 * Outer shell for the 3D experience.
 *
 * Layout:
 *  - .canvas-bg  (position:fixed)  — Three.js canvas, always behind content
 *  - app-scroll-layout             — scrollable content layer over the canvas
 *  - app-loader                    — full-screen loading overlay (z-index above all)
 *  - app-footer                    — fixed attribution footer
 *  - .sr-nav                       — visually hidden skip-nav (keyboard / E2E)
 */
@Component({
  selector: 'app-scene',
  standalone: true,
  imports: [
    ...NgtCanvas,
    SceneGraphComponent,
    ScrollLayoutComponent,
    LoaderComponent,
    FooterComponent,
  ],
  template: `
    <!-- Skip-nav: visually hidden until focused; E2E hook via data-section -->
    <nav class="sr-nav" aria-label="Portfolio sections">
      @for (s of sections; track s.id) {
        <button
          class="sr-nav__btn"
          [attr.data-section]="s.id"
          (click)="scrollTo(s.id)"
        >{{ s.label }}</button>
      }
    </nav>

    <!-- Fixed 3D background -->
    <div class="canvas-bg">
      <ngt-canvas
        [camera]="cameraConfig"
        [gl]="glConfig"
        [shadows]="true"
      >
        <ng-template canvasContent>
          <app-scene-graph />
        </ng-template>
      </ngt-canvas>
    </div>

    <!-- Scrollable content over the canvas -->
    <app-scroll-layout />

    <!-- Loading overlay + footer -->
    <app-loader [isLoaded]="loading.allLoaded()" [progress]="loading.progress()" />
    <app-footer />
  `,
  styleUrl: './scene.component.scss',
})
export class SceneComponent {
  protected readonly loading  = inject(ModelLoadingService);
  protected readonly sections = SECTIONS;

  readonly cameraConfig = { position: [0, 1.5, 5] as [number, number, number] };
  readonly glConfig     = { antialias: true, powerPreference: 'high-performance' as const };

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
