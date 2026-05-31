import { Component } from '@angular/core';

/**
 * Copyright footer — always visible in the bottom-left corner.
 *
 * IP NOTICE: Kakashi Hatake is © Masashi Kishimoto / Studio Pierrot / Viz Media.
 * This is fan work for a non-commercial developer portfolio.
 * Do NOT add monetisation, paywalls, or commercial branding to this site.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer" role="contentinfo" aria-label="Copyright notice">
      <p>
        Kakashi Hatake character &copy; Masashi Kishimoto&nbsp;/&nbsp;Studio Pierrot.
        Fan work &mdash; not affiliated with or endorsed by the rights holders.
      </p>
    </footer>
  `,
  styleUrl: './footer.component.scss',
})
export class FooterComponent {}
