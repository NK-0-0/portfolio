import { Injectable, signal } from '@angular/core';

/** 0 = hero, 1 = about, 2 = experience, 3 = skills, 4 = projects, 5 = contact */
export type ActiveSection = 0 | 1 | 2 | 3 | 4 | 5;

@Injectable({ providedIn: 'root' })
export class ScrollStateService {
  /** Which section is currently centred in the viewport. */
  readonly activeSection = signal<ActiveSection>(0);

  /** Overall page scroll progress 0 → 1. */
  readonly scrollProgress = signal<number>(0);
}
