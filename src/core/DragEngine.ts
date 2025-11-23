/**
 * DragEngine - Pointer-based drag & drop
 * Handles mouse and touch events using Pointer Events API
 */

import type { Widget, ID, DashboardState } from '../types';
import { GridEngine } from './GridEngine';

interface DragState {
  widgetId: ID;
  widget: Widget;
  startPointerX: number;
  startPointerY: number;
  startWidgetX: number;
  startWidgetY: number;
  currentGridX: number;
  currentGridY: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
}

export class DragEngine {
  private state: DragState | null = null;
  private ghostElement: HTMLElement | null = null;
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
   * Check if a widget is draggable
   */
  public canDrag(widgetId: ID): boolean {
    const state = this.getState();
    const widget = state.widgets.find((w) => w.id === widgetId);
    if (!widget) return false;
    return !widget.locked && !widget.noMove;
  }

  /**
   * Start dragging a widget
   */
  public startDrag(widgetId: ID, pointerX: number, pointerY: number, widgetElement: HTMLElement): boolean {
    if (!this.canDrag(widgetId)) return false;

    const state = this.getState();
    const widget = state.widgets.find((w) => w.id === widgetId);
    if (!widget) return false;

    // Calculate offset from pointer to widget top-left
    const widgetRect = widgetElement.getBoundingClientRect();

    this.state = {
      widgetId,
      widget: { ...widget },
      startPointerX: pointerX,
      startPointerY: pointerY,
      startWidgetX: widget.x,
      startWidgetY: widget.y,
      currentGridX: widget.x,
      currentGridY: widget.y,
      offsetX: pointerX - widgetRect.left,
      offsetY: pointerY - widgetRect.top,
      isDragging: true,
    };

    // Create ghost element
    this.createGhost(widget, widgetElement);

    // Create preview element
    this.createPreview(widget);

    // Add dragging class to original widget
    widgetElement.classList.add('iazd-dragging');

    // Disable animations temporarily for smoother dragging
    if (this.options.animate) {
      this.gridElement.classList.remove('iazd-animate');
    }

    this.emit('interaction:start', 'drag', widget);
    this.emit('drag:start', widget, { x: widget.x, y: widget.y });

    return true;
  }

  /**
   * Update drag position
   */
  public updateDrag(pointerX: number, pointerY: number): void {
    if (!this.state || !this.state.isDragging) return;

    const gridRect = this.gridElement.getBoundingClientRect();

    // Calculate new widget position in pixels
    const newPixelX = pointerX - gridRect.left - this.state.offsetX;
    const newPixelY = pointerY - gridRect.top - this.state.offsetY;

    // Convert to grid coordinates
    const { gridX, gridY } = this.screenToGrid(newPixelX, newPixelY);

    // Update state
    this.state.currentGridX = gridX;
    this.state.currentGridY = gridY;

    // Update ghost position (follows pointer exactly)
    this.updateGhost(pointerX, pointerY);

    // Update preview position (snapped to grid)
    this.updatePreview(gridX, gridY);

    // Check auto-scroll
    this.checkAutoScroll(pointerX, pointerY);

    this.emit('drag:move', this.state.widget, { x: gridX, y: gridY });
  }

  /**
   * End drag (commit new position)
   */
  public endDrag(): boolean {
    if (!this.state || !this.state.isDragging) return false;

    const { widgetId, currentGridX, currentGridY, startWidgetX, startWidgetY } = this.state;

    // Clean up
    this.cleanup();

    // Check if position actually changed
    const moved = currentGridX !== startWidgetX || currentGridY !== startWidgetY;

    if (!moved) {
      this.emit('drag:end', this.state.widget, { x: currentGridX, y: currentGridY, moved: false });
      this.emit('interaction:end', 'drag', this.state.widget, false);
      this.state = null;
      return false;
    }

    // Update widget position using GridEngine (handles collisions)
    const state = this.getState();
    const result = GridEngine.moveWidget(widgetId, currentGridX, currentGridY, state.widgets, this.options.columns);

    if (result) {
      this.setState({ ...state, widgets: result });
      const updatedWidget = result.find((w) => w.id === widgetId);
      this.emit('drag:end', updatedWidget, { x: currentGridX, y: currentGridY, moved: true });
      this.emit('interaction:end', 'drag', updatedWidget, true);
    }

    this.state = null;
    return true;
  }

  /**
   * Cancel drag (revert to original position)
   */
  public cancelDrag(): void {
    if (!this.state || !this.state.isDragging) return;

    const widget = this.state.widget;

    this.cleanup();
    this.emit('drag:cancel', widget);

    this.state = null;
  }

