import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ModelLoadingService } from './model-loading.service';

// TOTAL_ASSETS is 0 (the live scene is fully procedural). These specs pin the
// NaN-guard behaviour a QA review flagged in Milestone 2.3: with zero assets,
// allLoaded/progress must resolve immediately rather than dividing 0/0 -> NaN.

describe('ModelLoadingService', () => {
  it('reports allLoaded=true and progress=100 immediately with zero assets (browser)', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const service = TestBed.inject(ModelLoadingService);
    expect(service.allLoaded()).toBe(true);
    expect(service.progress()).toBe(100);
  });

  it('reports allLoaded=true and progress=100 in server context', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const service = TestBed.inject(ModelLoadingService);
    expect(service.allLoaded()).toBe(true);
    expect(service.progress()).toBe(100);
  });

  it('markLoaded() clamps at TOTAL_ASSETS and never produces NaN/over-100', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const service = TestBed.inject(ModelLoadingService);
    service.markLoaded();
    service.markLoaded();
    expect(service.allLoaded()).toBe(true);
    expect(service.progress()).toBe(100);
  });
});
