import { Component, inject, signal } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraphComponent } from './scene-graph.component';
import { SectionStore } from '../../core/services/section-store';
import { SECTIONS } from '../../core/models/section.types';
import { LoaderComponent } from '../../ui/loader/loader.component';
import { PanelComponent } from '../../ui/panel/panel.component';
import { HintComponent } from '../../ui/hint/hint.component';
import { FooterComponent } from '../../ui/footer/footer.component';

/**
 * Full 3D experience shell.
 *
 * Camera: fixed at [0, 1.5, 5] — no orbit controls in production.
 * Interaction (raycasting) lives inside SceneGraphComponent → InteractionComponent.
 *
 * The <nav class="sr-nav"> provides keyboard-accessible and testable section
 * navigation. It is visually hidden until focused, acting as a skip-nav bar.
 * This doubles as the hook E2E tests use to open panels without relying on
 * Three.js raycasting.
 */
@Component({
  selector: 'app-scene',
  standalone: true,
  imports: [
    ...NgtCanvas,
    SceneGraphComponent,
    LoaderComponent,
    PanelComponent,
    HintComponent,
    FooterComponent,
  ],
  template: `
    <!-- Skip-nav / accessible section buttons (also used by E2E tests) -->
    <nav class="sr-nav" aria-label="Portfolio sections">
      @for (s of sections; track s.id) {
        <button
          class="sr-nav__btn"
          [attr.data-section]="s.id"
          (click)="section.open(s.id)"
        >{{ s.label }}</button>
      }
    </nav>

    <ngt-canvas
      [camera]="cameraConfig"
      [gl]="glConfig"
      [shadows]="true"
    >
      <ng-template canvasContent>
        <app-scene-graph />
      </ng-template>
    </ngt-canvas>

    <app-loader [isLoaded]="isLoaded()" />
    <app-panel />
    <app-hint
      [hoveredSection]="section.hoveredSection()"
      [isPanelOpen]="section.isPanelOpen()"
    />
    <app-footer />
  `,
  styleUrl: './scene.component.scss',
})
export class SceneComponent {
  protected readonly section  = inject(SectionStore);
  protected readonly sections = SECTIONS;

  readonly cameraConfig = { position: [0, 1.5, 5] as [number, number, number] };
  readonly glConfig     = { antialias: true, powerPreference: 'high-performance' as const };
  readonly isLoaded     = signal(true);
}
