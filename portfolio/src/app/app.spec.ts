import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        // Server platform: DeviceCapabilityService returns false, 3D skipped
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    }).compileComponents();
  });

  it('creates the root component', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders without error on server platform', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
