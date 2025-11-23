/**
 * Snaplines Plugin - Visual alignment guides
 *
 * This plugin shows visual guides when dragging or resizing widgets to help align them
 * with other widgets on the dashboard. It displays horizontal and vertical lines when
 * edges or centers of widgets align.
 *
 * Usage:
 *   import { snaplinesPlugin } from 'iazd-dashboard';
 *
 *   const dashboard = new IAZDashboard('#container', {
 *     columns: 12,
 *     rowHeight: 60,
 *   }).use(snaplinesPlugin);
 */

import type { IAZDPlugin, Widget } from '../types';

export interface SnaplinesPluginOptions {
  /**
   * Snap threshold in pixels
   * Default: 10
   */
  threshold?: number;

  /**
   * Show vertical alignment guides
   * Default: true
   */
  showVertical?: boolean;

  /**
   * Show horizontal alignment guides
   * Default: true
   */
  showHorizontal?: boolean;

  /**
   * Line color
   * Default: '#4CAF50'
   */
  lineColor?: string;

  /**
   * Line width in pixels
   * Default: 1
   */
  lineWidth?: number;

  /**
   * Line style (solid, dashed)
   * Default: 'dashed'
   */
  lineStyle?: 'solid' | 'dashed';
}

/**
 * Create a snaplines plugin with custom options
 */
