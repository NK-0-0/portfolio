import { Component, input } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Small contextual hint overlay.
 * Shows "Hover Kakashi to explore" when nothing is hovered and the panel
 * is closed, or the name of the hovered section when a hotspot is active.
 */
@Component({
  selector: 'app-hint',
  standalone: true,
  template: `
    @if (!isPanelOpen()) {
      <div class="hint" @fadeInOut>
        @if (hoveredSection()) {
          <span class="active">{{ hoveredSection() | uppercase }} →</span>
        } @else {
          <span class="idle">Hover Kakashi to explore</span>
        }
      </div>
    }
  `,
  styleUrl: './hint.component.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(6px)' }),
        animate('300ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease', style({ opacity: 0 })),
      ]),
    ]),
  ],
  imports: [UpperCasePipe],
})
export class HintComponent {
  readonly hoveredSection = input<string | null>(null);
  readonly isPanelOpen    = input<boolean>(false);
}
