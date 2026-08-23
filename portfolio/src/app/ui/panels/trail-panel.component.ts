import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EDUCATION, EXPERIENCE, TRAIL, type TimelineEntry } from '../../content/portfolio.content';

/** Panel 03 — work and study history, shown at the signpost. */
@Component({
  selector: 'app-trail-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'panel panel--side',
    '[class.is-open]': 'open()',
    'data-panel': '3',
  },
  template: `
    <div class="head">
      <span class="eyebrow">{{ copy.eyebrow }}</span>
      <span class="meta">{{ copy.meta }}</span>
    </div>
    <h2>{{ copy.heading }}</h2>

    <section class="group">
      <span class="group__label">EXPERIENCE</span>
      @for (entry of experience; track entry.period) {
        <div class="entry">
          <span class="entry__period">{{ entry.period }}</span>
          <span class="entry__body">
            <span class="entry__role">{{ entry.role }}</span>
            @if (entry.detail) {
              <span class="entry__detail">{{ entry.detail }}</span>
            }
          </span>
        </div>
      }
    </section>

    <hr class="divider" />

    <section class="group">
      <span class="group__label">EDUCATION</span>
      @for (entry of education; track entry.period) {
        <div class="entry entry--study">
          <span class="entry__period">{{ entry.period }}</span>
          <span class="entry__body">
            <span class="entry__role">{{ entry.role }}</span>
            @if (entry.detail) {
              <span class="entry__detail">{{ entry.detail }}</span>
            }
          </span>
        </div>
      }
    </section>
  `,
  styleUrl: './trail-panel.component.scss',
})
export class TrailPanelComponent {
  readonly open = input.required<boolean>();
  protected readonly copy = TRAIL;
  protected readonly experience: readonly TimelineEntry[] = EXPERIENCE;
  protected readonly education: readonly TimelineEntry[] = EDUCATION;
}