export function createSnaplinesPlugin(options: SnaplinesPluginOptions = {}): IAZDPlugin {
  const {
    threshold = 10,
    showVertical = true,
    showHorizontal = true,
    lineColor = '#4CAF50',
    lineWidth = 1,
    lineStyle = 'dashed',
  } = options;

  return (ctx) => {
    let containerEl: HTMLElement | null = null;
    let snaplinesContainer: HTMLElement | null = null;
    let verticalLine: HTMLElement | null = null;
    let horizontalLine: HTMLElement | null = null;

    // Create snapline elements
    const createSnaplines = () => {
      if (!ctx.dashboard || !ctx.dashboard.container) return;

      const dashboardContainer = ctx.dashboard.container;
      if (!dashboardContainer) return;

      containerEl = dashboardContainer;

      // Create wrapper container for snaplines
      snaplinesContainer = document.createElement('div');
      snaplinesContainer.className = 'iazd-snaplines';
      snaplinesContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
      `;
      dashboardContainer.appendChild(snaplinesContainer);

      const lineStyles = `
        position: absolute;
        background-color: ${lineColor};
        pointer-events: none;
        z-index: 9999;
        ${lineStyle === 'dashed' ? `background-image: linear-gradient(to right, ${lineColor} 50%, transparent 50%); background-size: 10px 100%;` : ''}
      `;

      if (showVertical) {
        verticalLine = document.createElement('div');
        verticalLine.className = 'iazd-snapline-vertical';
        verticalLine.style.cssText = `
          ${lineStyles}
          width: ${lineWidth}px;
          height: 100%;
          top: 0;
          display: none;
        `;
        snaplinesContainer.appendChild(verticalLine);
      }

      if (showHorizontal) {
        horizontalLine = document.createElement('div');
        horizontalLine.className = 'iazd-snapline-horizontal';
        horizontalLine.style.cssText = `
          ${lineStyles}
          height: ${lineWidth}px;
          width: 100%;
          left: 0;
          display: none;
          ${lineStyle === 'dashed' ? `background-image: linear-gradient(to bottom, ${lineColor} 50%, transparent 50%); background-size: 100% 10px;` : ''}
        `;
        snaplinesContainer.appendChild(horizontalLine);
      }
    };

    // Calculate widget position in pixels
    const getWidgetRect = (widget: Widget) => {
      if (!containerEl) return null;

      const state = ctx.getState();
      const { columns, rowHeight } = state;
      const margin = ctx.options.margin || 8;
      const containerWidth = containerEl.offsetWidth;
      const cellWidth = (containerWidth - margin * (columns + 1)) / columns;

      return {
        left: margin + widget.x * (cellWidth + margin),
        top: margin + widget.y * (rowHeight + margin),
        right: margin + widget.x * (cellWidth + margin) + widget.w * cellWidth + (widget.w - 1) * margin,
        bottom: margin + widget.y * (rowHeight + margin) + widget.h * rowHeight + (widget.h - 1) * margin,
        centerX: margin + widget.x * (cellWidth + margin) + (widget.w * cellWidth + (widget.w - 1) * margin) / 2,
        centerY: margin + widget.y * (rowHeight + margin) + (widget.h * rowHeight + (widget.h - 1) * margin) / 2,
      };
    };

    // Find alignments with other widgets
    const findAlignments = (movingWidget: Widget, otherWidgets: Widget[]) => {
      const movingRect = getWidgetRect(movingWidget);
      if (!movingRect) return { vertical: null, horizontal: null };

      const alignments = {
        vertical: null as number | null,
        horizontal: null as number | null,
      };

      for (const widget of otherWidgets) {
        if (widget.id === movingWidget.id) continue;

        const rect = getWidgetRect(widget);
        if (!rect) continue;

        // Check vertical alignments (left, center, right)
        if (showVertical) {
          const verticalChecks = [
            { moving: movingRect.left, other: rect.left },
            { moving: movingRect.left, other: rect.right },
            { moving: movingRect.right, other: rect.left },
            { moving: movingRect.right, other: rect.right },
            { moving: movingRect.centerX, other: rect.centerX },
          ];

          for (const check of verticalChecks) {
            if (Math.abs(check.moving - check.other) < threshold) {
              alignments.vertical = check.other;
              break;
            }
          }
        }

        // Check horizontal alignments (top, center, bottom)
        if (showHorizontal) {
          const horizontalChecks = [
            { moving: movingRect.top, other: rect.top },
            { moving: movingRect.top, other: rect.bottom },
            { moving: movingRect.bottom, other: rect.top },
            { moving: movingRect.bottom, other: rect.bottom },
            { moving: movingRect.centerY, other: rect.centerY },
          ];

          for (const check of horizontalChecks) {
            if (Math.abs(check.moving - check.other) < threshold) {
              alignments.horizontal = check.other;
              break;
            }
          }
        }

        // If both alignments found, stop searching
        if (alignments.vertical !== null && alignments.horizontal !== null) {
          break;
        }
      }

      return alignments;
    };

    // Show snaplines
    const showSnaplines = (alignments: { vertical: number | null; horizontal: number | null }) => {
      if (verticalLine && alignments.vertical !== null) {
        verticalLine.style.left = `${alignments.vertical}px`;
        verticalLine.style.display = 'block';
      }

      if (horizontalLine && alignments.horizontal !== null) {
        horizontalLine.style.top = `${alignments.horizontal}px`;
        horizontalLine.style.display = 'block';
      }
    };

    // Hide snaplines
    const hideSnaplines = () => {
      if (verticalLine) {
        verticalLine.style.display = 'none';
      }
      if (horizontalLine) {
        horizontalLine.style.display = 'none';
      }
    };

    // Handle drag move
    const onDragMove = (event: any) => {
      const state = ctx.getState();
      const movingWidget = state.widgets.find((w) => w.id === event.widget?.id);

      if (!movingWidget) return;

      const otherWidgets = state.widgets.filter((w) => w.id !== movingWidget.id);
      const alignments = findAlignments(movingWidget, otherWidgets);

      if (alignments.vertical !== null || alignments.horizontal !== null) {
        showSnaplines(alignments);
        ctx.emit('snapline:show', { widget: movingWidget, alignments });
      } else {
        hideSnaplines();
      }
    };

    // Handle resize move
    const onResizeMove = (event: any) => {
      const state = ctx.getState();
      const resizingWidget = state.widgets.find((w) => w.id === event.widget?.id);

      if (!resizingWidget) return;

      const otherWidgets = state.widgets.filter((w) => w.id !== resizingWidget.id);
      const alignments = findAlignments(resizingWidget, otherWidgets);

      if (alignments.vertical !== null || alignments.horizontal !== null) {
        showSnaplines(alignments);
        ctx.emit('snapline:show', { widget: resizingWidget, alignments });
      } else {
        hideSnaplines();
      }
    };

    // Handle drag/resize end
    const onDragOrResizeEnd = () => {
      hideSnaplines();
      ctx.emit('snapline:hide');
    };

    // Create snaplines immediately
    createSnaplines();

    // Listen to drag and resize events
    ctx.on('drag:move', onDragMove);
    ctx.on('resize:move', onResizeMove);
    ctx.on('drag:end', onDragOrResizeEnd);
    ctx.on('drag:cancel', onDragOrResizeEnd);
    ctx.on('resize:end', onDragOrResizeEnd);
    ctx.on('resize:cancel', onDragOrResizeEnd);

    // Clean up on destroy
    ctx.on('dashboard:destroy', () => {
      if (snaplinesContainer) {
        snaplinesContainer.remove();
        snaplinesContainer = null;
      }
      verticalLine = null;
      horizontalLine = null;
    });

    // Emit plugin ready event
    ctx.emit('plugin:snaplines:ready', {
      threshold,
      showVertical,
      showHorizontal,
      lineColor,
      lineWidth,
      lineStyle,
    });
  };
}

/**
 * Default snaplines plugin with default options
 */
export const snaplinesPlugin: IAZDPlugin = createSnaplinesPlugin();
