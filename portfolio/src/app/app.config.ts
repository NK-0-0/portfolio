import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    /**
     * Hash location, deliberately.
     *
     * The build is client-side only, so GitHub Pages has no `read/index.html`
     * to serve — a path-based deep link would 404 and depend on a redirect
     * shim whose correct base path differs between local (`/`) and Pages
     * (`/portfolio/`). A hash URL resolves identically everywhere and is
     * therefore safe to paste into an application. Revisit if build-time
     * prerendering is ever added, since that would emit real routes.
     */
    provideRouter(
      routes,
      withHashLocation(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
  ],
};
