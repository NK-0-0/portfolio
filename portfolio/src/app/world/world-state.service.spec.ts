import { TestBed } from '@angular/core/testing';
import { WorldStateService } from './world-state.service';

describe('WorldStateService', () => {
  let state: WorldStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    state = TestBed.inject(WorldStateService);
  });

  describe('activePanel', () => {
    it('is closed when the avatar is between stops', () => {
      state.nearest.set(0);
      state['nearestDistance'].set(400);
      expect(state.activePanel()).toBe(-1);
    });

    it('opens the nearest panel once inside its reach', () => {
      state.nearest.set(3);
      state['nearestDistance'].set(100);
      expect(state.activePanel()).toBe(3);
    });

    it('gives the stage panel a wider reach than the side panels', () => {
      state['nearestDistance'].set(300);
      state.nearest.set(1);
      expect(state.activePanel()).toBe(1);
      state.nearest.set(2);
      expect(state.activePanel()).toBe(-1);
    });
  });

  describe('prompt', () => {
    it('is hidden while a detail overlay is open', () => {
      state.actionable.set(2);
      state['still'].set(true);
      state.openDetail(0);
      expect(state.promptVisible()).toBe(false);
    });

    it('is hidden while the avatar is still moving', () => {
      state.actionable.set(2);
      state['still'].set(false);
      expect(state.promptVisible()).toBe(false);
    });

    it('offers the chapter hint when in range, and GET UP while acting', () => {
      state['still'].set(true);
      state.actionable.set(0);
      expect(state.promptVisible()).toBe(true);
      expect(state.promptText()).toBe('SIT ON THE SWING');

      state.acting.set(0);
      expect(state.promptText()).toBe('GET UP');
    });
  });

  describe('detail', () => {
    it('opens and closes without a renderer attached', () => {
      state.openDetail(1);
      expect(state.detail()).toBe(1);
      state.closeDetail();
      expect(state.detail()).toBe(-1);
    });
  });

  it('derives the clock label from walk phase', () => {
    state.phase.set(0.1);
    expect(state.clock()).toBe('MORNING');
    state.phase.set(0.95);
    expect(state.clock()).toBe('NIGHTFALL');
  });
});
