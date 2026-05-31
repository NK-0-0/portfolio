import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { DeviceCapabilityService } from './device-capability';

describe('DeviceCapabilityService', () => {
  it('reports 3D as not supported when running on the server', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const service = TestBed.inject(DeviceCapabilityService);
    expect(service.is3DSupported()).toBe(false);
  });

  it('initialises is3DSupported as a signal (truthy or falsy) in browser context', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const service = TestBed.inject(DeviceCapabilityService);
    // jest-webgl-canvas-mock provides a canvas stub with webgl context,
    // so WebGL is detected as available in the test environment.
    // We only verify the signal exists and is boolean.
    expect(typeof service.is3DSupported()).toBe('boolean');
  });
});
