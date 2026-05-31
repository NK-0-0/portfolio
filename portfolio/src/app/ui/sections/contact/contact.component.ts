import { Component } from '@angular/core';

interface ContactLink {
  label: string;
  href: string;
  display: string;
}

/** Dummy data — replace with your real contact links. */
const LINKS: ContactLink[] = [
  { label: 'Email',    href: 'mailto:hello@yourname.dev', display: 'hello@yourname.dev' },
  { label: 'GitHub',   href: 'https://github.com/your-handle', display: 'github.com/your-handle' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/your-profile', display: 'linkedin.com/in/your-profile' },
];

@Component({
  selector: 'app-contact',
  standalone: true,
  template: `
    <article>
      <h2 class="section-heading">Contact</h2>
      <p class="intro">
        Available for full-time roles and select consulting engagements.
        Drop me a line — I reply within one business day.
      </p>
      <ul class="links" role="list">
        @for (link of links; track link.label) {
          <li class="link-row">
            <span class="link-label">{{ link.label }}</span>
            <a
              [href]="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="link-value"
            >{{ link.display }}</a>
          </li>
        }
      </ul>
    </article>
  `,
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  protected readonly links = LINKS;
}
