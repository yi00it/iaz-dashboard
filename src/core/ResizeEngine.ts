/**
 * ResizeEngine - Pointer-based widget resizing
 * Handles corner and edge resize operations
 */

import type { Widget, ID, DashboardState } from '../types';
import { GridEngine } from './GridEngine';

export type ResizeHandle = 'se' | 'sw' | 'ne' | 'nw' | 'e' | 's' | 'w' | 'n';

interface ResizeState {
  widgetId: ID;
  widget: Widget;
  handle: ResizeHandle;
  startPointerX: number;
  startPointerY: number;
  startWidgetX: number;
  startWidgetY: number;
  startWidgetW: number;
  startWidgetH: number;
  currentW: number;
  currentH: number;
  currentX: number;
  currentY: number;
  isResizing: boolean;
}

export class ResizeEngine {
  private state: ResizeState | null = null;
  private previewElement: HTMLElement | null = null;
  private autoScrollInterval: number | null = null;

  private readonly AUTO_SCROLL_THRESHOLD = 50; // pixels from edge
  private readonly AUTO_SCROLL_SPEED = 10; // pixels per frame

  constructor(
    private getState: () => DashboardState,
    private setState: (state: DashboardState) => void,
    private emit: (event: string, ...args: any[]) => void,
    private container: HTMLElement,
    private gridElement: HTMLElement,
    private options: {
      columns: number;
      rowHeight: number;
      margin: number;
      animate: boolean;
    }
  ) {}

  /**
   * Check if a widget is resizable
   */
  public canResize(widgetId: ID): boolean {
    const state = this.getState();
    const widget = state.widgets.find((w) => w.id === widgetId);
    if (!widget) return false;
    return !widget.locked && !widget.noResize;
  }

  /**
   * Start resizing a widget
   */
  public startResize(
    widgetId: ID,
    handle: ResizeHandle,
    pointerX: number,
    pointerY: number,
    widgetElement: HTMLElement
  ): boolean {
    if (!this.canResize(widgetId)) return false;

    const state = this.getState();
    const widget = state.widgets.find((w) => w.id === widgetId);
    if (!widget) return false;

    this.state = {
      widgetId,
      widget: { ...widget },
      handle,
      startPointerX: pointerX,
      startPointerY: pointerY,
      startWidgetX: widget.x,
      startWidgetY: widget.y,
      startWidgetW: widget.w,
      startWidgetH: widget.h,
      currentW: widget.w,
      currentH: widget.h,
      currentX: widget.x,
      currentY: widget.y,
      isResizing: true,
    };

    // Create preview element
    this.createPreview(widget);

    // Add resizing class to original widget
    widgetElement.classList.add('iazd-resizing');

    // Disable animations temporarily for smoother resizing
    if (this.options.animate) {
      this.gridElement.classList.remove('iazd-animate');
    }

    this.emit('interaction:start', 'resize', widget);
    this.emit('resize:start', widget, { w: widget.w, h: widget.h, handle });

    return true;
  }

