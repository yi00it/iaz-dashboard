/**
 * Constraints Plugin - Advanced widget constraints
 *
 * This plugin adds advanced constraint validation for widgets:
 * - Aspect ratio locking
 * - Maximum widget count limits
 * - Row/column restrictions
 * - Custom validation rules
 *
 * Usage:
 *   import { constraintsPlugin } from 'iazd-dashboard';
 *
 *   const dashboard = new IAZDashboard('#container', {
 *     columns: 12,
 *     rowHeight: 60,
 *   }).use(constraintsPlugin({
 *     maxWidgets: 10,
 *     minWidgetSize: { w: 2, h: 2 },
 *     maxWidgetSize: { w: 6, h: 6 }
 *   }));
 */

import type { IAZDPlugin, Widget, DashboardState } from '../types';

export interface ConstraintsPluginOptions {
  /**
   * Maximum number of widgets allowed
   */
  maxWidgets?: number;

  /**
   * Minimum widget size (w, h)
   */
  minWidgetSize?: { w: number; h: number };

  /**
   * Maximum widget size (w, h)
   */
  maxWidgetSize?: { w: number; h: number };

  /**
   * Lock aspect ratio for all widgets
   */
  lockAspectRatio?: boolean;

  /**
   * Maximum number of rows (height limit)
   */
  maxRows?: number;

  /**
   * Prevent widgets from overlapping specific areas
   * Array of rectangles: { x, y, w, h }
   */
  restrictedAreas?: Array<{ x: number; y: number; w: number; h: number }>;

  /**
   * Custom validation function
   * Return true if valid, false or error message if invalid
   */
  customValidator?: (widget: Widget, state: DashboardState) => boolean | string;

  /**
   * Whether to block invalid operations or just emit warnings
   * Default: true (block)
   */
  blockInvalid?: boolean;
}

/**
 * Create a constraints plugin with custom options
 */
