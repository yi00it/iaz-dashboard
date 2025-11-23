/**
 * GridEngine - Pure computational grid logic
 * Handles collision detection, auto-positioning, layout compaction
 * No DOM dependencies - only operates on widget data
 */

import type { Widget } from '../types';

export interface GridRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class GridEngine {
  /**
   * Check if two widgets collide (overlap)
   */
  static checkCollision(w1: GridRect, w2: GridRect): boolean {
    return !(
      w1.x + w1.w <= w2.x || // w1 is left of w2
      w2.x + w2.w <= w1.x || // w2 is left of w1
      w1.y + w1.h <= w2.y || // w1 is above w2
      w2.y + w2.h <= w1.y    // w2 is above w1
    );
  }

  /**
   * Get all widgets that collide with the given widget
   */
  static getCollidingWidgets(widget: Widget, widgets: Widget[]): Widget[] {
    return widgets.filter((w) => {
      if (w.id === widget.id) return false;
      return this.checkCollision(widget, w);
    });
  }

  /**
   * Check if widget is within grid bounds
   */
  static isWithinBounds(widget: GridRect, columns: number): boolean {
    return widget.x >= 0 && widget.x + widget.w <= columns && widget.y >= 0;
  }

  /**
   * Snap a value to the nearest grid unit
   */
  static snapToGrid(value: number): number {
    return Math.max(0, Math.round(value));
  }

  /**
   * Sort widgets by position (top to bottom, left to right)
   */
  static sortWidgets(widgets: Widget[]): Widget[] {
    return [...widgets].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  }

  /**
   * Get the bottom-most Y coordinate of all widgets
   */
  static getBottomY(widgets: Widget[]): number {
    if (widgets.length === 0) return 0;
    return Math.max(...widgets.map((w) => w.y + w.h));
  }

  /**
   * Find the first available position for a widget
   * Scans grid from top-left, row by row
   */
  static findFirstAvailablePosition(
    widget: Partial<Widget> & { w: number; h: number },
    widgets: Widget[],
    columns: number
  ): { x: number; y: number } {
    const w = widget.w;
    const h = widget.h;

    // If widget is too wide, place at x=0
    if (w > columns) {
      const y = this.getBottomY(widgets);
      return { x: 0, y };
    }

    // Scan grid row by row
    const maxY = this.getBottomY(widgets) + 10; // Scan up to 10 rows beyond current layout

    for (let y = 0; y <= maxY; y++) {
      for (let x = 0; x <= columns - w; x++) {
        const testWidget: GridRect = { x, y, w, h };

        // Check if position is free
        const hasCollision = widgets.some((existing) =>
          this.checkCollision(testWidget, existing)
        );

        if (!hasCollision) {
          return { x, y };
        }
      }
    }

    // Fallback: place at bottom
    return { x: 0, y: this.getBottomY(widgets) };
  }

  /**
   * Compact layout by moving widgets up to fill gaps
   * Used in float mode
   */
  static compactLayout(widgets: Widget[]): Widget[] {
    const sorted = this.sortWidgets(widgets);
    const compacted: Widget[] = [];

    for (const widget of sorted) {
      const moved = { ...widget };

      // Try to move widget up as far as possible
      while (moved.y > 0) {
        const testWidget = { ...moved, y: moved.y - 1 };

        // Check if position above is free
        const hasCollision = compacted.some((w) =>
          this.checkCollision(testWidget, w)
        );

        if (hasCollision) break;

        moved.y = testWidget.y;
      }

      compacted.push(moved);
    }

    return compacted;
  }

  /**
   * Resolve collisions by pushing overlapping widgets down
   * Returns new array of widgets with collisions resolved
   */
  static resolveCollisions(movedWidget: Widget, widgets: Widget[]): Widget[] {
    const result = widgets.map((w) => ({ ...w }));
    const moved = result.find((w) => w.id === movedWidget.id);

    if (!moved) return result;

    // Update moved widget position
    Object.assign(moved, movedWidget);

    // Keep pushing down until no collisions
    let hasChanges = true;
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loops

    while (hasChanges && iterations < maxIterations) {
      hasChanges = false;
      iterations++;

      // Check all widgets for collisions
      for (let i = 0; i < result.length; i++) {
        const widget = result[i];
        if (widget.locked || widget.noMove) continue;

        const colliding = this.getCollidingWidgets(widget, result);

        if (colliding.length > 0) {
          // Find the lowest colliding widget
          const lowestY = Math.max(...colliding.map((w) => w.y + w.h));

          // Push widget below the collision
          if (widget.y < lowestY) {
            widget.y = lowestY;
            hasChanges = true;
          }
        }
      }
    }

    return result;
  }

  /**
   * Move a widget to a new position and resolve collisions
   */
  static moveWidget(
    widgetId: Widget['id'],
    x: number,
    y: number,
    widgets: Widget[],
    columns: number
  ): Widget[] | null {
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) return null;

    if (widget.locked || widget.noMove) return null;

    // Create moved widget
    const movedWidget: Widget = {
      ...widget,
      x: this.snapToGrid(x),
      y: this.snapToGrid(y),
    };

    // Check bounds
    if (!this.isWithinBounds(movedWidget, columns)) {
      // Clamp to bounds
      movedWidget.x = Math.max(0, Math.min(movedWidget.x, columns - movedWidget.w));
      movedWidget.y = Math.max(0, movedWidget.y);
    }

    // Resolve collisions
    return this.resolveCollisions(movedWidget, widgets);
  }

  /**
   * Resize a widget and resolve collisions
   */
  static resizeWidget(
    widgetId: Widget['id'],
    w: number,
    h: number,
    widgets: Widget[],
    columns: number
  ): Widget[] | null {
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) return null;

    if (widget.locked || widget.noResize) return null;

    // Apply min/max constraints
    const minW = widget.minW ?? 1;
    const minH = widget.minH ?? 1;
    const maxW = widget.maxW ?? columns;
    const maxH = widget.maxH ?? Infinity;

    const newW = Math.max(minW, Math.min(maxW, this.snapToGrid(w)));
    const newH = Math.max(minH, Math.min(maxH, this.snapToGrid(h)));

    // Create resized widget
    const resizedWidget: Widget = {
      ...widget,
      w: newW,
      h: newH,
    };

    // Check bounds
    if (!this.isWithinBounds(resizedWidget, columns)) {
      // Try to adjust position to fit
      resizedWidget.x = Math.max(0, Math.min(resizedWidget.x, columns - resizedWidget.w));
    }

    // Resolve collisions
    return this.resolveCollisions(resizedWidget, widgets);
  }

  /**
   * Check if a widget can be placed at a position without collision
   */
  static canPlaceWidget(
    widget: GridRect,
    widgets: Widget[],
    columns: number,
    excludeId?: Widget['id']
  ): boolean {
    if (!this.isWithinBounds(widget, columns)) return false;

    const filtered = excludeId ? widgets.filter((w) => w.id !== excludeId) : widgets;

    return !filtered.some((w) => this.checkCollision(widget, w));
  }
}
