import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { JETTY } from '../../content/portfolio.content';

/** Panel 04 — how games shape the engineering, shown on the jetty. */
@Component({
  selector: 'app-jetty-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'panel panel--side',
    '[class.is-open]': 'open()',
    'data-panel': '4',
  },
  template: `
    <span class="eyebrow">{{ copy.eyebrow }}</span>
    <h2>{{ copy.heading }}</h2>
    <p>{{ copy.body }}</p>
    <ol class="principles">
      @for (principle of copy.principles; track principle; let i = $index) {
        <li>
          <span class="principles__index">{{ label(i) }}</span>
          <span class="principles__text">{{ principle }}</span>
        </li>
      }
    </ol>
    <p class="footnote">{{ copy.footnote }}</p>
  `,
  styles: `
    :host h2 {
      font-weight: 400;
      font-size: 30px;
    }
    :host > p:first-of-type {
      margin-bottom: 18px;
    }
    .principles {
      display: flex;
      flex-direction: column;
      gap: 9px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .principles li {
      display: flex;
      align-items: baseline;
      gap: 11px;
    }
    .principles__index {
      font-family: var(--font-pixel);
      font-size: 9px;
      color: var(--accent);
    }
    .principles__text {
      font-size: 14px;
      color: rgb(255 250 240 / 0.86);
    }
    .footnote {
      margin: 18px 0 0;
      font-size: 13px;
      color: rgb(255 250 240 / 0.5);
    }
  `,
})
export class JettyPanelComponent {
  readonly open = input.required<boolean>();
  protected readonly copy = JETTY;

  /** Zero-padded ordinal, matching the pixel-label style used elsewhere. */
  protected label(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}
