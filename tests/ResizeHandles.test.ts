/**
 * Resize Handles tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createResizeHandles,
  createResizeHandle,
  getHandleType,
  isResizeHandle,
} from '../src/dom/resizeHandles';
import type { ResizeHandle } from '../src/types';

describe('ResizeHandles', () => {
  describe('createResizeHandle', () => {
    it('should create a single resize handle element', () => {
      const handle = createResizeHandle('se');

      expect(handle).toBeInstanceOf(HTMLElement);
      expect(handle.className).toBe('iazd-resize-handle iazd-resize-handle-se');
      expect(handle.getAttribute('data-resize-handle')).toBe('se');
    });

    it('should set correct cursor for each handle position', () => {
      const cursorMap: Record<ResizeHandle, string> = {
        se: 'nwse-resize',
        sw: 'nesw-resize',
        ne: 'nesw-resize',
        nw: 'nwse-resize',
        e: 'ew-resize',
        w: 'ew-resize',
        s: 'ns-resize',
        n: 'ns-resize',
      };

      for (const [position, expectedCursor] of Object.entries(cursorMap)) {
        const handle = createResizeHandle(position as ResizeHandle);
        expect(handle.style.cursor).toBe(expectedCursor);
      }
    });
  });

  describe('createResizeHandles', () => {
    it('should create default handles when no array provided', () => {
      const handles = createResizeHandles();

      expect(handles).toHaveLength(3);
      expect(handles[0].getAttribute('data-resize-handle')).toBe('se');
      expect(handles[1].getAttribute('data-resize-handle')).toBe('s');
      expect(handles[2].getAttribute('data-resize-handle')).toBe('e');
    });

    it('should create handles for all specified positions', () => {
      const positions: ResizeHandle[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
      const handles = createResizeHandles(positions);

      expect(handles).toHaveLength(8);
      positions.forEach((pos, index) => {
        expect(handles[index].getAttribute('data-resize-handle')).toBe(pos);
      });
    });

    it('should create empty array when empty array provided', () => {
      const handles = createResizeHandles([]);

      expect(handles).toHaveLength(0);
    });
  });

  describe('getHandleType', () => {
    it('should return handle type from element with data attribute', () => {
      const handle = createResizeHandle('ne');

      expect(getHandleType(handle)).toBe('ne');
    });

    it('should return null for element without data attribute', () => {
      const element = document.createElement('div');

      expect(getHandleType(element)).toBeNull();
    });

    it('should return correct type for all handle positions', () => {
      const positions: ResizeHandle[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

      for (const pos of positions) {
        const handle = createResizeHandle(pos);
        expect(getHandleType(handle)).toBe(pos);
      }
    });
  });

  describe('isResizeHandle', () => {
    it('should return true for resize handle element', () => {
      const handle = createResizeHandle('s');

      expect(isResizeHandle(handle)).toBe(true);
    });

    it('should return false for non-resize handle element', () => {
      const element = document.createElement('div');

      expect(isResizeHandle(element)).toBe(false);
    });

    it('should return false for element with partial class name', () => {
      const element = document.createElement('div');
      element.className = 'iazd-resize';

      expect(isResizeHandle(element)).toBe(false);
    });

    it('should return true for element with additional classes', () => {
      const handle = createResizeHandle('w');
      handle.classList.add('custom-class');

      expect(isResizeHandle(handle)).toBe(true);
    });
  });
});
