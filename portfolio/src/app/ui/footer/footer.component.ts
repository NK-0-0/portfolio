import { Component } from '@angular/core';

/**
 * Copyright footer — always visible in the bottom-left corner.
 *
 * All shipped 3D props are original procedural geometry (zero GLBs) and no
 * mandatory-attribution third-party asset is used, so there is no legal
 * attribution notice to display — see `docs/ASSET_CREDITS.md` for the full
 * provenance ledger. This is just a copyright line.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer" role="contentinfo" aria-label="Copyright notice">
      <p>&copy; {{ year }} Your Name. All rights reserved.</p>
    </footer>
  `,
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();
}