  /**
   * Check if currently dragging
   */
  public isDragging(): boolean {
    return this.state !== null && this.state.isDragging;
  }

  /**
   * Get current drag state
   */
  public getDragState(): DragState | null {
    return this.state ? { ...this.state } : null;
  }

  /**
   * Convert screen coordinates to grid coordinates
   */
  private screenToGrid(pixelX: number, pixelY: number): { gridX: number; gridY: number } {
    const gridRect = this.gridElement.getBoundingClientRect();
    const columnWidth = gridRect.width / this.options.columns;

    let gridX = Math.round(pixelX / columnWidth);
    let gridY = Math.round(pixelY / (this.options.rowHeight + this.options.margin));

    // Clamp to grid bounds
    gridX = Math.max(0, Math.min(gridX, this.options.columns - (this.state?.widget.w ?? 1)));
    gridY = Math.max(0, gridY);

    return { gridX, gridY };
  }

  /**
   * Create ghost element (follows pointer)
   */
  private createGhost(_widget: Widget, originalElement: HTMLElement): void {
    this.ghostElement = document.createElement('div');
    this.ghostElement.className = 'iazd-widget-ghost';

    // Copy dimensions from original
    const rect = originalElement.getBoundingClientRect();
    this.ghostElement.style.width = `${rect.width}px`;
    this.ghostElement.style.height = `${rect.height}px`;
    this.ghostElement.style.position = 'fixed';
    this.ghostElement.style.pointerEvents = 'none';
    this.ghostElement.style.zIndex = '9999';
    this.ghostElement.style.opacity = '0.5';

    // Clone content
    const content = originalElement.querySelector('.sdb-widget-content');
    if (content) {
      this.ghostElement.appendChild(content.cloneNode(true));
    }

    document.body.appendChild(this.ghostElement);
  }

  /**
   * Update ghost position
   */
  private updateGhost(pointerX: number, pointerY: number): void {
    if (!this.ghostElement || !this.state) return;

    this.ghostElement.style.left = `${pointerX - this.state.offsetX}px`;
    this.ghostElement.style.top = `${pointerY - this.state.offsetY}px`;
  }

  /**
   * Create preview element (shows grid-snapped position)
   */
  private createPreview(_widget: Widget): void {
    this.previewElement = document.createElement('div');
    this.previewElement.className = 'iazd-drag-preview';
    this.previewElement.style.position = 'absolute';
    this.previewElement.style.pointerEvents = 'none';
    this.previewElement.style.zIndex = '998';

    this.gridElement.appendChild(this.previewElement);
  }

  /**
   * Update preview position (grid-snapped)
   */
  private updatePreview(gridX: number, gridY: number): void {
    if (!this.previewElement || !this.state) return;

    const widget = this.state.widget;
    const columnWidth = 100 / this.options.columns;

    this.previewElement.style.left = `${gridX * columnWidth}%`;
    this.previewElement.style.top = `${gridY * this.options.rowHeight + gridY * this.options.margin}px`;
    this.previewElement.style.width = `calc(${widget.w * columnWidth}% - ${this.options.margin}px)`;
    this.previewElement.style.height = `${widget.h * this.options.rowHeight + (widget.h - 1) * this.options.margin}px`;

    // Check for collisions and update preview style
    const state = this.getState();
    const otherWidgets = state.widgets.filter((w) => w.id !== this.state!.widgetId);
    const testWidget = { ...widget, x: gridX, y: gridY };
    const hasCollision = GridEngine.getCollidingWidgets(testWidget, otherWidgets).length > 0;

    if (hasCollision) {
      this.previewElement.classList.add('iazd-drag-preview-collision');
    } else {
      this.previewElement.classList.remove('iazd-drag-preview-collision');
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
   * Clean up drag elements and state
   */
  private cleanup(): void {
    // Remove ghost
    if (this.ghostElement) {
      this.ghostElement.remove();
      this.ghostElement = null;
    }

    // Remove preview
    if (this.previewElement) {
      this.previewElement.remove();
      this.previewElement = null;
    }

    // Stop auto-scroll
    this.stopAutoScroll();

    // Remove dragging class
    if (this.state) {
      const widgetElement = this.gridElement.querySelector(`[data-widget-id="${this.state.widgetId}"]`);
      if (widgetElement) {
        widgetElement.classList.remove('iazd-dragging');
      }
    }

    // Re-enable animations
    if (this.options.animate) {
      this.gridElement.classList.add('iazd-animate');
    }
  }

  /**
   * Destroy drag engine (cleanup)
   */
  public destroy(): void {
    if (this.isDragging()) {
      this.cancelDrag();
    }
    this.cleanup();
  }
}
