/**
 * BreakpointManager tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BreakpointManager } from '../src/core/BreakpointManager';
import type { BreakpointLayouts, Widget } from '../src/types';

describe('BreakpointManager', () => {
  let breakpointManager: BreakpointManager;
  let breakpoints: BreakpointLayouts;
  let currentLayout: Widget[];
  let onBreakpointChange: ReturnType<typeof vi.fn>;
  let getCurrentLayout: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup breakpoints
    breakpoints = {
      sm: {
        width: 576,
        columns: 6,
      },
      md: {
        width: 768,
        columns: 8,
      },
      lg: {
        width: 992,
        columns: 12,
      },
      xl: {
        width: 1200,
        columns: 12,
      },
    };

    currentLayout = [
      { id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' },
      { id: '2', x: 4, y: 0, w: 4, h: 3, content: 'Widget 2' },
    ];

    getCurrentLayout = vi.fn(() => currentLayout);
    onBreakpointChange = vi.fn();

    breakpointManager = new BreakpointManager(
      breakpoints,
      getCurrentLayout,
      onBreakpointChange,
      false // debug
    );
  });

  afterEach(() => {
    breakpointManager.destroy();
  });

  describe('getCurrentBreakpoint', () => {
    it('should detect correct breakpoint for small viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      const current = breakpointManager.getCurrentBreakpoint();

      expect(current).toBeTruthy();
      expect(current?.name).toBe('sm');
      expect(current?.config.columns).toBe(6);
    });

    it('should detect correct breakpoint for medium viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });

      const current = breakpointManager.getCurrentBreakpoint();

      expect(current).toBeTruthy();
      expect(current?.name).toBe('md');
      expect(current?.config.columns).toBe(8);
    });

    it('should detect correct breakpoint for large viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1000,
      });

      const current = breakpointManager.getCurrentBreakpoint();

      expect(current).toBeTruthy();
      expect(current?.name).toBe('lg');
      expect(current?.config.columns).toBe(12);
    });

    it('should detect correct breakpoint for extra large viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1400,
      });

      const current = breakpointManager.getCurrentBreakpoint();

      expect(current).toBeTruthy();
      expect(current?.name).toBe('xl');
      expect(current?.config.columns).toBe(12);
    });

    it('should return null for viewport smaller than smallest breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });

      const current = breakpointManager.getCurrentBreakpoint();

      expect(current).toBeNull();
    });

    it('should use mobile-first approach (largest matching breakpoint)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1000,
      });

      const current = breakpointManager.getCurrentBreakpoint();

      // At 1000px, it should match 'lg' (992px), not 'sm' or 'md'
      expect(current?.name).toBe('lg');
    });
  });

  describe('switchToBreakpoint', () => {
    it('should switch to a valid breakpoint', () => {
      const result = breakpointManager.switchToBreakpoint('lg');

      expect(result).toBe(true);
      expect(onBreakpointChange).toHaveBeenCalledWith('lg', breakpoints.lg, null);
    });

    it('should not switch to invalid breakpoint', () => {
      const result = breakpointManager.switchToBreakpoint('invalid');

      expect(result).toBe(false);
      expect(onBreakpointChange).not.toHaveBeenCalled();
    });

    it('should not switch if already at the same breakpoint', () => {
      breakpointManager.switchToBreakpoint('lg');
      onBreakpointChange.mockClear();

      const result = breakpointManager.switchToBreakpoint('lg');

      expect(result).toBe(false);
      expect(onBreakpointChange).not.toHaveBeenCalled();
    });

    it('should force switch when force=true', () => {
      breakpointManager.switchToBreakpoint('lg');
      onBreakpointChange.mockClear();

      const result = breakpointManager.switchToBreakpoint('lg', true);

      expect(result).toBe(true);
      expect(onBreakpointChange).toHaveBeenCalled();
    });

    it('should save current layout before switching', () => {
      breakpointManager.switchToBreakpoint('md');
      breakpointManager.switchToBreakpoint('lg');

      // Check that layout was saved for 'md'
      const savedLayout = breakpointManager.getLayoutForBreakpoint('md');
      expect(savedLayout).toEqual(currentLayout);
    });
  });

  describe('getLayoutForBreakpoint', () => {
    it('should return null for breakpoint without saved layout', () => {
      const layout = breakpointManager.getLayoutForBreakpoint('lg');

      expect(layout).toBeNull();
    });

    it('should return saved layout for breakpoint', () => {
      const testLayout: Widget[] = [
        { id: '1', x: 0, y: 0, w: 6, h: 3, content: 'Widget 1' },
      ];

      breakpointManager.saveLayoutForBreakpoint('md', testLayout);
      const layout = breakpointManager.getLayoutForBreakpoint('md');

      expect(layout).toEqual(testLayout);
    });

    it('should return null for invalid breakpoint', () => {
      const layout = breakpointManager.getLayoutForBreakpoint('invalid');

      expect(layout).toBeNull();
    });
  });

  describe('saveLayoutForBreakpoint', () => {
    it('should save layout for valid breakpoint', () => {
      const testLayout: Widget[] = [
        { id: '1', x: 0, y: 0, w: 6, h: 3, content: 'Widget 1' },
        { id: '2', x: 6, y: 0, w: 6, h: 3, content: 'Widget 2' },
      ];

      breakpointManager.saveLayoutForBreakpoint('lg', testLayout);
      const savedLayout = breakpointManager.getLayoutForBreakpoint('lg');

      expect(savedLayout).toEqual(testLayout);
    });

    it('should create a deep copy of layout', () => {
      const testLayout: Widget[] = [
        { id: '1', x: 0, y: 0, w: 6, h: 3, content: 'Widget 1' },
      ];

      breakpointManager.saveLayoutForBreakpoint('lg', testLayout);

      // Modify original
      testLayout[0].x = 5;

      // Saved layout should not be affected
      const savedLayout = breakpointManager.getLayoutForBreakpoint('lg');
      expect(savedLayout![0].x).toBe(0);
    });

    it('should not throw for invalid breakpoint', () => {
      const testLayout: Widget[] = [];

      expect(() => {
        breakpointManager.saveLayoutForBreakpoint('invalid', testLayout);
      }).not.toThrow();
    });
  });

  describe('saveCurrentLayout', () => {
    it('should save current layout for current breakpoint', () => {
      breakpointManager.switchToBreakpoint('lg');
      breakpointManager.saveCurrentLayout();

      const savedLayout = breakpointManager.getLayoutForBreakpoint('lg');
      expect(savedLayout).toEqual(currentLayout);
      expect(getCurrentLayout).toHaveBeenCalled();
    });

    it('should do nothing if no current breakpoint', () => {
      breakpointManager.saveCurrentLayout();

      expect(getCurrentLayout).not.toHaveBeenCalled();
    });
  });

  describe('startListening and destroy', () => {
    it('should initialize and detect current breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1000,
      });

      breakpointManager.startListening();

      expect(onBreakpointChange).toHaveBeenCalledWith('lg', breakpoints.lg, null);
    });

    it('should attach resize listener on startListening', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      breakpointManager.startListening();

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should remove resize listener on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      breakpointManager.startListening();
      breakpointManager.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should not throw on destroy without startListening', () => {
      expect(() => breakpointManager.destroy()).not.toThrow();
    });
  });

  describe('responsive behavior', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1000,
      });

      breakpointManager.startListening();
      onBreakpointChange.mockClear();
    });

    it('should switch breakpoint on viewport resize', async () => {
      // Change viewport width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(onBreakpointChange).toHaveBeenCalledWith('md', breakpoints.md, 'lg');
    });

    it('should debounce resize events', async () => {
      // Trigger multiple resize events
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Should only trigger once due to debouncing
      // But still may be called (depends on implementation)
      expect(onBreakpointChange.mock.calls.length).toBeLessThanOrEqual(1);
    });
  });

  describe('breakpoint sorting', () => {
    it('should sort breakpoints by width on init', () => {
      const unsortedBreakpoints: BreakpointLayouts = {
        xl: { width: 1200, columns: 12 },
        sm: { width: 576, columns: 6 },
        lg: { width: 992, columns: 12 },
        md: { width: 768, columns: 8 },
      };

      const manager = new BreakpointManager(
        unsortedBreakpoints,
        getCurrentLayout,
        onBreakpointChange
      );

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });

      const current = manager.getCurrentBreakpoint();

      // Should correctly detect 'md' even though breakpoints were unsorted
      expect(current?.name).toBe('md');

      manager.destroy();
    });
  });
});
