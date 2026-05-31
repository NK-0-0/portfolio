import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LoaderComponent } from './loader.component';

describe('LoaderComponent', () => {
  let fixture: ComponentFixture<LoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoaderComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    fixture = TestBed.createComponent(LoaderComponent);
  });

  it('shows the loader when isLoaded is false', () => {
    fixture.componentRef.setInput('isLoaded', false);
    fixture.componentRef.setInput('progress', 0);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.loader')).not.toBeNull();
  });

  it('hides the loader when isLoaded is true', () => {
    fixture.componentRef.setInput('isLoaded', true);
    fixture.componentRef.setInput('progress', 100);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.loader')).toBeNull();
  });

  it('renders the progress bar', () => {
    fixture.componentRef.setInput('isLoaded', false);
    fixture.componentRef.setInput('progress', 50);
    fixture.detectChanges();
    const fill = fixture.nativeElement.querySelector('.loader__bar-fill') as HTMLElement;
    expect(fill.style.width).toBe('50%');
  });

  it('shows initial status text at 0%', () => {
    fixture.componentRef.setInput('isLoaded', false);
    fixture.componentRef.setInput('progress', 0);
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('.loader__status');
    expect(status.textContent).toContain('Summoning');
  });

  it('has an accessible progressbar role', () => {
    fixture.componentRef.setInput('isLoaded', false);
    fixture.componentRef.setInput('progress', 65);
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(bar).not.toBeNull();
    expect(bar.getAttribute('aria-valuenow')).toBe('65');
  });
});