  /**
   * Update resize dimensions
   */
  public updateResize(pointerX: number, pointerY: number): void {
    if (!this.state || !this.state.isResizing) return;

    const { handle, startPointerX, startPointerY, startWidgetW, startWidgetH, startWidgetX, startWidgetY } =
      this.state;

    // Calculate delta in pixels
    const deltaX = pointerX - startPointerX;
    const deltaY = pointerY - startPointerY;

    // Convert delta to grid units
    const gridRect = this.gridElement.getBoundingClientRect();
    const columnWidth = gridRect.width / this.options.columns;
    const deltaGridW = Math.round(deltaX / columnWidth);
    const deltaGridH = Math.round(deltaY / (this.options.rowHeight + this.options.margin));

    let newW = startWidgetW;
    let newH = startWidgetH;
    let newX = startWidgetX;
    let newY = startWidgetY;

    // Apply resize based on handle
    switch (handle) {
      case 'se': // Southeast (bottom-right)
        newW = startWidgetW + deltaGridW;
        newH = startWidgetH + deltaGridH;
        break;
      case 'sw': // Southwest (bottom-left)
        newW = startWidgetW - deltaGridW;
        newH = startWidgetH + deltaGridH;
        newX = startWidgetX + deltaGridW;
        break;
      case 'ne': // Northeast (top-right)
        newW = startWidgetW + deltaGridW;
        newH = startWidgetH - deltaGridH;
        newY = startWidgetY + deltaGridH;
        break;
      case 'nw': // Northwest (top-left)
        newW = startWidgetW - deltaGridW;
        newH = startWidgetH - deltaGridH;
        newX = startWidgetX + deltaGridW;
        newY = startWidgetY + deltaGridH;
        break;
      case 'e': // East (right edge)
        newW = startWidgetW + deltaGridW;
        break;
      case 'w': // West (left edge)
        newW = startWidgetW - deltaGridW;
        newX = startWidgetX + deltaGridW;
        break;
      case 's': // South (bottom edge)
        newH = startWidgetH + deltaGridH;
        break;
      case 'n': // North (top edge)
        newH = startWidgetH - deltaGridH;
        newY = startWidgetY + deltaGridH;
        break;
    }

    // Apply constraints
    const widget = this.state.widget;
    const minW = widget.minW ?? 1;
    const minH = widget.minH ?? 1;
    const maxW = widget.maxW ?? this.options.columns;
    const maxH = widget.maxH ?? Infinity;

    newW = Math.max(minW, Math.min(maxW, newW));
    newH = Math.max(minH, Math.min(maxH, newH));

    // Ensure widget stays within grid bounds
    if (newX + newW > this.options.columns) {
      if (handle.includes('w')) {
        newX = this.options.columns - newW;
      } else {
        newW = this.options.columns - newX;
      }
    }

    // Prevent negative positions
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    // Update state
    this.state.currentW = newW;
    this.state.currentH = newH;
    this.state.currentX = newX;
    this.state.currentY = newY;

    // Update preview
    this.updatePreview(newX, newY, newW, newH);

    // Check auto-scroll
    this.checkAutoScroll(pointerX, pointerY);

    this.emit('resize:move', this.state.widget, { w: newW, h: newH, x: newX, y: newY });
  }

  /**
   * End resize (commit new size)
   */
  public endResize(): boolean {
    if (!this.state || !this.state.isResizing) return false;

    const { widgetId, currentW, currentH, currentX, currentY, startWidgetW, startWidgetH, startWidgetX, startWidgetY } =
      this.state;

    // Clean up
    this.cleanup();

    // Check if size actually changed
    const sizeChanged = currentW !== startWidgetW || currentH !== startWidgetH;
    const positionChanged = currentX !== startWidgetX || currentY !== startWidgetY;
    const changed = sizeChanged || positionChanged;

    if (!changed) {
      this.emit('resize:end', this.state.widget, { w: currentW, h: currentH, resized: false });
      this.emit('interaction:end', 'resize', this.state.widget, false);
      this.state = null;
      return false;
    }

    // Update widget using GridEngine
    const state = this.getState();
    let result = state.widgets.map((w) => ({ ...w }));

    // Find and update the widget
    const widgetIndex = result.findIndex((w) => w.id === widgetId);
    if (widgetIndex !== -1) {
      result[widgetIndex] = {
        ...result[widgetIndex],
        x: currentX,
        y: currentY,
        w: currentW,
        h: currentH,
      };

      // Resolve collisions
      result = GridEngine.resolveCollisions(result[widgetIndex], result);

      this.setState({ ...state, widgets: result });

      const updatedWidget = result.find((w) => w.id === widgetId);
      this.emit('resize:end', updatedWidget, { w: currentW, h: currentH, resized: true });
      this.emit('interaction:end', 'resize', updatedWidget, true);
    }

    this.state = null;
    return true;
  }

  /**
   * Cancel resize (revert to original size)
   */
  public cancelResize(): void {
    if (!this.state || !this.state.isResizing) return;

    const widget = this.state.widget;

    this.cleanup();
    this.emit('resize:cancel', widget);

    this.state = null;
  }

