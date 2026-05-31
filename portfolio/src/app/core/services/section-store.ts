import { Injectable, computed, signal } from '@angular/core';
import type { SectionId } from '../models/section.types';
import type { Mesh } from 'three';

@Injectable({ providedIn: 'root' })
export class SectionStore {
  readonly activeSection = signal<SectionId | null>(null);
  readonly isPanelOpen   = computed(() => this.activeSection() !== null);
  readonly hoveredSection = signal<SectionId | null>(null);

  /**
   * Plain (non-signal) array of Three.js Mesh objects currently under the cursor.
   * Read each frame by the EffectsComponent to drive OutlinePass selection.
   * Three.js objects must NOT go in Angular signals — they are mutable and not
   * safe to diff. Access this directly in the animation loop.
   */
  hoveredMeshes: Mesh[] = [];

  open(id: SectionId): void {
    this.activeSection.set(id);
  }

  close(): void {
    this.activeSection.set(null);
  }

  setHovered(id: SectionId | null, meshes: Mesh[]): void {
    this.hoveredSection.set(id);
    this.hoveredMeshes = meshes;
  }
}
