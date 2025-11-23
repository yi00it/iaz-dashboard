/**
 * DragEngine tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DragEngine } from '../src/core/DragEngine';
import type { DashboardState, Widget } from '../src/types';

describe('DragEngine', () => {
  let dragEngine: DragEngine;
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
        { id: '2', x: 4, y: 0, w: 4, h: 3, content: 'Widget 2' },
        { id: '3', x: 0, y: 3, w: 4, h: 3, content: 'Widget 3', locked: true },
        { id: '4', x: 4, y: 3, w: 4, h: 3, content: 'Widget 4', noMove: true },
      ],
      currentBreakpoint: 'lg',
    };

    setState = vi.fn((newState: DashboardState) => {
      state = newState;
    });

    emit = vi.fn();

    const getState = () => state;

    dragEngine = new DragEngine(
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

  describe('canDrag', () => {
    it('should return true for draggable widget', () => {
      expect(dragEngine.canDrag('1')).toBe(true);
    });

    it('should return false for locked widget', () => {
      expect(dragEngine.canDrag('3')).toBe(false);
    });

    it('should return false for noMove widget', () => {
      expect(dragEngine.canDrag('4')).toBe(false);
    });

    it('should return false for non-existent widget', () => {
      expect(dragEngine.canDrag('999')).toBe(false);
    });
  });

  describe('startDrag', () => {
    it('should start dragging a draggable widget', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      widgetElement.style.left = '0px';
      widgetElement.style.top = '0px';
      widgetElement.style.width = '400px';
      widgetElement.style.height = '310px';
      gridElement.appendChild(widgetElement);

      const result = dragEngine.startDrag('1', 50, 50, widgetElement);

      expect(result).toBe(true);
      expect(dragEngine.isDragging()).toBe(true);
      expect(emit).toHaveBeenCalledWith('drag:start', expect.any(Object), { x: 0, y: 0 });
    });

    it('should not start dragging a locked widget', () => {
      const widgetElement = document.createElement('div');
      gridElement.appendChild(widgetElement);

      const result = dragEngine.startDrag('3', 50, 50, widgetElement);

      expect(result).toBe(false);
      expect(dragEngine.isDragging()).toBe(false);
    });

    it('should create ghost and preview elements', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      widgetElement.style.left = '0px';
      widgetElement.style.top = '0px';
      widgetElement.style.width = '400px';
      widgetElement.style.height = '310px';
      gridElement.appendChild(widgetElement);

      dragEngine.startDrag('1', 50, 50, widgetElement);

      expect(document.querySelector('.iazd-widget-ghost')).toBeTruthy();
      expect(gridElement.querySelector('.iazd-drag-preview')).toBeTruthy();
    });

    it('should add dragging class to widget element', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      widgetElement.style.left = '0px';
      widgetElement.style.top = '0px';
      gridElement.appendChild(widgetElement);

      dragEngine.startDrag('1', 50, 50, widgetElement);

      expect(widgetElement.classList.contains('iazd-dragging')).toBe(true);
    });
  });

  describe('updateDrag', () => {
    beforeEach(() => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      widgetElement.style.left = '0px';
      widgetElement.style.top = '0px';
      widgetElement.style.width = '400px';
      widgetElement.style.height = '310px';
      gridElement.appendChild(widgetElement);

      dragEngine.startDrag('1', 50, 50, widgetElement);
      emit.mockClear();
    });

    it('should update drag position', () => {
      dragEngine.updateDrag(150, 150);

      expect(emit).toHaveBeenCalledWith('drag:move', expect.any(Object), expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
      }));
    });

    it('should update ghost element position', () => {
      dragEngine.updateDrag(150, 150);

      const ghost = document.querySelector('.iazd-widget-ghost') as HTMLElement;
      expect(ghost).toBeTruthy();
      expect(ghost.style.position).toBe('fixed');
    });

    it('should do nothing if not dragging', () => {
      dragEngine.cancelDrag();
      emit.mockClear();

      dragEngine.updateDrag(150, 150);

      expect(emit).not.toHaveBeenCalled();
    });
  });

  describe('endDrag', () => {
    beforeEach(() => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      widgetElement.style.left = '0px';
      widgetElement.style.top = '0px';
      widgetElement.style.width = '400px';
      widgetElement.style.height = '310px';
      widgetElement.setAttribute('data-widget-id', '1');
      gridElement.appendChild(widgetElement);

      dragEngine.startDrag('1', 50, 50, widgetElement);
      emit.mockClear();
    });

    it('should commit widget position change', () => {
      dragEngine.updateDrag(500, 300);
      const result = dragEngine.endDrag();

      expect(result).toBe(true);
      expect(setState).toHaveBeenCalled();
      expect(emit).toHaveBeenCalledWith('drag:end', expect.any(Object), expect.objectContaining({
        moved: true,
      }));
    });

    it('should not commit if position did not change', () => {
      const result = dragEngine.endDrag();

      expect(result).toBe(false);
      expect(emit).toHaveBeenCalledWith('drag:end', expect.any(Object), expect.objectContaining({
        moved: false,
      }));
    });

    it('should clean up ghost and preview elements', () => {
      dragEngine.endDrag();

      expect(document.querySelector('.iazd-widget-ghost')).toBeNull();
      expect(gridElement.querySelector('.iazd-drag-preview')).toBeNull();
    });

    it('should reset drag state', () => {
      dragEngine.endDrag();

      expect(dragEngine.isDragging()).toBe(false);
      expect(dragEngine.getDragState()).toBeNull();
    });
  });

  describe('cancelDrag', () => {
    beforeEach(() => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      widgetElement.style.left = '0px';
      widgetElement.style.top = '0px';
      widgetElement.style.width = '400px';
      widgetElement.style.height = '310px';
      widgetElement.setAttribute('data-widget-id', '1');
      gridElement.appendChild(widgetElement);

      dragEngine.startDrag('1', 50, 50, widgetElement);
      dragEngine.updateDrag(500, 300);
      emit.mockClear();
    });

    it('should cancel drag and revert position', () => {
      dragEngine.cancelDrag();

      expect(emit).toHaveBeenCalledWith('drag:cancel', expect.any(Object));
      expect(dragEngine.isDragging()).toBe(false);
    });

    it('should clean up ghost and preview elements', () => {
      dragEngine.cancelDrag();

      expect(document.querySelector('.iazd-widget-ghost')).toBeNull();
      expect(gridElement.querySelector('.iazd-drag-preview')).toBeNull();
    });

    it('should not change widget state', () => {
      const originalWidget = state.widgets.find((w) => w.id === '1');
      dragEngine.cancelDrag();

      expect(setState).not.toHaveBeenCalled();
      expect(state.widgets.find((w) => w.id === '1')).toEqual(originalWidget);
    });
  });

  describe('isDragging', () => {
    it('should return false initially', () => {
      expect(dragEngine.isDragging()).toBe(false);
    });

    it('should return true while dragging', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      gridElement.appendChild(widgetElement);

      dragEngine.startDrag('1', 50, 50, widgetElement);

      expect(dragEngine.isDragging()).toBe(true);
    });

    it('should return false after drag ends', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      widgetElement.setAttribute('data-widget-id', '1');
      gridElement.appendChild(widgetElement);

      dragEngine.startDrag('1', 50, 50, widgetElement);
      dragEngine.endDrag();

      expect(dragEngine.isDragging()).toBe(false);
    });
  });

  describe('getDragState', () => {
    it('should return null when not dragging', () => {
      expect(dragEngine.getDragState()).toBeNull();
    });

    it('should return drag state while dragging', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      gridElement.appendChild(widgetElement);

      dragEngine.startDrag('1', 50, 50, widgetElement);
      const dragState = dragEngine.getDragState();

      expect(dragState).toBeTruthy();
      expect(dragState?.widgetId).toBe('1');
      expect(dragState?.isDragging).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should cancel active drag on destroy', () => {
      const widgetElement = document.createElement('div');
      widgetElement.style.position = 'absolute';
      widgetElement.setAttribute('data-widget-id', '1');
      gridElement.appendChild(widgetElement);

      dragEngine.startDrag('1', 50, 50, widgetElement);
      dragEngine.destroy();

      expect(dragEngine.isDragging()).toBe(false);
      expect(document.querySelector('.iazd-widget-ghost')).toBeNull();
    });

    it('should not throw if not dragging', () => {
      expect(() => dragEngine.destroy()).not.toThrow();
    });
  });
});
