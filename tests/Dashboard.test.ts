/**
 * Dashboard integration tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IAZDashboard } from '../src/core/Dashboard';
import type { DashboardOptions, Widget } from '../src/types';

const Dashboard = IAZDashboard;

describe('Dashboard', () => {
  let container: HTMLElement;
  let dashboard: Dashboard;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-dashboard';
    container.style.width = '1200px';
    container.style.height = '800px';
    document.body.appendChild(container);
  });

  describe('initialization', () => {
    it('should create dashboard with default options', () => {
      dashboard = new Dashboard(container);

      expect(dashboard).toBeTruthy();
      expect(container.querySelector('.iazd-grid')).toBeTruthy();
    });

    it('should create dashboard with custom options', () => {
      const options: Partial<DashboardOptions> = {
        columns: 24,
        rowHeight: 50,
        margin: 5,
        animate: false,
        float: true,
      };

      dashboard = new Dashboard(container, options);

      expect(dashboard).toBeTruthy();
    });

    it('should throw error for invalid container', () => {
      expect(() => {
        new Dashboard(null as any);
      }).toThrow();
    });

    it('should initialize with initial widgets', () => {
      const widgets: Widget[] = [
        { id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' },
        { id: '2', x: 4, y: 0, w: 4, h: 3, content: 'Widget 2' },
      ];

      dashboard = new Dashboard(container, { widgets });

      const state = dashboard.getState();
      expect(state.widgets).toHaveLength(2);
    });
  });

  describe('widget management', () => {
    beforeEach(() => {
      dashboard = new Dashboard(container);
    });

    it('should add widget', () => {
      const widget: Widget = {
        id: '1',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        content: 'Widget 1',
      };

      const result = dashboard.addWidget(widget);

      expect(result).toBeTruthy();
      expect(dashboard.getState().widgets).toHaveLength(1);
    });

    it('should add widget without position (auto-position)', () => {
      const widget: Partial<Widget> = {
        id: '1',
        w: 4,
        h: 3,
        content: 'Widget 1',
      };

      const result = dashboard.addWidget(widget as Widget);

      expect(result).toBeTruthy();
      const state = dashboard.getState();
      expect(state.widgets[0].x).toBeDefined();
      expect(state.widgets[0].y).toBeDefined();
    });

    it('should remove widget', () => {
      const widget: Widget = {
        id: '1',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        content: 'Widget 1',
      };

      dashboard.addWidget(widget);
      const result = dashboard.removeWidget('1');

      expect(result).toBeTruthy();
      expect(dashboard.getState().widgets).toHaveLength(0);
    });

    it('should return false when removing non-existent widget', () => {
      const result = dashboard.removeWidget('999');

      expect(result).toBe(false);
    });

    it('should update widget', () => {
      const widget: Widget = {
        id: '1',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        content: 'Widget 1',
      };

      dashboard.addWidget(widget);

      const result = dashboard.updateWidget('1', { content: 'Updated' });

      expect(result).toBeTruthy();
      const updatedWidget = dashboard.getState().widgets[0];
      expect(updatedWidget.content).toBe('Updated');
    });

    it('should move widget', () => {
      const widget: Widget = {
        id: '1',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        content: 'Widget 1',
      };

      dashboard.addWidget(widget);

      const result = dashboard.moveWidget('1', 4, 2);

      expect(result).toBeTruthy();
      const movedWidget = dashboard.getState().widgets[0];
      expect(movedWidget.x).toBe(4);
      expect(movedWidget.y).toBe(2);
    });

    it('should resize widget', () => {
      const widget: Widget = {
        id: '1',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        content: 'Widget 1',
      };

      dashboard.addWidget(widget);

      const result = dashboard.resizeWidget('1', 6, 4);

      expect(result).toBeTruthy();
      const resizedWidget = dashboard.getState().widgets[0];
      expect(resizedWidget.w).toBe(6);
      expect(resizedWidget.h).toBe(4);
    });

    it('should get widget by id', () => {
      const widget: Widget = {
        id: '1',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        content: 'Widget 1',
      };

      dashboard.addWidget(widget);

      const found = dashboard.getWidget('1');

      expect(found).toBeTruthy();
      expect(found?.id).toBe('1');
    });

    it('should return null for non-existent widget', () => {
      const found = dashboard.getWidget('999');

      expect(found).toBeNull();
    });

    it('should clear all widgets', () => {
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });
      dashboard.addWidget({ id: '2', x: 4, y: 0, w: 4, h: 3, content: 'Widget 2' });

      dashboard.clear();

      expect(dashboard.getState().widgets).toHaveLength(0);
    });
  });

  describe('state management', () => {
    beforeEach(() => {
      dashboard = new Dashboard(container);
    });

    it('should get current state', () => {
      const state = dashboard.getState();

      expect(state).toBeTruthy();
      expect(state.widgets).toBeDefined();
      expect(Array.isArray(state.widgets)).toBe(true);
    });

    it('should serialize state to JSON', () => {
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });

      const json = dashboard.serialize();

      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.widgets).toHaveLength(1);
    });

    it('should load state from JSON', () => {
      const state = {
        widgets: [
          { id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' },
          { id: '2', x: 4, y: 0, w: 4, h: 3, content: 'Widget 2' },
        ],
      };

      dashboard.load(JSON.stringify(state));

      expect(dashboard.getState().widgets).toHaveLength(2);
    });

    it('should handle invalid JSON gracefully', () => {
      expect(() => {
        dashboard.load('invalid json');
      }).toThrow();
    });
  });

  describe('events', () => {
    beforeEach(() => {
      dashboard = new Dashboard(container);
    });

    it('should emit widget:add event', () => {
      const handler = vi.fn();
      dashboard.on('widget:add', handler);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
    });

    it('should emit widget:remove event', () => {
      const handler = vi.fn();
      dashboard.on('widget:remove', handler);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });
      dashboard.removeWidget('1');

      expect(handler).toHaveBeenCalledWith('1');
    });

    it('should emit widget:update event', () => {
      const handler = vi.fn();
      dashboard.on('widget:update', handler);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });
      dashboard.updateWidget('1', { content: 'Updated' });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1', content: 'Updated' })
      );
    });

    it('should emit widget:move event', () => {
      const handler = vi.fn();
      dashboard.on('widget:move', handler);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });
      dashboard.moveWidget('1', 4, 2);

      expect(handler).toHaveBeenCalled();
    });

    it('should emit widget:resize event', () => {
      const handler = vi.fn();
      dashboard.on('widget:resize', handler);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });
      dashboard.resizeWidget('1', 6, 4);

      expect(handler).toHaveBeenCalled();
    });

    it('should remove event listener with off()', () => {
      const handler = vi.fn();
      dashboard.on('widget:add', handler);
      dashboard.off('widget:add', handler);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle once() event listener', () => {
      const handler = vi.fn();
      dashboard.once('widget:add', handler);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });
      dashboard.addWidget({ id: '2', x: 4, y: 0, w: 4, h: 3, content: 'Widget 2' });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('plugins', () => {
    beforeEach(() => {
      dashboard = new Dashboard(container);
    });

    it('should register plugin with use()', () => {
      const plugin = vi.fn((context) => {
        expect(context.state).toBeDefined();
        expect(context.events).toBeDefined();
        expect(context.options).toBeDefined();
      });

      dashboard.use(plugin);

      expect(plugin).toHaveBeenCalled();
    });

    it('should pass correct context to plugin', () => {
      const plugin = vi.fn((context) => {
        expect(context.state).toBeDefined();
        expect(context.events).toBeDefined();
        expect(context.options).toBeDefined();
        expect(context.dashboard).toBe(dashboard);
      });

      dashboard.use(plugin);
    });

    it('should allow plugin to listen to events', () => {
      const pluginHandler = vi.fn();

      const plugin = (context: any) => {
        context.events.on('widget:add', pluginHandler);
      };

      dashboard.use(plugin);
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });

      expect(pluginHandler).toHaveBeenCalled();
    });
  });

  describe('destruction', () => {
    beforeEach(() => {
      dashboard = new Dashboard(container);
    });

    it('should destroy dashboard and clean up', () => {
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });

      dashboard.destroy();

      expect(container.querySelector('.iazd-grid')).toBeNull();
    });

    it('should not throw on double destroy', () => {
      dashboard.destroy();

      expect(() => dashboard.destroy()).not.toThrow();
    });
  });

  describe('options', () => {
    it('should respect float option', () => {
      const widgets: Widget[] = [
        { id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' },
        { id: '2', x: 0, y: 10, w: 4, h: 3, content: 'Widget 2' },
      ];

      dashboard = new Dashboard(container, { widgets, float: true });

      const state = dashboard.getState();
      // Widget 2 should have moved up to fill the gap
      expect(state.widgets.find((w) => w.id === '2')?.y).toBeLessThan(10);
    });

    it('should respect animate option', () => {
      dashboard = new Dashboard(container, { animate: true });

      const gridElement = container.querySelector('.iazd-grid');
      expect(gridElement?.classList.contains('iazd-animate')).toBe(true);
    });

    it('should respect columns option', () => {
      dashboard = new Dashboard(container, { columns: 24 });

      // This should be reflected in the grid behavior
      const result = dashboard.addWidget({ id: '1', x: 0, y: 0, w: 24, h: 3, content: 'Full width' });
      expect(result).toBeTruthy();
    });

    it('should update options dynamically with updateOptions()', () => {
      dashboard = new Dashboard(container, { animate: false });
      const gridElement = container.querySelector('.iazd-grid');

      expect(gridElement?.classList.contains('iazd-animate')).toBe(false);

      dashboard.updateOptions({ animate: true });

      expect(gridElement?.classList.contains('iazd-animate')).toBe(true);
    });

    it('should force full re-render when draggable option changes', () => {
      dashboard = new Dashboard(container, { draggable: false });
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });

      const widgetBefore = container.querySelector('[data-widget-id="1"]');
      expect(widgetBefore?.getAttribute('data-draggable')).toBeNull();

      // Enable dragging - should force full re-render
      dashboard.setDraggable(true);

      const widgetAfter = container.querySelector('[data-widget-id="1"]');
      // Widget should be recreated with draggable attribute
      expect(widgetAfter?.getAttribute('data-draggable')).toBe('true');
      expect(widgetAfter?.style.cursor).toBe('move');
    });

    it('should force full re-render when resizable option changes', () => {
      dashboard = new Dashboard(container, { resizable: false });
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });

      const widgetBefore = container.querySelector('[data-widget-id="1"]');
      const handlesBefore = widgetBefore?.querySelectorAll('.iazd-resize-handle');
      expect(handlesBefore?.length).toBe(0);

      // Enable resizing - should force full re-render
      dashboard.setResizable(true);

      const widgetAfter = container.querySelector('[data-widget-id="1"]');
      const handlesAfter = widgetAfter?.querySelectorAll('.iazd-resize-handle');
      // Widget should now have resize handles
      expect(handlesAfter?.length).toBeGreaterThan(0);
    });

    it('should emit options:update event when options change', () => {
      dashboard = new Dashboard(container);
      const handler = vi.fn();
      dashboard.on('options:update', handler);

      dashboard.updateOptions({ animate: false });

      expect(handler).toHaveBeenCalledWith({ animate: false });
    });

    it('should use custom resize handles when specified', () => {
      dashboard = new Dashboard(container, {
        resizeHandles: ['se', 'e'],
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });

      const widget = container.querySelector('[data-widget-id="1"]');
      const handles = widget?.querySelectorAll('.iazd-resize-handle');

      expect(handles?.length).toBe(2);
      expect(widget?.querySelector('.iazd-resize-handle-se')).not.toBeNull();
      expect(widget?.querySelector('.iazd-resize-handle-e')).not.toBeNull();
      expect(widget?.querySelector('.iazd-resize-handle-nw')).toBeNull();
    });
  });

  describe('locked and immutable widgets', () => {
    beforeEach(() => {
      dashboard = new Dashboard(container);
    });

    it('should not move locked widget', () => {
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1', locked: true });

      const result = dashboard.moveWidget('1', 4, 4);

      expect(result).toBe(false);
      const widget = dashboard.getWidget('1');
      expect(widget?.x).toBe(0);
      expect(widget?.y).toBe(0);
    });

    it('should not resize noResize widget', () => {
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1', noResize: true });

      const result = dashboard.resizeWidget('1', 6, 4);

      expect(result).toBe(false);
      const widget = dashboard.getWidget('1');
      expect(widget?.w).toBe(4);
      expect(widget?.h).toBe(3);
    });

    it('should not move noMove widget', () => {
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1', noMove: true });

      const result = dashboard.moveWidget('1', 4, 4);

      expect(result).toBe(false);
    });
  });

  describe('batch operations', () => {
    it('should support batch mode for adding multiple widgets', () => {
      dashboard = new Dashboard(container, { animate: true });

      const renderSpy = vi.spyOn(dashboard as any, 'render');

      dashboard.beginBatch();
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });
      dashboard.addWidget({ id: '2', x: 4, y: 0, w: 4, h: 3, content: 'Widget 2' });
      dashboard.addWidget({ id: '3', x: 8, y: 0, w: 4, h: 3, content: 'Widget 3' });
      dashboard.endBatch();

      // Should only render once at the end
      expect(renderSpy).toHaveBeenCalledTimes(1);

      const state = dashboard.getState();
      expect(state.widgets).toHaveLength(3);
    });

    it('should disable animations during batch and re-enable after', () => {
      dashboard = new Dashboard(container, { animate: true });
      const gridElement = container.querySelector('.iazd-grid');

      expect(gridElement?.classList.contains('iazd-animate')).toBe(true);

      dashboard.beginBatch();
      expect(gridElement?.classList.contains('iazd-animate')).toBe(false);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });
      dashboard.endBatch();

      // Need to wait for requestAnimationFrame
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          expect(gridElement?.classList.contains('iazd-animate')).toBe(true);
          resolve(undefined);
        });
      });
    });

    it('should skip collision detection when skipCollisions option is true', () => {
      dashboard = new Dashboard(container);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });

      // Add widget at same position with skipCollisions - should not move
      dashboard.addWidget({ id: '2', x: 0, y: 0, w: 4, h: 3, content: 'Widget 2' }, { skipCollisions: true });

      const widget2 = dashboard.getWidget('2');
      // Widget should remain at (0, 0) since collision detection was skipped
      expect(widget2?.x).toBe(0);
      expect(widget2?.y).toBe(0);
    });

    it('should apply floatMode compaction once in batch mode', () => {
      dashboard = new Dashboard(container, { floatMode: true });

      const compactSpy = vi.spyOn(dashboard, 'compact');

      dashboard.beginBatch();
      dashboard.addWidget({ id: '1', x: 0, y: 5, w: 4, h: 3, content: 'Widget 1' });
      dashboard.addWidget({ id: '2', x: 4, y: 5, w: 4, h: 3, content: 'Widget 2' });
      dashboard.endBatch();

      // Should only compact once at the end
      expect(compactSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit layout:change event once after batch', () => {
      dashboard = new Dashboard(container);
      const layoutChangeSpy = vi.fn();
      dashboard.on('layout:change', layoutChangeSpy);

      dashboard.beginBatch();
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });
      dashboard.addWidget({ id: '2', x: 4, y: 0, w: 4, h: 3, content: 'Widget 2' });
      dashboard.endBatch();

      // Should emit once at the end
      expect(layoutChangeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('incremental rendering', () => {
    it('should only update positions without destroying DOM elements', () => {
      dashboard = new Dashboard(container);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: 'Widget 1' });
      dashboard.addWidget({ id: '2', x: 4, y: 0, w: 4, h: 3, content: 'Widget 2' });

      const widget1Element = container.querySelector('[data-widget-id="1"]') as HTMLElement;
      const widget2Element = container.querySelector('[data-widget-id="2"]') as HTMLElement;

      // Move widget 1
      dashboard.moveWidget('1', 8, 0);

      // Elements should still be the same objects (not recreated)
      const widget1ElementAfter = container.querySelector('[data-widget-id="1"]') as HTMLElement;
      const widget2ElementAfter = container.querySelector('[data-widget-id="2"]') as HTMLElement;

      expect(widget1ElementAfter).toBe(widget1Element);
      expect(widget2ElementAfter).toBe(widget2Element);
    });
  });
});
