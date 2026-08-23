import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CAMPFIRE } from '../../content/portfolio.content';

/** Panel 05 — contact, shown at the campfire. */
@Component({
  selector: 'app-campfire-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'panel panel--side panel--warm',
    '[class.is-open]': 'open()',
    'data-panel': '5',
  },
  template: `
    <span class="eyebrow">{{ copy.eyebrow }}</span>
    <h2>{{ copy.heading }}</h2>
    <p>{{ copy.body }}</p>
    <div class="links">
      @for (link of copy.links; track link.label) {
        <a
          class="btn"
          [class.btn--primary]="link.primary"
          [href]="link.href"
          rel="noopener noreferrer"
          >{{ link.label }}</a
        >
      }
    </div>
    <p class="footnote">{{ copy.footnote }}</p>
  `,
  styles: `
    :host {
      border-color: rgb(255 217 138 / 0.28);
      background: linear-gradient(180deg, rgb(14 20 30 / 0.76), rgb(10 16 26 / 0.7));
      box-shadow: 0 20px 50px rgb(4 12 18 / 0.5);
    }
    :host h2 {
      font-size: 34px;
    }
    :host > p:first-of-type {
      margin-bottom: 20px;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .footnote {
      margin: 18px 0 0;
      font-size: 13px;
      color: rgb(255 250 240 / 0.5);
    }
  `,
})
export class CampfirePanelComponent {
  readonly open = input.required<boolean>();
  protected readonly copy = CAMPFIRE;
}
