import { TestBed } from '@angular/core/testing';
import { SectionStore } from './section-store';
import type { Mesh } from 'three';

describe('SectionStore', () => {
  let store: SectionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(SectionStore);
  });

  it('starts with no active section and panel closed', () => {
    expect(store.activeSection()).toBeNull();
    expect(store.isPanelOpen()).toBe(false);
  });

  it('open() sets activeSection and isPanelOpen', () => {
    store.open('about');
    expect(store.activeSection()).toBe('about');
    expect(store.isPanelOpen()).toBe(true);
  });

  it('close() clears activeSection and closes panel', () => {
    store.open('skills');
    store.close();
    expect(store.activeSection()).toBeNull();
    expect(store.isPanelOpen()).toBe(false);
  });

  it('open() overwrites a previously open section', () => {
    store.open('about');
    store.open('contact');
    expect(store.activeSection()).toBe('contact');
  });

  it('setHovered() updates hoveredSection and hoveredMeshes', () => {
    const fakeMesh = { isMesh: true } as unknown as Mesh;
    store.setHovered('projects', [fakeMesh]);
    expect(store.hoveredSection()).toBe('projects');
    expect(store.hoveredMeshes).toContain(fakeMesh);
  });

  it('setHovered(null) clears hover state', () => {
    store.setHovered('about', []);
    store.setHovered(null, []);
    expect(store.hoveredSection()).toBeNull();
    expect(store.hoveredMeshes).toHaveLength(0);
  });
});
