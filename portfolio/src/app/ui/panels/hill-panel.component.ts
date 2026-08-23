import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HILL } from '../../content/portfolio.content';

/** Panel 00 — the opening pitch, shown on the hill. */
@Component({
  selector: 'app-hill-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'panel panel--side',
    '[class.is-open]': 'open()',
    'data-panel': '0',
  },
  template: `
    <span class="eyebrow">{{ copy.eyebrow }}</span>
    <h1>{{ copy.heading }}</h1>
    <p>{{ copy.body }}</p>
    <div class="cue" aria-hidden="true">
      <span class="cue__label">{{ copy.cue }}</span>
      <span class="cue__line"></span>
    </div>
  `,
  styles: `
    :host h1 {
      font-size: clamp(28px, 3.2vw, 44px);
    }
    .cue {
      display: flex;
      align-items: center;
      gap: 8px;
      animation: hintBob 2.2s ease-in-out infinite;
    }
    .cue__label {
      font-family: var(--font-pixel);
      font-size: 9px;
      letter-spacing: 0.16em;
      color: var(--accent-warm);
    }
    .cue__line {
      height: 1px;
      width: 46px;
      background: linear-gradient(90deg, var(--accent-warm), rgb(255 230 172 / 0));
    }
  `,
})
export class HillPanelComponent {
  readonly open = input.required<boolean>();
  protected readonly copy = HILL;
}
