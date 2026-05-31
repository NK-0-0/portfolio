import { Component, input } from '@angular/core';
import { UpperCasePipe } from '@angular/common';

/**
 * Small contextual hint overlay.
 * Shows "Hover Kakashi to explore" when nothing is hovered and the panel
 * is closed, or the name of the hovered section when a hotspot is active.
 * Fades in/out via CSS transition instead of Angular animations.
 */
@Component({
  selector: 'app-hint',
  standalone: true,
  template: `
    <div class="hint" [class.hint--visible]="!isPanelOpen()">
      @if (hoveredSection()) {
        <span class="active">{{ hoveredSection() | uppercase }} →</span>
      } @else {
        <span class="idle">Hover Kakashi to explore</span>
      }
    </div>
  `,
  styleUrl: './hint.component.scss',
  imports: [UpperCasePipe],
})
export class HintComponent {
  readonly hoveredSection = input<string | null>(null);
  readonly isPanelOpen    = input<boolean>(false);
}
