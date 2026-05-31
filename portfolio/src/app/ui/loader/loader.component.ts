import { Component, computed, input } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Full-screen loading overlay.
 * Shown until both GLB assets report as loaded via ModelLoadingService.
 * Includes a real progress bar (0 → 100 %) and status text so users
 * always have feedback that something is happening.
 */
@Component({
  selector: 'app-loader',
  standalone: true,
  template: `
    @if (!isLoaded()) {
      <div class="loader" role="status" aria-live="polite" aria-label="Loading portfolio" @fadeOut>
        <div class="loader__inner">
          <p class="loader__title">KAKASHI</p>
          <p class="loader__subtitle">PORTFOLIO</p>

          <div class="loader__bar-track" role="progressbar"
               [attr.aria-valuenow]="progress()"
               aria-valuemin="0"
               aria-valuemax="100">
            <div class="loader__bar-fill" [style.width.%]="progress()"></div>
          </div>

          <p class="loader__status">{{ statusText() }}</p>
        </div>
      </div>
    }
  `,
  styleUrl: './loader.component.scss',
  animations: [
    trigger('fadeOut', [
      transition(':leave', [
        animate('700ms 200ms ease', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class LoaderComponent {
  readonly isLoaded = input.required<boolean>();
  readonly progress = input<number>(0);

  readonly statusText = computed(() => {
    const p = this.progress();
    if (p === 0)   return 'Summoning the Hidden Copy Ninja…';
    if (p < 50)    return 'Downloading character…';
    if (p < 100)   return 'Downloading ANBU mask…';
    return 'Ready.';
  });
}
