/**
 * GridEngine tests
 * These tests can be run with Vitest or Jest once a test framework is installed
 *
 * To set up testing:
 * npm install -D vitest @vitest/ui
 * Add to package.json scripts: "test": "vitest"
 */

import { describe, it, expect } from 'vitest';
import { GridEngine } from '../src/core/GridEngine';

describe('GridEngine', () => {
  describe('checkCollision', () => {
    it('should detect collision when widgets overlap', () => {
      const w1 = { x: 0, y: 0, w: 4, h: 3 };
      const w2 = { x: 2, y: 1, w: 4, h: 3 };
      expect(GridEngine.checkCollision(w1, w2)).toBe(true);
    });

    it('should not detect collision when widgets are adjacent horizontally', () => {
      const w1 = { x: 0, y: 0, w: 4, h: 3 };
      const w2 = { x: 4, y: 0, w: 4, h: 3 };
      expect(GridEngine.checkCollision(w1, w2)).toBe(false);
    });

    it('should not detect collision when widgets are adjacent vertically', () => {
      const w1 = { x: 0, y: 0, w: 4, h: 3 };
      const w2 = { x: 0, y: 3, w: 4, h: 3 };
      expect(GridEngine.checkCollision(w1, w2)).toBe(false);
    });

    it('should detect collision when one widget contains another', () => {
      const w1 = { x: 0, y: 0, w: 8, h: 6 };
      const w2 = { x: 2, y: 2, w: 2, h: 2 };
      expect(GridEngine.checkCollision(w1, w2)).toBe(true);
    });
  });

  describe('isWithinBounds', () => {
    it('should return true for widget within bounds', () => {
      const widget = { x: 0, y: 0, w: 4, h: 3 };
      expect(GridEngine.isWithinBounds(widget, 12)).toBe(true);
    });

    it('should return false for widget outside right bound', () => {
      const widget = { x: 10, y: 0, w: 4, h: 3 };
      expect(GridEngine.isWithinBounds(widget, 12)).toBe(false);
    });

    it('should return false for widget with negative position', () => {
      const widget = { x: -1, y: 0, w: 4, h: 3 };
      expect(GridEngine.isWithinBounds(widget, 12)).toBe(false);
    });

    it('should return false for widget at exactly right edge', () => {
      const widget = { x: 8, y: 0, w: 5, h: 3 };
      expect(GridEngine.isWithinBounds(widget, 12)).toBe(false);
    });
  });

  describe('snapToGrid', () => {
    it('should round to nearest integer', () => {
      expect(GridEngine.snapToGrid(2.3)).toBe(2);
      expect(GridEngine.snapToGrid(2.7)).toBe(3);
    });

    it('should handle negative values by clamping to 0', () => {
      expect(GridEngine.snapToGrid(-5)).toBe(0);
    });

    it('should handle zero', () => {
      expect(GridEngine.snapToGrid(0)).toBe(0);
    });
  });

  describe('sortWidgets', () => {
    it('should sort widgets top-to-bottom, left-to-right', () => {
      const widgets = [
        { id: '1', x: 4, y: 0, w: 4, h: 3 },
        { id: '2', x: 0, y: 0, w: 4, h: 3 },
        { id: '3', x: 0, y: 3, w: 4, h: 3 },
      ];

      const sorted = GridEngine.sortWidgets(widgets);
      expect(sorted.map((w) => w.id)).toEqual(['2', '1', '3']);
    });
  });

  describe('getBottomY', () => {
    it('should return 0 for empty array', () => {
      expect(GridEngine.getBottomY([])).toBe(0);
    });

    it('should return bottom-most y + h', () => {
      const widgets = [
        { id: '1', x: 0, y: 0, w: 4, h: 3 },
        { id: '2', x: 0, y: 3, w: 4, h: 5 }, // Bottom at y=8
        { id: '3', x: 0, y: 10, w: 4, h: 2 }, // Bottom at y=12
      ];

      expect(GridEngine.getBottomY(widgets)).toBe(12);
    });
  });

  describe('findFirstAvailablePosition', () => {
    it('should place first widget at (0, 0)', () => {
      const position = GridEngine.findFirstAvailablePosition({ w: 4, h: 3 }, [], 12);
      expect(position).toEqual({ x: 0, y: 0 });
    });

    it('should find next available position horizontally', () => {
      const widgets = [{ id: '1', x: 0, y: 0, w: 4, h: 3 }];
      const position = GridEngine.findFirstAvailablePosition({ w: 4, h: 3 }, widgets, 12);
      expect(position).toEqual({ x: 4, y: 0 });
    });

    it('should wrap to next row when horizontal space runs out', () => {
      const widgets = [
        { id: '1', x: 0, y: 0, w: 6, h: 3 },
        { id: '2', x: 6, y: 0, w: 6, h: 3 },
      ];
      const position = GridEngine.findFirstAvailablePosition({ w: 4, h: 3 }, widgets, 12);
      expect(position).toEqual({ x: 0, y: 3 });
    });

    it('should handle oversized widgets by placing at x=0', () => {
      const widgets = [{ id: '1', x: 0, y: 0, w: 4, h: 3 }];
      const position = GridEngine.findFirstAvailablePosition({ w: 15, h: 3 }, widgets, 12);
      expect(position.x).toBe(0);
      expect(position.y).toBeGreaterThanOrEqual(3);
    });
  });

  describe('compactLayout', () => {
    it('should move widgets up to fill gaps', () => {
      const widgets = [
        { id: '1', x: 0, y: 0, w: 4, h: 3 },
        { id: '2', x: 0, y: 10, w: 4, h: 3 }, // Gap between
      ];

      const compacted = GridEngine.compactLayout(widgets);
      expect(compacted.find((w) => w.id === '2').y).toBe(3); // Should move to y=3
    });

    it('should maintain widget order', () => {
      const widgets = [
        { id: '1', x: 0, y: 0, w: 4, h: 3 },
        { id: '2', x: 4, y: 0, w: 4, h: 3 },
      ];

      const compacted = GridEngine.compactLayout(widgets);
      expect(compacted.find((w) => w.id === '1').y).toBe(0);
      expect(compacted.find((w) => w.id === '2').y).toBe(0);
    });
  });

  describe('resolveCollisions', () => {
    it('should push down colliding widgets', () => {
      const movedWidget = { id: '1', x: 0, y: 0, w: 4, h: 3 };
      const widgets = [
        { id: '1', x: 0, y: 5, w: 4, h: 3 },
        { id: '2', x: 0, y: 2, w: 4, h: 3 }, // Collides with moved widget
      ];

      const resolved = GridEngine.resolveCollisions(movedWidget, widgets);
      const widget2 = resolved.find((w) => w.id === '2');

      expect(widget2.y).toBeGreaterThanOrEqual(3); // Should be pushed down
    });

    it('should not move locked widgets', () => {
      const movedWidget = { id: '1', x: 0, y: 0, w: 4, h: 3 };
      const widgets = [
        { id: '1', x: 0, y: 5, w: 4, h: 3 },
        { id: '2', x: 0, y: 2, w: 4, h: 3, locked: true },
      ];

      const resolved = GridEngine.resolveCollisions(movedWidget, widgets);
      const widget2 = resolved.find((w) => w.id === '2');

      expect(widget2.y).toBe(2); // Should remain at original position
    });
  });

  describe('moveWidget', () => {
    it('should move widget to new position', () => {
      const widgets = [{ id: '1', x: 0, y: 0, w: 4, h: 3 }];

      const result = GridEngine.moveWidget('1', 4, 2, widgets, 12);
      expect(result).toBeTruthy();
      expect(result.find((w) => w.id === '1')).toMatchObject({ x: 4, y: 2 });
    });

    it('should return null for non-existent widget', () => {
      const widgets = [{ id: '1', x: 0, y: 0, w: 4, h: 3 }];

      const result = GridEngine.moveWidget('999', 4, 2, widgets, 12);
      expect(result).toBeNull();
    });

    it('should return null for locked widget', () => {
      const widgets = [{ id: '1', x: 0, y: 0, w: 4, h: 3, locked: true }];

      const result = GridEngine.moveWidget('1', 4, 2, widgets, 12);
      expect(result).toBeNull();
    });

    it('should clamp position to grid bounds', () => {
      const widgets = [{ id: '1', x: 0, y: 0, w: 4, h: 3 }];

      const result = GridEngine.moveWidget('1', 15, 2, widgets, 12);
      expect(result.find((w) => w.id === '1').x).toBeLessThanOrEqual(8); // 12 - 4
    });
  });

  describe('resizeWidget', () => {
    it('should resize widget', () => {
      const widgets = [{ id: '1', x: 0, y: 0, w: 4, h: 3 }];

      const result = GridEngine.resizeWidget('1', 6, 5, widgets, 12);
      expect(result).toBeTruthy();
      expect(result.find((w) => w.id === '1')).toMatchObject({ w: 6, h: 5 });
    });

    it('should respect minW and minH constraints', () => {
      const widgets = [{ id: '1', x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 2 }];

      const result = GridEngine.resizeWidget('1', 1, 1, widgets, 12);
      const widget = result.find((w) => w.id === '1');
      expect(widget.w).toBe(3);
      expect(widget.h).toBe(2);
    });

    it('should respect maxW and maxH constraints', () => {
      const widgets = [{ id: '1', x: 0, y: 0, w: 4, h: 3, maxW: 6, maxH: 4 }];

      const result = GridEngine.resizeWidget('1', 10, 10, widgets, 12);
      const widget = result.find((w) => w.id === '1');
      expect(widget.w).toBe(6);
      expect(widget.h).toBe(4);
    });

    it('should return null for noResize widget', () => {
      const widgets = [{ id: '1', x: 0, y: 0, w: 4, h: 3, noResize: true }];

      const result = GridEngine.resizeWidget('1', 6, 5, widgets, 12);
      expect(result).toBeNull();
    });
  });

  describe('canPlaceWidget', () => {
    it('should return true for valid placement', () => {
      const widgets = [{ id: '1', x: 0, y: 0, w: 4, h: 3 }];
      const widget = { x: 4, y: 0, w: 4, h: 3 };

      expect(GridEngine.canPlaceWidget(widget, widgets, 12)).toBe(true);
    });

    it('should return false for colliding placement', () => {
      const widgets = [{ id: '1', x: 0, y: 0, w: 4, h: 3 }];
      const widget = { x: 2, y: 1, w: 4, h: 3 };

      expect(GridEngine.canPlaceWidget(widget, widgets, 12)).toBe(false);
    });

    it('should return false for out-of-bounds placement', () => {
      const widgets = [];
      const widget = { x: 10, y: 0, w: 4, h: 3 };

      expect(GridEngine.canPlaceWidget(widget, widgets, 12)).toBe(false);
    });

    it('should exclude widget with matching id', () => {
      const widgets = [{ id: '1', x: 0, y: 0, w: 4, h: 3 }];
      const widget = { x: 0, y: 0, w: 4, h: 3 };

      expect(GridEngine.canPlaceWidget(widget, widgets, 12, '1')).toBe(true);
    });
  });
});