export function createConstraintsPlugin(options: ConstraintsPluginOptions = {}): IAZDPlugin {
  const {
    maxWidgets,
    minWidgetSize,
    maxWidgetSize,
    lockAspectRatio = false,
    maxRows,
    restrictedAreas = [],
    customValidator,
    blockInvalid = true,
  } = options;

  return (ctx) => {
    // Validation helper
    const validateWidget = (widget: Widget, state: DashboardState): { valid: boolean; reason?: string } => {
      // Check max widgets
      if (maxWidgets !== undefined && state.widgets.length >= maxWidgets) {
        // Check if this is an update to existing widget
        const isUpdate = state.widgets.some((w) => w.id === widget.id);
        if (!isUpdate) {
          return { valid: false, reason: `Maximum widget limit reached (${maxWidgets})` };
        }
      }

      // Check min widget size
      if (minWidgetSize) {
        if (widget.w < minWidgetSize.w || widget.h < minWidgetSize.h) {
          return {
            valid: false,
            reason: `Widget size (${widget.w}x${widget.h}) is below minimum (${minWidgetSize.w}x${minWidgetSize.h})`,
          };
        }
      }

      // Check max widget size
      if (maxWidgetSize) {
        if (widget.w > maxWidgetSize.w || widget.h > maxWidgetSize.h) {
          return {
            valid: false,
            reason: `Widget size (${widget.w}x${widget.h}) exceeds maximum (${maxWidgetSize.w}x${maxWidgetSize.h})`,
          };
        }
      }

      // Check max rows
      if (maxRows !== undefined) {
        const maxY = widget.y + widget.h;
        if (maxY > maxRows) {
          return {
            valid: false,
            reason: `Widget extends beyond maximum row limit (${maxRows})`,
          };
        }
      }

      // Check restricted areas
      for (const area of restrictedAreas) {
        const overlaps =
          widget.x < area.x + area.w &&
          widget.x + widget.w > area.x &&
          widget.y < area.y + area.h &&
          widget.y + widget.h > area.y;

        if (overlaps) {
          return {
            valid: false,
            reason: `Widget overlaps with restricted area at (${area.x}, ${area.y})`,
          };
        }
      }

      // Custom validator
      if (customValidator) {
        const result = customValidator(widget, state);
        if (result === false) {
          return { valid: false, reason: 'Custom validation failed' };
        }
        if (typeof result === 'string') {
          return { valid: false, reason: result };
        }
      }

      return { valid: true };
    };

    // Track original aspect ratios for widgets
    const aspectRatios = new Map<string | number, number>();

    // Listen to widget add events
    const originalAddHandler = (widget: Widget) => {
      const state = ctx.getState();
      const validation = validateWidget(widget, state);

      if (!validation.valid) {
        ctx.emit('constraint:violation', {
          widget,
          reason: validation.reason,
          type: 'add',
        });

        if (blockInvalid) {
          console.warn(`[ConstraintsPlugin] Widget add blocked: ${validation.reason}`);
          // Remove the widget that was just added
          ctx.dashboard.removeWidget(widget.id);
        }
      } else {
        // Store aspect ratio if locking is enabled
        if (lockAspectRatio) {
          aspectRatios.set(widget.id, widget.w / widget.h);
        }
      }
    };

    // Listen to widget resize events
    const originalResizeHandler = (widget: Widget) => {
      const state = ctx.getState();

      // Apply aspect ratio lock if enabled
      if (lockAspectRatio && aspectRatios.has(widget.id)) {
        const ratio = aspectRatios.get(widget.id)!;
        const expectedH = Math.round(widget.w / ratio);

        if (widget.h !== expectedH) {
          // Adjust height to maintain aspect ratio
          ctx.dashboard.resizeWidget(widget.id, widget.w, expectedH);
          ctx.emit('constraint:aspect-ratio', {
            widget,
            ratio,
            adjusted: { w: widget.w, h: expectedH },
          });
          return; // Skip further validation, resizeWidget will trigger again
        }
      }

      const validation = validateWidget(widget, state);

      if (!validation.valid) {
        ctx.emit('constraint:violation', {
          widget,
          reason: validation.reason,
          type: 'resize',
        });

        if (blockInvalid) {
          console.warn(`[ConstraintsPlugin] Widget resize blocked: ${validation.reason}`);
          // This would require storing previous state - for now just emit warning
        }
      }
    };

    // Listen to widget move events
    const originalMoveHandler = (widget: Widget) => {
      const state = ctx.getState();
      const validation = validateWidget(widget, state);

      if (!validation.valid) {
        ctx.emit('constraint:violation', {
          widget,
          reason: validation.reason,
          type: 'move',
        });

        if (blockInvalid) {
          console.warn(`[ConstraintsPlugin] Widget move blocked: ${validation.reason}`);
        }
      }
    };

    // Listen to widget remove events to clean up aspect ratio tracking
    const originalRemoveHandler = (widget: Widget) => {
      aspectRatios.delete(widget.id);
    };

    // Register event listeners
    ctx.on('widget:add', originalAddHandler);
    ctx.on('widget:resize', originalResizeHandler);
    ctx.on('widget:move', originalMoveHandler);
    ctx.on('widget:remove', originalRemoveHandler);

    // Add helper method to dashboard
    if (ctx.dashboard) {
      ctx.dashboard.validateWidget = (widget: Widget) => {
        const state = ctx.getState();
        return validateWidget(widget, state);
      };
    }

    // Emit plugin ready event
    ctx.emit('plugin:constraints:ready', {
      maxWidgets,
      minWidgetSize,
      maxWidgetSize,
      lockAspectRatio,
      maxRows,
      restrictedAreas,
      blockInvalid,
    });
  };
}

/**
 * Default constraints plugin with no constraints (demonstration only)
 */
export const constraintsPlugin: IAZDPlugin = createConstraintsPlugin({
  blockInvalid: false, // Just emit warnings by default
});
