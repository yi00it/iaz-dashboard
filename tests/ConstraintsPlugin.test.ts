/**
 * Constraints Plugin tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IAZDashboard } from '../src/core/Dashboard';
import { createConstraintsPlugin, constraintsPlugin } from '../src/plugins/constraintsPlugin';

describe('ConstraintsPlugin', () => {
  let container: HTMLDivElement;
  let dashboard: IAZDashboard;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.style.width = '1200px';
    container.style.height = '800px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (dashboard) dashboard.destroy();
    container.remove();
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const readyHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });

      dashboard.on('plugin:constraints:ready', readyHandler);
      dashboard.use(constraintsPlugin);

      expect(readyHandler).toHaveBeenCalledWith({
        maxWidgets: undefined,
        minWidgetSize: undefined,
        maxWidgetSize: undefined,
        lockAspectRatio: false,
        maxRows: undefined,
        restrictedAreas: [],
        blockInvalid: false,
      });
    });

    it('should initialize with custom options', () => {
      const readyHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });

      dashboard.on('plugin:constraints:ready', readyHandler);
      dashboard.use(
        createConstraintsPlugin({
          maxWidgets: 10,
          minWidgetSize: { w: 2, h: 2 },
          maxWidgetSize: { w: 6, h: 6 },
          lockAspectRatio: true,
          maxRows: 10,
          restrictedAreas: [{ x: 0, y: 0, w: 2, h: 2 }],
          blockInvalid: true,
        })
      );

      expect(readyHandler).toHaveBeenCalledWith({
        maxWidgets: 10,
        minWidgetSize: { w: 2, h: 2 },
        maxWidgetSize: { w: 6, h: 6 },
        lockAspectRatio: true,
        maxRows: 10,
        restrictedAreas: [{ x: 0, y: 0, w: 2, h: 2 }],
        blockInvalid: true,
      });
    });

    it('should add validateWidget method to dashboard', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(constraintsPlugin);

      expect(typeof dashboard.validateWidget).toBe('function');
    });
  });

  describe('maxWidgets constraint', () => {
    it('should block adding widget when max limit reached', () => {
      const violationHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [
          { id: 1, x: 0, y: 0, w: 4, h: 2 },
          { id: 2, x: 4, y: 0, w: 4, h: 2 },
        ],
      });
      dashboard.use(createConstraintsPlugin({ maxWidgets: 2, blockInvalid: true }));
      dashboard.on('constraint:violation', violationHandler);
      dashboard.on('constraint:maxWidgets', violationHandler);

      dashboard.addWidget({ id: 3, x: 0, y: 2, w: 4, h: 2 });

      expect(violationHandler).toHaveBeenCalled();
      expect(dashboard.getState().widgets.length).toBe(2);
    });

    it('should allow updating existing widget when max limit reached', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [
          { id: 1, x: 0, y: 0, w: 4, h: 2 },
          { id: 2, x: 4, y: 0, w: 4, h: 2 },
        ],
      });
      dashboard.use(createConstraintsPlugin({ maxWidgets: 2, blockInvalid: true }));

      // Updating an existing widget should work
      dashboard.updateWidget(1, { x: 0, y: 2 });

      const widget = dashboard.getState().widgets.find((w) => w.id === 1);
      expect(widget?.y).toBe(2);
    });

    it('should emit warning but allow add when blockInvalid is false', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const violationHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [
          { id: 1, x: 0, y: 0, w: 4, h: 2 },
          { id: 2, x: 4, y: 0, w: 4, h: 2 },
        ],
      });
      dashboard.use(createConstraintsPlugin({ maxWidgets: 2, blockInvalid: false }));
      dashboard.on('constraint:violation', violationHandler);

      dashboard.addWidget({ id: 3, x: 0, y: 2, w: 4, h: 2 });

      expect(violationHandler).toHaveBeenCalled();
      // Widget should be added since blockInvalid is false
      expect(dashboard.getState().widgets.length).toBe(3);
      expect(warnSpy).not.toHaveBeenCalled(); // warn only when blockInvalid is true

      warnSpy.mockRestore();
    });
  });

  describe('minWidgetSize constraint', () => {
    it('should block adding widget below minimum size', () => {
      const violationHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(createConstraintsPlugin({ minWidgetSize: { w: 3, h: 3 }, blockInvalid: true }));
      dashboard.on('constraint:violation', violationHandler);
      dashboard.on('constraint:minSize', violationHandler);

      dashboard.addWidget({ id: 1, x: 0, y: 0, w: 2, h: 2 });

      expect(violationHandler).toHaveBeenCalled();
      expect(dashboard.getState().widgets.length).toBe(0);
    });

    it('should allow adding widget meeting minimum size', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(createConstraintsPlugin({ minWidgetSize: { w: 3, h: 3 }, blockInvalid: true }));

      dashboard.addWidget({ id: 1, x: 0, y: 0, w: 4, h: 4 });

      expect(dashboard.getState().widgets.length).toBe(1);
    });

    it('should trigger violation on resize below minimum', () => {
      const violationHandler = vi.fn();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 4 }],
      });
      dashboard.use(createConstraintsPlugin({ minWidgetSize: { w: 3, h: 3 }, blockInvalid: true }));
      dashboard.on('constraint:violation', violationHandler);

      dashboard.resizeWidget(1, 2, 2);

      expect(violationHandler).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Widget resize blocked'));

      warnSpy.mockRestore();
    });
  });

  describe('maxWidgetSize constraint', () => {
    it('should block adding widget exceeding maximum size', () => {
      const violationHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(createConstraintsPlugin({ maxWidgetSize: { w: 4, h: 4 }, blockInvalid: true }));
      dashboard.on('constraint:violation', violationHandler);
      dashboard.on('constraint:maxSize', violationHandler);

      dashboard.addWidget({ id: 1, x: 0, y: 0, w: 6, h: 6 });

      expect(violationHandler).toHaveBeenCalled();
      expect(dashboard.getState().widgets.length).toBe(0);
    });

    it('should allow adding widget within maximum size', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(createConstraintsPlugin({ maxWidgetSize: { w: 4, h: 4 }, blockInvalid: true }));

      dashboard.addWidget({ id: 1, x: 0, y: 0, w: 4, h: 4 });

      expect(dashboard.getState().widgets.length).toBe(1);
    });

    it('should trigger violation on resize exceeding maximum', () => {
      const violationHandler = vi.fn();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 4 }],
      });
      dashboard.use(createConstraintsPlugin({ maxWidgetSize: { w: 4, h: 4 }, blockInvalid: true }));
      dashboard.on('constraint:violation', violationHandler);

      dashboard.resizeWidget(1, 6, 6);

      expect(violationHandler).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Widget resize blocked'));

      warnSpy.mockRestore();
    });
  });

  describe('maxRows constraint', () => {
    it('should block adding widget that exceeds max rows', () => {
      const violationHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(createConstraintsPlugin({ maxRows: 5, blockInvalid: true }));
      dashboard.on('constraint:violation', violationHandler);
      dashboard.on('constraint:maxRows', violationHandler);

      dashboard.addWidget({ id: 1, x: 0, y: 4, w: 4, h: 4 });

      expect(violationHandler).toHaveBeenCalled();
      expect(dashboard.getState().widgets.length).toBe(0);
    });

    it('should allow adding widget within max rows', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(createConstraintsPlugin({ maxRows: 5, blockInvalid: true }));

      dashboard.addWidget({ id: 1, x: 0, y: 0, w: 4, h: 4 });

      expect(dashboard.getState().widgets.length).toBe(1);
    });

    it('should trigger violation on move that exceeds max rows', () => {
      const violationHandler = vi.fn();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(createConstraintsPlugin({ maxRows: 5, blockInvalid: true }));
      dashboard.on('constraint:violation', violationHandler);

      dashboard.moveWidget(1, 0, 10);

      expect(violationHandler).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Widget move blocked'));

      warnSpy.mockRestore();
    });
  });

  describe('restrictedAreas constraint', () => {
    it('should block adding widget in restricted area', () => {
      const violationHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(
        createConstraintsPlugin({
          restrictedAreas: [{ x: 0, y: 0, w: 4, h: 4 }],
          blockInvalid: true,
        })
      );
      dashboard.on('constraint:violation', violationHandler);
      dashboard.on('constraint:restrictedArea', violationHandler);

      dashboard.addWidget({ id: 1, x: 2, y: 2, w: 3, h: 3 });

      expect(violationHandler).toHaveBeenCalled();
      expect(dashboard.getState().widgets.length).toBe(0);
    });

    it('should allow adding widget outside restricted area', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(
        createConstraintsPlugin({
          restrictedAreas: [{ x: 0, y: 0, w: 4, h: 4 }],
          blockInvalid: true,
        })
      );

      dashboard.addWidget({ id: 1, x: 5, y: 5, w: 3, h: 3 });

      expect(dashboard.getState().widgets.length).toBe(1);
    });

    it('should trigger violation when widget is moved into restricted area', () => {
      const violationHandler = vi.fn();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 5, y: 5, w: 2, h: 2 }],
      });
      dashboard.use(
        createConstraintsPlugin({
          restrictedAreas: [{ x: 0, y: 0, w: 4, h: 4 }],
          blockInvalid: true,
        })
      );
      dashboard.on('constraint:violation', violationHandler);

      dashboard.moveWidget(1, 1, 1);

      expect(violationHandler).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Widget move blocked'));

      warnSpy.mockRestore();
    });

    it('should handle multiple restricted areas', () => {
      const violationHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(
        createConstraintsPlugin({
          restrictedAreas: [
            { x: 0, y: 0, w: 2, h: 2 },
            { x: 6, y: 6, w: 2, h: 2 },
          ],
          blockInvalid: true,
        })
      );
      dashboard.on('constraint:violation', violationHandler);

      // Should be blocked - overlaps first restricted area
      dashboard.addWidget({ id: 1, x: 1, y: 1, w: 2, h: 2 });
      expect(dashboard.getState().widgets.length).toBe(0);

      // Should be blocked - overlaps second restricted area
      dashboard.addWidget({ id: 2, x: 5, y: 5, w: 3, h: 3 });
      expect(dashboard.getState().widgets.length).toBe(0);

      // Should succeed - outside both restricted areas
      dashboard.addWidget({ id: 3, x: 3, y: 3, w: 2, h: 2 });
      expect(dashboard.getState().widgets.length).toBe(1);
    });
  });

  describe('customValidator constraint', () => {
    it('should block widget when custom validator returns false', () => {
      const violationHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(
        createConstraintsPlugin({
          customValidator: (widget) => widget.w !== widget.h, // Reject square widgets
          blockInvalid: true,
        })
      );
      dashboard.on('constraint:violation', violationHandler);
      dashboard.on('constraint:custom', violationHandler);

      dashboard.addWidget({ id: 1, x: 0, y: 0, w: 4, h: 4 });

      expect(violationHandler).toHaveBeenCalled();
      expect(dashboard.getState().widgets.length).toBe(0);
    });

    it('should block widget when custom validator returns error string', () => {
      const violationHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(
        createConstraintsPlugin({
          customValidator: (widget) => (widget.w > 5 ? 'Widget too wide' : true),
          blockInvalid: true,
        })
      );
      dashboard.on('constraint:violation', violationHandler);

      dashboard.addWidget({ id: 1, x: 0, y: 0, w: 6, h: 2 });

      expect(violationHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'Widget too wide',
        })
      );
      expect(dashboard.getState().widgets.length).toBe(0);
    });

    it('should allow widget when custom validator returns true', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(
        createConstraintsPlugin({
          customValidator: (widget) => widget.w >= 2 && widget.h >= 2,
          blockInvalid: true,
        })
      );

      dashboard.addWidget({ id: 1, x: 0, y: 0, w: 4, h: 4 });

      expect(dashboard.getState().widgets.length).toBe(1);
    });

    it('should pass state to custom validator', () => {
      const validatorFn = vi.fn().mockReturnValue(true);

      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(
        createConstraintsPlugin({
          customValidator: validatorFn,
          blockInvalid: true,
        })
      );

      dashboard.addWidget({ id: 2, x: 4, y: 0, w: 4, h: 2 });

      expect(validatorFn).toHaveBeenCalledWith(
        expect.objectContaining({ id: 2 }),
        expect.objectContaining({ widgets: expect.any(Array) })
      );
    });
  });

  describe('lockAspectRatio', () => {
    it('should store aspect ratio when widget is added', () => {
      const aspectRatioHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(createConstraintsPlugin({ lockAspectRatio: true }));
      dashboard.on('constraint:aspect-ratio', aspectRatioHandler);

      dashboard.addWidget({ id: 1, x: 0, y: 0, w: 4, h: 2 }); // 2:1 ratio

      // Now resize and check aspect ratio is maintained
      dashboard.resizeWidget(1, 6, 2);

      expect(aspectRatioHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          ratio: 2, // 4/2 = 2
          adjusted: expect.objectContaining({ w: 6, h: 3 }), // 6/2 = 3
        })
      );
    });

    it('should not lock aspect ratio when disabled', () => {
      const aspectRatioHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(createConstraintsPlugin({ lockAspectRatio: false }));
      dashboard.on('constraint:aspect-ratio', aspectRatioHandler);

      dashboard.addWidget({ id: 1, x: 0, y: 0, w: 4, h: 2 });
      dashboard.resizeWidget(1, 6, 6);

      expect(aspectRatioHandler).not.toHaveBeenCalled();
    });

    it('should clean up aspect ratio when widget is removed', () => {
      const aspectRatioHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(createConstraintsPlugin({ lockAspectRatio: true }));
      dashboard.on('constraint:aspect-ratio', aspectRatioHandler);

      dashboard.removeWidget(1);
      dashboard.addWidget({ id: 2, x: 0, y: 0, w: 3, h: 3 }); // New ratio 1:1

      dashboard.resizeWidget(2, 6, 3);

      // Should use the new ratio (1:1) not the old one (2:1)
      expect(aspectRatioHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          ratio: 1,
          adjusted: expect.objectContaining({ w: 6, h: 6 }),
        })
      );
    });
  });

  describe('validateWidget helper', () => {
    it('should return valid for widget passing all constraints', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(
        createConstraintsPlugin({
          maxWidgets: 10,
          minWidgetSize: { w: 2, h: 2 },
          maxWidgetSize: { w: 8, h: 8 },
          maxRows: 10,
        })
      );

      const result = dashboard.validateWidget({ id: 1, x: 0, y: 0, w: 4, h: 4 } as any);

      expect(result.valid).toBe(true);
    });

    it('should return invalid with reason for failing widget', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [],
      });
      dashboard.use(
        createConstraintsPlugin({
          minWidgetSize: { w: 4, h: 4 },
        })
      );

      const result = dashboard.validateWidget({ id: 1, x: 0, y: 0, w: 2, h: 2 } as any);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('below minimum');
      expect(result.constraintType).toBe('minSize');
    });
  });

  describe('combined constraints', () => {
    it('should check all constraints in order', () => {
      const violationHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [
          { id: 1, x: 0, y: 0, w: 4, h: 2 },
          { id: 2, x: 4, y: 0, w: 4, h: 2 },
        ],
      });
      dashboard.use(
        createConstraintsPlugin({
          maxWidgets: 2,
          minWidgetSize: { w: 2, h: 2 },
          maxWidgetSize: { w: 6, h: 6 },
          maxRows: 5,
          restrictedAreas: [{ x: 0, y: 4, w: 12, h: 1 }],
          blockInvalid: true,
        })
      );
      dashboard.on('constraint:violation', violationHandler);

      // Should fail on maxWidgets first
      dashboard.addWidget({ id: 3, x: 0, y: 2, w: 4, h: 2 });

      expect(violationHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: expect.stringContaining('Maximum widget limit'),
        })
      );
    });
  });
});
