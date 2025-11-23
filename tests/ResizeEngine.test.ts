/**
 * ResizeEngine tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResizeEngine } from '../src/core/ResizeEngine';
import type { DashboardState } from '../src/types';

describe('ResizeEngine', () => {
  let resizeEngine: ResizeEngine;
  let state: DashboardState;
  let container: HTMLElement;
  let gridElement: HTMLElement;
  let setState: ReturnType<typeof vi.fn>;
  let emit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.style.width = '1200px';
    container.style.height = '800px';
    document.body.appendChild(container);

    gridElement = document.createElement('div');
    gridElement.className = 'iazd-grid';
    gridElement.style.width = '1200px';
    container.appendChild(gridElement);

    // Setup state
    state = {
      widgets: [
        { id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' },
        { id: '2', x: 4, y: 0, w: 4, h: 3, content: 'Widget 2', minW: 2, minH: 2, maxW: 6, maxH: 4 },
        { id: '3', x: 0, y: 3, w: 4, h: 3, content: 'Widget 3', locked: true },
        { id: '4', x: 4, y: 3, w: 4, h: 3, content: 'Widget 4', noResize: true },
      ],
      currentBreakpoint: 'lg',
    };

    setState = vi.fn((newState: DashboardState) => {
      state = newState;
    });

    emit = vi.fn();

    const getState = () => state;

    resizeEngine = new ResizeEngine(
      getState,
      setState,
      emit,
      container,
      gridElement,
      {
        columns: 12,
        rowHeight: 100,
        margin: 10,
        animate: true,
      }
    );
  });

  describe('canResize', () => {
    it('should return true for resizable widget', () => {
      expect(resizeEngine.canResize('1')).toBe(true);
    });

    it('should return false for locked widget', () => {
      expect(resizeEngine.canResize('3')).toBe(false);
    });

    it('should return false for noResize widget', () => {
      expect(resizeEngine.canResize('4')).toBe(false);
    });

    it('should return false for non-existent widget', () => {
      expect(resizeEngine.canResize('999')).toBe(false);
    });
  });

  describe('startResize', () => {
    it('should start resizing a resizable widget', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      gridElement.appendChild(widgetElement);

      const result = resizeEngine.startResize('1', 'se', 400, 300, widgetElement);

      expect(result).toBe(true);
      expect(resizeEngine.isResizing()).toBe(true);
      expect(emit).toHaveBeenCalledWith('resize:start', expect.any(Object), {
        w: 4,
        h: 3,
        handle: 'se',
      });
    });

    it('should not start resizing a locked widget', () => {
      const widgetElement = document.createElement('div');
      gridElement.appendChild(widgetElement);

      const result = resizeEngine.startResize('3', 'se', 400, 300, widgetElement);

      expect(result).toBe(false);
      expect(resizeEngine.isResizing()).toBe(false);
    });

    it('should not start resizing a noResize widget', () => {
      const widgetElement = document.createElement('div');
      gridElement.appendChild(widgetElement);

      const result = resizeEngine.startResize('4', 'se', 400, 300, widgetElement);

      expect(result).toBe(false);
      expect(resizeEngine.isResizing()).toBe(false);
    });

    it('should create preview element', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      gridElement.appendChild(widgetElement);

      resizeEngine.startResize('1', 'se', 400, 300, widgetElement);

      expect(gridElement.querySelector('.iazd-resize-preview')).toBeTruthy();
    });

    it('should add resizing class to widget element', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      gridElement.appendChild(widgetElement);

      resizeEngine.startResize('1', 'se', 400, 300, widgetElement);

      expect(widgetElement.classList.contains('iazd-resizing')).toBe(true);
    });
  });

  describe('updateResize', () => {
    beforeEach(() => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      gridElement.appendChild(widgetElement);

      resizeEngine.startResize('1', 'se', 400, 300, widgetElement);
      emit.mockClear();
    });

    it('should update resize dimensions for southeast handle', () => {
      resizeEngine.updateResize(500, 400);

      expect(emit).toHaveBeenCalledWith('resize:move', expect.any(Object), expect.objectContaining({
        w: expect.any(Number),
        h: expect.any(Number),
      }));
    });

    it('should do nothing if not resizing', () => {
      resizeEngine.cancelResize();
      emit.mockClear();

      resizeEngine.updateResize(500, 400);

      expect(emit).not.toHaveBeenCalled();
    });

    it('should respect minimum width constraint', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      gridElement.appendChild(widgetElement);

      resizeEngine.startResize('2', 'se', 400, 300, widgetElement);
      emit.mockClear();

      // Try to resize smaller than minW
      resizeEngine.updateResize(200, 400);

      const resizeState = resizeEngine.getResizeState();
      expect(resizeState?.currentW).toBeGreaterThanOrEqual(2); // minW is 2
    });

    it('should respect maximum width constraint', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      gridElement.appendChild(widgetElement);

      resizeEngine.startResize('2', 'se', 400, 300, widgetElement);
      emit.mockClear();

      // Try to resize larger than maxW
      resizeEngine.updateResize(1000, 400);

      const resizeState = resizeEngine.getResizeState();
      expect(resizeState?.currentW).toBeLessThanOrEqual(6); // maxW is 6
    });
  });

  describe('endResize', () => {
    beforeEach(() => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      widgetElement.setAttribute('data-widget-id', '1');
      gridElement.appendChild(widgetElement);

      resizeEngine.startResize('1', 'se', 400, 300, widgetElement);
      emit.mockClear();
    });

    it('should commit widget size change', () => {
      resizeEngine.updateResize(500, 400);
      const result = resizeEngine.endResize();

      expect(result).toBe(true);
      expect(setState).toHaveBeenCalled();
      expect(emit).toHaveBeenCalledWith('resize:end', expect.any(Object), expect.objectContaining({
        resized: true,
      }));
    });

    it('should not commit if size did not change', () => {
      const result = resizeEngine.endResize();

      expect(result).toBe(false);
      expect(emit).toHaveBeenCalledWith('resize:end', expect.any(Object), expect.objectContaining({
        resized: false,
      }));
    });

    it('should clean up preview element', () => {
      resizeEngine.endResize();

      expect(gridElement.querySelector('.iazd-resize-preview')).toBeNull();
    });

    it('should reset resize state', () => {
      resizeEngine.endResize();

      expect(resizeEngine.isResizing()).toBe(false);
      expect(resizeEngine.getResizeState()).toBeNull();
    });
  });

  describe('cancelResize', () => {
    beforeEach(() => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      widgetElement.setAttribute('data-widget-id', '1');
      gridElement.appendChild(widgetElement);

      resizeEngine.startResize('1', 'se', 400, 300, widgetElement);
      resizeEngine.updateResize(500, 400);
      emit.mockClear();
    });

    it('should cancel resize and revert size', () => {
      resizeEngine.cancelResize();

      expect(emit).toHaveBeenCalledWith('resize:cancel', expect.any(Object));
      expect(resizeEngine.isResizing()).toBe(false);
    });

    it('should clean up preview element', () => {
      resizeEngine.cancelResize();

      expect(gridElement.querySelector('.iazd-resize-preview')).toBeNull();
    });

    it('should not change widget state', () => {
      const originalWidget = state.widgets.find((w) => w.id === '1');
      resizeEngine.cancelResize();

      expect(setState).not.toHaveBeenCalled();
      expect(state.widgets.find((w) => w.id === '1')).toEqual(originalWidget);
    });
  });

  describe('isResizing', () => {
    it('should return false initially', () => {
      expect(resizeEngine.isResizing()).toBe(false);
    });

    it('should return true while resizing', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      gridElement.appendChild(widgetElement);

      resizeEngine.startResize('1', 'se', 400, 300, widgetElement);

      expect(resizeEngine.isResizing()).toBe(true);
    });

    it('should return false after resize ends', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      widgetElement.setAttribute('data-widget-id', '1');
      gridElement.appendChild(widgetElement);

      resizeEngine.startResize('1', 'se', 400, 300, widgetElement);
      resizeEngine.endResize();

      expect(resizeEngine.isResizing()).toBe(false);
    });
  });

  describe('getResizeState', () => {
    it('should return null when not resizing', () => {
      expect(resizeEngine.getResizeState()).toBeNull();
    });

    it('should return resize state while resizing', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      gridElement.appendChild(widgetElement);

      resizeEngine.startResize('1', 'se', 400, 300, widgetElement);
      const resizeState = resizeEngine.getResizeState();

      expect(resizeState).toBeTruthy();
      expect(resizeState?.widgetId).toBe('1');
      expect(resizeState?.handle).toBe('se');
      expect(resizeState?.isResizing).toBe(true);
    });
  });

  describe('resize handles', () => {
    const handles = ['se', 'sw', 'ne', 'nw', 'e', 'w', 's', 'n'] as const;

    handles.forEach((handle) => {
      it(`should handle ${handle} resize correctly`, () => {
        const widgetElement = document.createElement('div');
        widgetElement.style.position = 'absolute';
        widgetElement.setAttribute('data-widget-id', '1');
        gridElement.appendChild(widgetElement);

        const result = resizeEngine.startResize('1', handle, 400, 300, widgetElement);

        expect(result).toBe(true);
        expect(resizeEngine.isResizing()).toBe(true);

        resizeEngine.updateResize(500, 400);
        const resizeState = resizeEngine.getResizeState();

        expect(resizeState?.handle).toBe(handle);
      });
    });
  });

  describe('destroy', () => {
    it('should cancel active resize on destroy', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      widgetElement.setAttribute('data-widget-id', '1');
      gridElement.appendChild(widgetElement);

      resizeEngine.startResize('1', 'se', 400, 300, widgetElement);
      resizeEngine.destroy();

      expect(resizeEngine.isResizing()).toBe(false);
      expect(gridElement.querySelector('.iazd-resize-preview')).toBeNull();
    });

    it('should not throw if not resizing', () => {
      expect(() => resizeEngine.destroy()).not.toThrow();
    });
  });
});
