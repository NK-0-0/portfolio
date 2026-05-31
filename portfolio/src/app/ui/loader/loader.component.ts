import { Component, computed, input } from '@angular/core';

/**
 * Full-screen loading overlay.
 * Shown until both GLB assets report as loaded via ModelLoadingService.
 * Fades out via CSS transition when isLoaded() becomes true.
 */
@Component({
  selector: 'app-loader',
  standalone: true,
  template: `
    <div
      class="loader"
      [class.loader--done]="isLoaded()"
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
      [attr.aria-hidden]="isLoaded()"
    >
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
  `,
  styleUrl: './loader.component.scss',
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
