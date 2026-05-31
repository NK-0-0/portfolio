import { TestBed } from '@angular/core/testing';
import { SectionStore } from '../../core/services/section-store';

/**
 * InteractionComponent relies on NgtCanvas (WebGL) so we test its effects
 * indirectly through SectionStore, which is the integration point.
 *
 * The raycasting logic itself (HOTSPOT_MAP, #resolveSectionId) is tested
 * via the store behaviour it drives.
 */
describe('SectionStore integration (via InteractionComponent)', () => {
  let store: SectionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(SectionStore);
  });

  it('opening a section via store marks the panel as open', () => {
    store.open('projects');
    expect(store.isPanelOpen()).toBe(true);
    expect(store.activeSection()).toBe('projects');
  });

  it('setHovered updates both signal and plain mesh array', () => {
    store.setHovered('skills', []);
    expect(store.hoveredSection()).toBe('skills');
    expect(store.hoveredMeshes).toHaveLength(0);
  });

  it('close() after open() resets state', () => {
    store.open('experience');
    store.close();
    expect(store.isPanelOpen()).toBe(false);
    expect(store.activeSection()).toBeNull();
  });
});
