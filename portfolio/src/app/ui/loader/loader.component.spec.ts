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
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.loader');
    expect(el).not.toBeNull();
  });

  it('hides the loader when isLoaded is true', () => {
    fixture.componentRef.setInput('isLoaded', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.loader');
    expect(el).toBeNull();
  });
});