  /**
   * Check if currently resizing
   */
  public isResizing(): boolean {
    return this.state !== null && this.state.isResizing;
  }

  /**
   * Get current resize state
   */
  public getResizeState(): ResizeState | null {
    return this.state ? { ...this.state } : null;
  }

  /**
   * Create preview element (shows new size)
   */
  private createPreview(widget: Widget): void {
    this.previewElement = document.createElement('div');
    this.previewElement.className = 'iazd-resize-preview';
    this.previewElement.style.position = 'absolute';
    this.previewElement.style.pointerEvents = 'none';
    this.previewElement.style.zIndex = '998';

    this.gridElement.appendChild(this.previewElement);

    // Initial position
    this.updatePreview(widget.x, widget.y, widget.w, widget.h);
  }

  /**
   * Update preview dimensions
   */
  private updatePreview(gridX: number, gridY: number, gridW: number, gridH: number): void {
    if (!this.previewElement || !this.state) return;

    const columnWidth = 100 / this.options.columns;

    this.previewElement.style.left = `${gridX * columnWidth}%`;
    this.previewElement.style.top = `${gridY * this.options.rowHeight + gridY * this.options.margin}px`;
    this.previewElement.style.width = `calc(${gridW * columnWidth}% - ${this.options.margin}px)`;
    this.previewElement.style.height = `${gridH * this.options.rowHeight + (gridH - 1) * this.options.margin}px`;

    // Check for collisions and update preview style
    const state = this.getState();
    const otherWidgets = state.widgets.filter((w) => w.id !== this.state!.widgetId);
    const testWidget = { ...this.state!.widget, x: gridX, y: gridY, w: gridW, h: gridH };
    const hasCollision = GridEngine.getCollidingWidgets(testWidget, otherWidgets).length > 0;

    if (hasCollision) {
      this.previewElement.classList.add('iazd-resize-preview-collision');
    } else {
      this.previewElement.classList.remove('iazd-resize-preview-collision');
    }
  }

  /**
   * Check and handle auto-scroll
   */
  private checkAutoScroll(clientX: number, clientY: number): void {
    const containerRect = this.container.getBoundingClientRect();
    const threshold = this.AUTO_SCROLL_THRESHOLD;
    const speed = this.AUTO_SCROLL_SPEED;

    let scrollX = 0;
    let scrollY = 0;

    // Check horizontal scroll
    if (clientX < containerRect.left + threshold) {
      scrollX = -speed;
    } else if (clientX > containerRect.right - threshold) {
      scrollX = speed;
    }

    // Check vertical scroll
    if (clientY < containerRect.top + threshold) {
      scrollY = -speed;
    } else if (clientY > containerRect.bottom - threshold) {
      scrollY = speed;
    }

    // Apply scroll
    if (scrollX !== 0 || scrollY !== 0) {
      if (!this.autoScrollInterval) {
        this.autoScrollInterval = window.setInterval(() => {
          this.container.scrollLeft += scrollX;
          this.container.scrollTop += scrollY;
        }, 16); // ~60fps
      }
    } else {
      this.stopAutoScroll();
    }
  }

  /**
   * Stop auto-scroll
   */
  private stopAutoScroll(): void {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

  /**
   * Clean up resize elements and state
   */
  private cleanup(): void {
    // Remove preview
    if (this.previewElement) {
      this.previewElement.remove();
      this.previewElement = null;
    }

    // Stop auto-scroll
    this.stopAutoScroll();

    // Remove resizing class
    if (this.state) {
      const widgetElement = this.gridElement.querySelector(`[data-widget-id="${this.state.widgetId}"]`);
      if (widgetElement) {
        widgetElement.classList.remove('iazd-resizing');
      }
    }

    // Re-enable animations
    if (this.options.animate) {
      this.gridElement.classList.add('iazd-animate');
    }
  }

  /**
   * Destroy resize engine (cleanup)
   */
  public destroy(): void {
    if (this.isResizing()) {
      this.cancelResize();
    }
    this.cleanup();
  }
}
