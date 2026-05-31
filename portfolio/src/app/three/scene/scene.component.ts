import { Component, inject, signal } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraphComponent } from './scene-graph.component';
import { SectionStore } from '../../core/services/section-store';
import { LoaderComponent } from '../../ui/loader/loader.component';
import { PanelComponent } from '../../ui/panel/panel.component';
import { HintComponent } from '../../ui/hint/hint.component';
import { FooterComponent } from '../../ui/footer/footer.component';

/**
 * Full 3D experience shell.
 *
 * The scene graph is projected into NgtCanvas via <ng-template canvasContent>,
 * which gives child components access to the NGT DI context (injectStore, etc.).
 *
 * Camera: fixed at [0, 1.5, 5] — no orbit controls in production.
 * Interaction (raycasting) lives inside SceneGraphComponent → InteractionComponent.
 */
@Component({
  selector: 'app-scene',
  standalone: true,
  imports: [
    ...NgtCanvas,           // spreads [NgtCanvasImpl, NgtCanvasContent]
    SceneGraphComponent,
    LoaderComponent,
    PanelComponent,
    HintComponent,
    FooterComponent,
  ],
  template: `
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
  protected readonly section = inject(SectionStore);

  readonly cameraConfig = { position: [0, 1.5, 5] as [number, number, number] };
  readonly glConfig     = { antialias: true, powerPreference: 'high-performance' as const };
  readonly isLoaded     = signal(true);
}
