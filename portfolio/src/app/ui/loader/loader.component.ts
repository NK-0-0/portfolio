import { Component, input } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Full-screen loading overlay shown while the GLB models fetch.
 * Fades out once `isLoaded` becomes true.
 */
@Component({
  selector: 'app-loader',
  standalone: true,
  template: `
    @if (!isLoaded()) {
      <div class="loader" @fadeOut>
        <div class="spinner" aria-hidden="true"></div>
        <p class="message">Loading experience<span class="dots">...</span></p>
      </div>
    }
  `,
  styleUrl: './loader.component.scss',
  animations: [
    trigger('fadeOut', [
      transition(':leave', [
        animate('600ms ease', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class LoaderComponent {
  readonly isLoaded = input.required<boolean>();
}
