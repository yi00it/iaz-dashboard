/**
 * Plugin tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { IAZDashboard } from '../src/core/Dashboard';
import { createSavePlugin, savePlugin } from '../src/plugins/savePlugin';
import { createConstraintsPlugin } from '../src/plugins/constraintsPlugin';
import { createSnaplinesPlugin } from '../src/plugins/snaplinesPlugin';
import type { Widget } from '../src/types';

const Dashboard = IAZDashboard;

describe('Plugins', () => {
  let container: HTMLElement;
  let dashboard: Dashboard;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-dashboard';
    container.style.width = '1200px';
    container.style.height = '800px';
    document.body.appendChild(container);

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    if (dashboard) {
      dashboard.destroy();
    }
    localStorage.clear();
  });

  describe('SavePlugin', () => {
    describe('createSavePlugin', () => {
      it('should create plugin with custom options', () => {
        const plugin = createSavePlugin({
          storageKey: 'custom-key',
          debounce: 100,
          autoLoad: false,
          autoSave: true,
        });

        expect(plugin).toBeTypeOf('function');
      });

      it('should auto-save to localStorage', () => {
        vi.useFakeTimers();

        dashboard = new Dashboard(container);
        dashboard.use(
          createSavePlugin({
            storageKey: 'test-dashboard',
            debounce: 50,
            autoLoad: false,
          })
        );

        dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });

        // Advance timers past debounce
        vi.advanceTimersByTime(100);

        const saved = localStorage.getItem('test-dashboard');
        expect(saved).toBeTruthy();

        const state = JSON.parse(saved!);
        expect(state.widgets).toHaveLength(1);
        expect(state.widgets[0].id).toBe('1');

        vi.useRealTimers();
      });

      it('should auto-load from localStorage', () => {
        const state = {
          widgets: [
            { id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' },
            { id: '2', x: 4, y: 0, w: 4, h: 3, content: 'Widget 2' },
          ],
        };
        localStorage.setItem('test-dashboard', JSON.stringify(state));

        dashboard = new Dashboard(container);
        dashboard.use(
          createSavePlugin({
            storageKey: 'test-dashboard',
            autoLoad: true,
          })
        );

        expect(dashboard.getState().widgets).toHaveLength(2);
      });

      it('should emit save:success event', () => {
        vi.useFakeTimers();

        dashboard = new Dashboard(container);
        const handler = vi.fn();
        dashboard.on('save:success', handler);

        dashboard.use(
          createSavePlugin({
            storageKey: 'test-dashboard',
            debounce: 50,
            autoLoad: false,
          })
        );

        dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });

        // Advance timers past debounce
        vi.advanceTimersByTime(100);

        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            storageKey: 'test-dashboard',
            state: expect.any(Object),
          })
        );

        vi.useRealTimers();
      });

      it('should emit load:success event', () => {
        const state = {
          widgets: [{ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' }],
        };
        localStorage.setItem('test-dashboard', JSON.stringify(state));

        dashboard = new Dashboard(container);
        const handler = vi.fn();
        dashboard.on('load:success', handler);

        dashboard.use(
          createSavePlugin({
            storageKey: 'test-dashboard',
            autoLoad: true,
          })
        );

        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            storageKey: 'test-dashboard',
            state: expect.any(Object),
          })
        );
      });

      it('should handle load errors gracefully', () => {
        localStorage.setItem('test-dashboard', 'invalid json');

        dashboard = new Dashboard(container);
        const errorHandler = vi.fn();
        dashboard.on('load:error', errorHandler);

        dashboard.use(
          createSavePlugin({
            storageKey: 'test-dashboard',
            autoLoad: true,
          })
        );

        expect(errorHandler).toHaveBeenCalled();
      });

      it('should handle save errors gracefully', () => {
        vi.useFakeTimers();
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Create a mock storage that throws on setItem
        const mockStorage = {
          getItem: vi.fn(() => null),
          setItem: vi.fn(() => {
            throw new Error('QuotaExceededError');
          }),
          removeItem: vi.fn(),
          clear: vi.fn(),
          length: 0,
          key: vi.fn(),
        };

        vi.stubGlobal('localStorage', mockStorage);

        dashboard = new Dashboard(container);
        const errorHandler = vi.fn();
        dashboard.on('save:error', errorHandler);

        dashboard.use(
          createSavePlugin({
            storageKey: 'test-dashboard',
            debounce: 50,
            autoLoad: false,
          })
        );

        dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });

        // Advance timers past debounce
        vi.advanceTimersByTime(100);

        expect(errorHandler).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledWith(
          '[SavePlugin] Failed to save state:',
          expect.any(Error)
        );

        vi.unstubAllGlobals();
        errorSpy.mockRestore();
        vi.useRealTimers();
      });

      it('should handle clear errors gracefully', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        dashboard = new Dashboard(container);
        const errorHandler = vi.fn();
        dashboard.on('clear:error', errorHandler);

        dashboard.use(
          createSavePlugin({
            storageKey: 'test-dashboard',
            autoLoad: false,
            autoSave: false,
          })
        );

        // Create a mock storage that throws on removeItem
        const mockStorage = {
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem: vi.fn(() => {
            throw new Error('Storage error');
          }),
          clear: vi.fn(),
          length: 0,
          key: vi.fn(),
        };

        vi.stubGlobal('localStorage', mockStorage);

        dashboard.clearSavedState?.();

        expect(errorHandler).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledWith(
          '[SavePlugin] Failed to clear state:',
          expect.any(Error)
        );

        vi.unstubAllGlobals();
        errorSpy.mockRestore();
      });

      it('should debounce multiple rapid saves', () => {
        vi.useFakeTimers();

        dashboard = new Dashboard(container);
        const successHandler = vi.fn();
        dashboard.on('save:success', successHandler);

        dashboard.use(
          createSavePlugin({
            storageKey: 'test-dashboard',
            debounce: 100,
            autoLoad: false,
          })
        );

        // Rapid widget additions
        dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });
        dashboard.addWidget({ id: '2', x: 4, y: 0, w: 4, h: 3, content: 'Widget 2' });
        dashboard.addWidget({ id: '3', x: 0, y: 3, w: 4, h: 3, content: 'Widget 3' });

        // Advance timers past debounce
        vi.advanceTimersByTime(200);

        // Should only save once due to debouncing
        expect(successHandler).toHaveBeenCalledTimes(1);

        // Saved state should have all widgets
        const saved = JSON.parse(localStorage.getItem('test-dashboard')!);
        expect(saved.widgets).toHaveLength(3);

        vi.useRealTimers();
      });

      it('should emit clear:success event', () => {
        localStorage.setItem('test-dashboard', JSON.stringify({ widgets: [] }));

        dashboard = new Dashboard(container);
        const successHandler = vi.fn();
        dashboard.on('clear:success', successHandler);

        dashboard.use(
          createSavePlugin({
            storageKey: 'test-dashboard',
            autoLoad: false,
          })
        );

        dashboard.clearSavedState?.();

        expect(successHandler).toHaveBeenCalledWith({
          storageKey: 'test-dashboard',
        });
      });

      it('should add helper methods to dashboard', () => {
        dashboard = new Dashboard(container);
        dashboard.use(
          createSavePlugin({
            storageKey: 'test-dashboard',
            autoLoad: false,
          })
        );

        expect(dashboard.saveState).toBeTypeOf('function');
        expect(dashboard.loadState).toBeTypeOf('function');
        expect(dashboard.clearSavedState).toBeTypeOf('function');
      });

      it('should clear saved state', () => {
        localStorage.setItem('test-dashboard', JSON.stringify({ widgets: [] }));

        dashboard = new Dashboard(container);
        dashboard.use(
          createSavePlugin({
            storageKey: 'test-dashboard',
            autoLoad: false,
          })
        );

        dashboard.clearSavedState?.();

        expect(localStorage.getItem('test-dashboard')).toBeNull();
      });

      it('should not auto-save when autoSave is false', () => {
        vi.useFakeTimers();

        dashboard = new Dashboard(container);
        dashboard.use(
          createSavePlugin({
            storageKey: 'test-dashboard',
            debounce: 50,
            autoLoad: false,
            autoSave: false,
          })
        );

        dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });

        // Advance timers past debounce
        vi.advanceTimersByTime(100);

        expect(localStorage.getItem('test-dashboard')).toBeNull();

        vi.useRealTimers();
      });
    });

    describe('savePlugin (default)', () => {
      it('should use default options', () => {
        vi.useFakeTimers();

        dashboard = new Dashboard(container, {
          storageKey: 'my-custom-key',
        });
        dashboard.use(savePlugin);

        dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });

        // Advance timers past debounce
        vi.advanceTimersByTime(600);

        const saved = localStorage.getItem('my-custom-key');
        expect(saved).toBeTruthy();

        vi.useRealTimers();
      });
    });
  });

  describe('ConstraintsPlugin', () => {
    it('should create plugin with custom options', () => {
      const plugin = createConstraintsPlugin({
        maxWidgets: 10,
        minWidgetSize: { w: 2, h: 2 },
        maxWidgetSize: { w: 6, h: 4 },
      });

      expect(plugin).toBeTypeOf('function');
    });

    it('should enforce max widgets constraint', () => {
      dashboard = new Dashboard(container);
      dashboard.use(
        createConstraintsPlugin({
          maxWidgets: 2,
        })
      );

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });
      dashboard.addWidget({ id: '2', x: 4, y: 0, w: 4, h: 3, content: 'Widget 2' });

      const handler = vi.fn();
      dashboard.on('constraint:maxWidgets', handler);

      dashboard.addWidget({ id: '3', x: 0, y: 3, w: 4, h: 3, content: 'Widget 3' });

      expect(dashboard.getState().widgets).toHaveLength(2);
      expect(handler).toHaveBeenCalled();
    });

    it('should enforce min widget size constraint', () => {
      dashboard = new Dashboard(container);
      dashboard.use(
        createConstraintsPlugin({
          minWidgetSize: { w: 3, h: 2 },
        })
      );

      const handler = vi.fn();
      dashboard.on('constraint:minSize', handler);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 2, h: 1, content: 'Too small' });

      expect(dashboard.getState().widgets).toHaveLength(0);
      expect(handler).toHaveBeenCalled();
    });

    it('should enforce max widget size constraint', () => {
      dashboard = new Dashboard(container);
      dashboard.use(
        createConstraintsPlugin({
          maxWidgetSize: { w: 6, h: 4 },
        })
      );

      const handler = vi.fn();
      dashboard.on('constraint:maxSize', handler);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 8, h: 6, content: 'Too large' });

      expect(dashboard.getState().widgets).toHaveLength(0);
      expect(handler).toHaveBeenCalled();
    });

    it('should allow widgets within constraints', () => {
      dashboard = new Dashboard(container);
      dashboard.use(
        createConstraintsPlugin({
          maxWidgets: 5,
          minWidgetSize: { w: 2, h: 2 },
          maxWidgetSize: { w: 6, h: 4 },
        })
      );

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Valid widget' });

      expect(dashboard.getState().widgets).toHaveLength(1);
    });

    it('should enforce restricted areas', () => {
      dashboard = new Dashboard(container);
      dashboard.use(
        createConstraintsPlugin({
          restrictedAreas: [
            { x: 0, y: 0, w: 4, h: 2 }, // Top-left corner restricted
          ],
        })
      );

      const handler = vi.fn();
      dashboard.on('constraint:restrictedArea', handler);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'In restricted area' });

      expect(dashboard.getState().widgets).toHaveLength(0);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('SnaplinesPlugin', () => {
    it('should create plugin with custom options', () => {
      const plugin = createSnaplinesPlugin({
        snapDistance: 10,
        showLines: true,
      });

      expect(plugin).toBeTypeOf('function');
    });

    it('should show snaplines during drag', () => {
      dashboard = new Dashboard(container, {
        widgets: [
          { id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' },
          { id: '2', x: 4, y: 0, w: 4, h: 3, content: 'Widget 2' },
        ],
      });

      dashboard.use(
        createSnaplinesPlugin({
          showLines: true,
        })
      );

      // Simulate drag start
      dashboard.emit('drag:start', dashboard.getWidget('1'), { x: 0, y: 0 });

      // Check if snapline container was added
      const snaplineContainer = container.querySelector('.iazd-snaplines');
      expect(snaplineContainer).toBeTruthy();
    });

    it('should hide snaplines when drag ends', () => {
      dashboard = new Dashboard(container, {
        widgets: [
          { id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' },
        ],
      });

      dashboard.use(
        createSnaplinesPlugin({
          showLines: true,
        })
      );

      // Simulate drag cycle
      dashboard.emit('drag:start', dashboard.getWidget('1'), { x: 0, y: 0 });
      dashboard.emit('drag:end', dashboard.getWidget('1'), { x: 4, y: 2, moved: true });

      // Snaplines should be cleaned up
      const snaplines = container.querySelectorAll('.iazd-snapline');
      expect(snaplines.length).toBe(0);
    });

    it('should show snaplines during resize', () => {
      dashboard = new Dashboard(container, {
        widgets: [
          { id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' },
        ],
      });

      dashboard.use(
        createSnaplinesPlugin({
          showLines: true,
        })
      );

      // Simulate resize start
      dashboard.emit('resize:start', dashboard.getWidget('1'), { w: 4, h: 3, handle: 'se' });

      // Check if snapline container exists
      const snaplineContainer = container.querySelector('.iazd-snaplines');
      expect(snaplineContainer).toBeTruthy();
    });
  });

  describe('Plugin combination', () => {
    it('should work with multiple plugins', () => {
      vi.useFakeTimers();

      dashboard = new Dashboard(container);

      // Add multiple plugins
      dashboard
        .use(
          createSavePlugin({
            storageKey: 'test-combo',
            debounce: 50,
            autoLoad: false,
          })
        )
        .use(
          createConstraintsPlugin({
            maxWidgets: 5,
          })
        )
        .use(
          createSnaplinesPlugin({
            showLines: true,
          })
        );

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });

      // Advance timers past debounce
      vi.advanceTimersByTime(100);

      // Check save plugin worked
      expect(localStorage.getItem('test-combo')).toBeTruthy();

      // Check constraints plugin allows this widget
      expect(dashboard.getState().widgets).toHaveLength(1);

      vi.useRealTimers();
    });
  });
});
