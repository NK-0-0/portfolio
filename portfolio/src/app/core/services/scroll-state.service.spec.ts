import { TestBed } from '@angular/core/testing';
import { ScrollStateService } from './scroll-state.service';

describe('ScrollStateService', () => {
  let service: ScrollStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScrollStateService);
  });

  it('defaults activeSection and scrollProgress to 0', () => {
    expect(service.activeSection()).toBe(0);
    expect(service.scrollProgress()).toBe(0);
  });

  it('updates activeSection independently via set()', () => {
    service.activeSection.set(3);
    expect(service.activeSection()).toBe(3);
    expect(service.scrollProgress()).toBe(0);
  });

  it('updates scrollProgress independently via set()', () => {
    service.scrollProgress.set(0.42);
    expect(service.scrollProgress()).toBe(0.42);
    expect(service.activeSection()).toBe(0);
  });
});
