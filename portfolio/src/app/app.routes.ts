import { Routes } from '@angular/router';
import { WorldShellComponent } from './ui/world-shell/world-shell.component';

export const routes: Routes = [
  {
    // Eager: the world is the primary experience, and lazy-loading it would
    // put a second network round trip in front of first paint. Only the
    // secondary document view is split out.
    path: '',
    pathMatch: 'full',
    title: 'Pixel World — Developer Portfolio',
    component: WorldShellComponent,
  },
  {
    path: 'read',
    title: 'Portfolio — the short version',
    loadComponent: () => import('./ui/read/read.component').then((m) => m.ReadComponent),
  },
  { path: '**', redirectTo: '' },
];
