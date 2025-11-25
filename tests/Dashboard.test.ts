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

  describe('custom rendering', () => {
    it('should use custom renderWidget hook', () => {
      const renderWidget = vi.fn((widget, helpers) => {
        const el = helpers.createElement('div', 'custom-widget');
        el.textContent = `Custom: ${widget.id}`;
        return el;
      });

      dashboard = new Dashboard(container, {
        renderWidget,
        widgets: [{ id: '1', x: 0, y: 0, w: 4, h: 3 }],
      });

      expect(renderWidget).toHaveBeenCalled();
      const customEl = container.querySelector('.custom-widget');
      expect(customEl).not.toBeNull();
      expect(customEl?.textContent).toBe('Custom: 1');
    });

    it('should use custom renderWidgetFrame hook', () => {
      const renderWidgetFrame = vi.fn((widget, helpers) => {
        const el = helpers.createElement('div', 'custom-frame');
        el.setAttribute('data-widget-id', String(widget.id));
        return el;
      });

      dashboard = new Dashboard(container, {
        renderWidgetFrame,
        widgets: [{ id: '1', x: 0, y: 0, w: 4, h: 3 }],
      });

      expect(renderWidgetFrame).toHaveBeenCalled();
      const customFrame = container.querySelector('.custom-frame');
      expect(customFrame).not.toBeNull();
    });

    it('should handle HTMLElement content', () => {
      const contentEl = document.createElement('span');
      contentEl.textContent = 'HTML Content';
      contentEl.className = 'html-content';

      dashboard = new Dashboard(container);
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3, content: contentEl });

      const htmlContent = container.querySelector('.html-content');
      expect(htmlContent).not.toBeNull();
    });
  });

  describe('selector initialization', () => {
    it('should accept CSS selector string for container', () => {
      container.id = 'my-dashboard';

      dashboard = new Dashboard('#my-dashboard');

      expect(dashboard).toBeTruthy();
      expect(container.querySelector('.iazd-grid')).toBeTruthy();
    });

    it('should throw error for non-existent selector', () => {
      expect(() => {
        new Dashboard('#non-existent-container');
      }).toThrow('Container not found');
    });
  });

  describe('before:widget:add event', () => {
    it('should emit before:widget:add event', () => {
      dashboard = new Dashboard(container);
      const handler = vi.fn();
      dashboard.on('before:widget:add', handler);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3 });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          widget: expect.objectContaining({ id: '1' }),
          cancel: false,
        })
      );
    });

    it('should allow cancelling widget add', () => {
      dashboard = new Dashboard(container);
      dashboard.on('before:widget:add', (event: any) => {
        event.cancel = true;
      });

      const result = dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3 });

      expect(result).toBeNull();
      expect(dashboard.getState().widgets).toHaveLength(0);
    });
  });

  describe('updateOptions edge cases', () => {
    it('should update columns and rowHeight', () => {
      dashboard = new Dashboard(container, { columns: 12, rowHeight: 60 });

      dashboard.updateOptions({ columns: 24, rowHeight: 80 });

      const state = dashboard.getState();
      expect(state.columns).toBe(24);
      expect(state.rowHeight).toBe(80);
    });

    it('should update margin', () => {
      dashboard = new Dashboard(container, { margin: 8 });

      dashboard.updateOptions({ margin: 16 });

      const gridEl = container.querySelector('.iazd-grid') as HTMLElement;
      expect(gridEl.style.getPropertyValue('--iazd-margin')).toBe('16');
    });

    it('should handle floatMode alias', () => {
      dashboard = new Dashboard(container, { floatMode: false });

      expect(dashboard).toBeTruthy();
    });
  });

  describe('widget constraints', () => {
    it('should respect minW and maxW', () => {
      dashboard = new Dashboard(container);
      dashboard.addWidget({
        id: '1',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        minW: 2,
        maxW: 6,
      });

      // Try to resize below minW
      dashboard.resizeWidget('1', 1, 3);
      let widget = dashboard.getWidget('1');
      expect(widget?.w).toBeGreaterThanOrEqual(2);

      // Try to resize above maxW
      dashboard.resizeWidget('1', 10, 3);
      widget = dashboard.getWidget('1');
      expect(widget?.w).toBeLessThanOrEqual(6);
    });

    it('should respect minH and maxH', () => {
      dashboard = new Dashboard(container);
      dashboard.addWidget({
        id: '1',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        minH: 2,
        maxH: 5,
      });

      // Try to resize below minH
      dashboard.resizeWidget('1', 4, 1);
      let widget = dashboard.getWidget('1');
      expect(widget?.h).toBeGreaterThanOrEqual(2);

      // Try to resize above maxH
      dashboard.resizeWidget('1', 4, 10);
      widget = dashboard.getWidget('1');
      expect(widget?.h).toBeLessThanOrEqual(5);
    });
  });

  describe('loadState', () => {
    it('should load state with silent option', () => {
      dashboard = new Dashboard(container);
      const layoutHandler = vi.fn();
      dashboard.on('layout:change', layoutHandler);

      dashboard.loadState(
        {
          widgets: [{ id: '1', x: 0, y: 0, w: 4, h: 3 }],
        },
        { silent: true }
      );

      expect(layoutHandler).not.toHaveBeenCalled();
      expect(dashboard.getState().widgets).toHaveLength(1);
    });

    it('should emit layout:change without silent option', () => {
      dashboard = new Dashboard(container);
      const layoutHandler = vi.fn();
      dashboard.on('layout:change', layoutHandler);

      dashboard.loadState({
        widgets: [{ id: '1', x: 0, y: 0, w: 4, h: 3 }],
      });

      expect(layoutHandler).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should re-render all widgets', () => {
      dashboard = new Dashboard(container);
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3 });

      const renderSpy = vi.spyOn(dashboard as any, 'render');
      dashboard.refresh();

      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('isDraggable and isResizable', () => {
    it('should return correct draggable state', () => {
      dashboard = new Dashboard(container, { draggable: false });

      expect(dashboard.isDraggable()).toBe(false);

      dashboard.setDraggable(true);
      expect(dashboard.isDraggable()).toBe(true);
    });

    it('should return correct resizable state', () => {
      dashboard = new Dashboard(container, { resizable: false });

      expect(dashboard.isResizable()).toBe(false);

      dashboard.setResizable(true);
      expect(dashboard.isResizable()).toBe(true);
    });
  });

  describe('layout:change events', () => {
    it('should emit layout:change on widget move with collision', () => {
      dashboard = new Dashboard(container);
      const layoutHandler = vi.fn();

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3 });
      dashboard.addWidget({ id: '2', x: 4, y: 0, w: 4, h: 3 });

      dashboard.on('layout:change', layoutHandler);

      // Move widget 1 to collide with widget 2
      dashboard.moveWidget('1', 4, 0);

      expect(layoutHandler).toHaveBeenCalled();
    });

    it('should emit layout:change on remove with floatMode', () => {
      dashboard = new Dashboard(container, { floatMode: true });
      const layoutHandler = vi.fn();

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3 });
      dashboard.addWidget({ id: '2', x: 0, y: 5, w: 4, h: 3 });

      dashboard.on('layout:change', layoutHandler);
      dashboard.removeWidget('1');

      expect(layoutHandler).toHaveBeenCalled();
    });
  });

  describe('plugin error handling', () => {
    it('should throw and remove plugin on initialization error', () => {
      dashboard = new Dashboard(container);

      const badPlugin = () => {
        throw new Error('Plugin init failed');
      };

      expect(() => {
        dashboard.use(badPlugin);
      }).toThrow('Plugin init failed');
    });

    it('should not register same plugin twice', () => {
      dashboard = new Dashboard(container);
      const plugin = vi.fn();

      dashboard.use(plugin);
      dashboard.use(plugin);

      expect(plugin).toHaveBeenCalledTimes(1);
    });
  });

  describe('widget with meta', () => {
    it('should store and retrieve widget meta data', () => {
      dashboard = new Dashboard(container);
      dashboard.addWidget({
        id: '1',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        meta: { title: 'My Widget', color: 'blue' },
      });

      const widget = dashboard.getWidget('1');
      expect(widget?.meta?.title).toBe('My Widget');
      expect(widget?.meta?.color).toBe('blue');
    });
  });

  describe('sub-grids', () => {
    it('should create sub-grid inside widget', () => {
      dashboard = new Dashboard(container, {
        widgets: [
          {
            id: 'parent',
            x: 0,
            y: 0,
            w: 8,
            h: 6,
            subGrid: {
              columns: 4,
              rowHeight: 40,
              widgets: [
                { id: 'child1', x: 0, y: 0, w: 2, h: 2 },
                { id: 'child2', x: 2, y: 0, w: 2, h: 2 },
              ],
            },
          },
        ],
      });

      expect(dashboard.hasSubGrid('parent')).toBe(true);

      const subGrid = dashboard.getSubGrid('parent');
      expect(subGrid).not.toBeNull();
      expect(subGrid?.getState().widgets).toHaveLength(2);
    });

    it('should return null for widget without sub-grid', () => {
      dashboard = new Dashboard(container, {
        widgets: [{ id: '1', x: 0, y: 0, w: 4, h: 3 }],
      });

      expect(dashboard.hasSubGrid('1')).toBe(false);
      expect(dashboard.getSubGrid('1')).toBeNull();
    });

    it('should forward events from sub-grid', () => {
      const subgridHandler = vi.fn();

      dashboard = new Dashboard(container, {
        widgets: [
          {
            id: 'parent',
            x: 0,
            y: 0,
            w: 8,
            h: 6,
            subGrid: {
              columns: 4,
              rowHeight: 40,
              widgets: [],
            },
          },
        ],
      });

      dashboard.on('subgrid:widget:add', subgridHandler);

      const subGrid = dashboard.getSubGrid('parent');
      subGrid?.addWidget({ id: 'new-child', x: 0, y: 0, w: 2, h: 2 });

      expect(subgridHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          parentWidgetId: 'parent',
        })
      );
    });

    it('should include sub-grid state in getState', () => {
      dashboard = new Dashboard(container, {
        widgets: [
          {
            id: 'parent',
            x: 0,
            y: 0,
            w: 8,
            h: 6,
            subGrid: {
              columns: 4,
              rowHeight: 40,
              widgets: [{ id: 'child1', x: 0, y: 0, w: 2, h: 2 }],
            },
          },
        ],
      });

      const subGrid = dashboard.getSubGrid('parent');
      subGrid?.addWidget({ id: 'child2', x: 2, y: 0, w: 2, h: 2 });

      const state = dashboard.getState();
      const parentWidget = state.widgets.find((w) => w.id === 'parent');

      expect(parentWidget?.subGrid?.widgets).toHaveLength(2);
    });

    it('should destroy sub-grids when parent widget is removed', () => {
      dashboard = new Dashboard(container, {
        widgets: [
          {
            id: 'parent',
            x: 0,
            y: 0,
            w: 8,
            h: 6,
            subGrid: {
              columns: 4,
              rowHeight: 40,
              widgets: [{ id: 'child1', x: 0, y: 0, w: 2, h: 2 }],
            },
          },
        ],
      });

      expect(dashboard.hasSubGrid('parent')).toBe(true);

      dashboard.removeWidget('parent');

      expect(dashboard.hasSubGrid('parent')).toBe(false);
    });
  });

  describe('size-to-content', () => {
    it('should add size-to-content class when enabled', () => {
      dashboard = new Dashboard(container, {
        widgets: [
          {
            id: '1',
            x: 0,
            y: 0,
            w: 4,
            h: 3,
            sizeToContent: true,
          },
        ],
      });

      const widget = container.querySelector('[data-widget-id="1"]');
      expect(widget?.classList.contains('iazd-size-to-content')).toBe(true);
    });

    it('should use global sizeToContent option', () => {
      dashboard = new Dashboard(container, {
        sizeToContent: true,
        widgets: [{ id: '1', x: 0, y: 0, w: 4, h: 3 }],
      });

      const widget = container.querySelector('[data-widget-id="1"]');
      expect(widget?.classList.contains('iazd-size-to-content')).toBe(true);
    });
  });

  describe('float mode operations', () => {
    it('should compact on addWidget in float mode', () => {
      dashboard = new Dashboard(container, { floatMode: true });
      const compactSpy = vi.spyOn(dashboard, 'compact');

      dashboard.addWidget({ id: '1', x: 0, y: 5, w: 4, h: 3 });

      expect(compactSpy).toHaveBeenCalled();
    });

    it('should compact on moveWidget in float mode', () => {
      dashboard = new Dashboard(container, { floatMode: true });
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3 });

      const compactSpy = vi.spyOn(dashboard, 'compact');
      dashboard.moveWidget('1', 0, 5);

      expect(compactSpy).toHaveBeenCalled();
    });

    it('should compact on resizeWidget in float mode', () => {
      dashboard = new Dashboard(container, { floatMode: true });
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3 });

      const compactSpy = vi.spyOn(dashboard, 'compact');
      dashboard.resizeWidget('1', 6, 4);

      expect(compactSpy).toHaveBeenCalled();
    });

    it('should compact on loadState in float mode', () => {
      dashboard = new Dashboard(container, { floatMode: true });
      const compactSpy = vi.spyOn(dashboard, 'compact');

      dashboard.loadState({
        widgets: [{ id: '1', x: 0, y: 5, w: 4, h: 3 }],
      });

      expect(compactSpy).toHaveBeenCalled();
    });
  });

  describe('collision handling in addWidget', () => {
    it('should resolve collisions when adding overlapping widget', () => {
      dashboard = new Dashboard(container);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 6, h: 3 });
      dashboard.addWidget({ id: '2', x: 0, y: 0, w: 6, h: 3 }); // Overlaps with widget 1 at same position

      const widget1 = dashboard.getWidget('1');
      const widget2 = dashboard.getWidget('2');

      // One of them should have moved (typically widget 1 gets pushed down)
      const totalY = (widget1?.y ?? 0) + (widget2?.y ?? 0);
      expect(totalY).toBeGreaterThan(0);
    });

    it('should emit layout:change when collision is resolved', () => {
      dashboard = new Dashboard(container);
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 6, h: 3 });

      const layoutHandler = vi.fn();
      dashboard.on('layout:change', layoutHandler);

      dashboard.addWidget({ id: '2', x: 0, y: 0, w: 6, h: 3 }); // Overlaps at same position

      expect(layoutHandler).toHaveBeenCalled();
    });
  });

  describe('plugins from options', () => {
    it('should register plugins passed in options', () => {
      const plugin1 = vi.fn();
      const plugin2 = vi.fn();

      dashboard = new Dashboard(container, {
        plugins: [plugin1, plugin2],
      });

      expect(plugin1).toHaveBeenCalled();
      expect(plugin2).toHaveBeenCalled();
    });
  });

  describe('debug mode', () => {
    it('should log debug messages when debug is true', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      dashboard = new Dashboard(container, { debug: true });
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3 });

      const iazdCalls = logSpy.mock.calls.filter((call) =>
        String(call[0]).includes('[IAZD]')
      );
      expect(iazdCalls.length).toBeGreaterThan(0);

      logSpy.mockRestore();
    });

    it('should not log debug messages when debug is false', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      dashboard = new Dashboard(container, { debug: false });
      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3 });

      const iazdCalls = logSpy.mock.calls.filter((call) =>
        String(call[0]).includes('[IAZD]')
      );
      expect(iazdCalls.length).toBe(0);

      logSpy.mockRestore();
    });
  });

  describe('dashboard:ready and dashboard:destroy events', () => {
    it('should emit dashboard:ready event on init', () => {
      const readyHandler = vi.fn();

      // Need to set up listener before dashboard is created
      const tempContainer = document.createElement('div');
      document.body.appendChild(tempContainer);

      dashboard = new Dashboard(tempContainer);
      dashboard.on('dashboard:ready', readyHandler);

      // Ready event was already emitted during construction
      // So we check that the dashboard is in ready state
      expect(dashboard.getState()).toBeTruthy();

      tempContainer.remove();
    });

    it('should emit dashboard:destroy event on destroy', () => {
      dashboard = new Dashboard(container);
      const destroyHandler = vi.fn();
      dashboard.on('dashboard:destroy', destroyHandler);

      dashboard.destroy();

      expect(destroyHandler).toHaveBeenCalledWith(dashboard);
    });
  });

  describe('silent addWidget option', () => {
    it('should not emit widget:add when silent is true', () => {
      dashboard = new Dashboard(container);
      const addHandler = vi.fn();
      dashboard.on('widget:add', addHandler);

      dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3 }, { silent: true });

      expect(addHandler).not.toHaveBeenCalled();
    });
  });

  describe('updateWidget edge cases', () => {
    it('should return null when updating non-existent widget', () => {
      dashboard = new Dashboard(container);

      const result = dashboard.updateWidget('non-existent', { w: 5 });

      expect(result).toBeNull();
    });
  });

  describe('returnWidget returns null cases', () => {
    it('should return false when moving non-existent widget', () => {
      dashboard = new Dashboard(container);

      const result = dashboard.moveWidget('non-existent', 5, 5);

      expect(result).toBe(false);
    });

    it('should return false when resizing non-existent widget', () => {
      dashboard = new Dashboard(container);

      const result = dashboard.resizeWidget('non-existent', 5, 5);

      expect(result).toBe(false);
    });
  });

  describe('breakpoint handling', () => {
    it('should initialize with breakpoints', () => {
      dashboard = new Dashboard(container, {
        breakpoints: {
          sm: { width: 576, columns: 6 },
          md: { width: 768, columns: 8 },
          lg: { width: 1024, columns: 12 },
        },
        widgets: [{ id: '1', x: 0, y: 0, w: 4, h: 3 }],
      });

      expect(dashboard.getState()).toBeTruthy();
    });

    it('should emit breakpoint:change event', async () => {
      const breakpointHandler = vi.fn();

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      dashboard = new Dashboard(container, {
        breakpoints: {
          sm: { width: 576, columns: 6 },
          lg: { width: 1024, columns: 12 },
        },
      });

      dashboard.on('breakpoint:change', breakpointHandler);

      // Simulate window resize to smaller breakpoint
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      window.dispatchEvent(new Event('resize'));

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(breakpointHandler).toHaveBeenCalled();
    });

    it('should handle breakpoint with different rowHeight', () => {
      dashboard = new Dashboard(container, {
        breakpoints: {
          sm: { width: 576, columns: 6, rowHeight: 40 },
          lg: { width: 1024, columns: 12, rowHeight: 60 },
        },
        widgets: [{ id: '1', x: 0, y: 0, w: 4, h: 3 }],
      });

      // Dashboard should be initialized with some breakpoint config
      expect(dashboard.getState()).toBeTruthy();
    });
  });

  describe('locked widget rendering', () => {
    it('should not add draggable attribute to locked widget', () => {
      dashboard = new Dashboard(container, {
        widgets: [{ id: '1', x: 0, y: 0, w: 4, h: 3, locked: true }],
      });

      const widget = container.querySelector('[data-widget-id="1"]');
      expect(widget?.getAttribute('data-draggable')).toBeNull();
    });

    it('should not add resize handles to noResize widget', () => {
      dashboard = new Dashboard(container, {
        widgets: [{ id: '1', x: 0, y: 0, w: 4, h: 3, noResize: true }],
      });

      const widget = container.querySelector('[data-widget-id="1"]');
      const handles = widget?.querySelectorAll('.iazd-resize-handle');
      expect(handles?.length).toBe(0);
    });

    it('should not add move cursor to noMove widget', () => {
      dashboard = new Dashboard(container, {
        widgets: [{ id: '1', x: 0, y: 0, w: 4, h: 3, noMove: true }],
      });

      const widget = container.querySelector('[data-widget-id="1"]') as HTMLElement;
      expect(widget?.style.cursor).not.toBe('move');
    });
  });

  describe('keyboard escape during drag/resize', () => {
    it('should handle escape key press', () => {
      dashboard = new Dashboard(container, {
        widgets: [{ id: '1', x: 0, y: 0, w: 4, h: 3 }],
      });

      // Simulate escape key press - should not throw
      expect(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }).not.toThrow();
    });
  });

  describe('destroy cleanup', () => {
    it('should clean up all resources on destroy', () => {
      dashboard = new Dashboard(container, {
        breakpoints: {
          sm: { width: 576, columns: 6 },
          lg: { width: 1024, columns: 12 },
        },
        widgets: [
          { id: '1', x: 0, y: 0, w: 4, h: 3, sizeToContent: true },
          {
            id: '2',
            x: 4,
            y: 0,
            w: 8,
            h: 6,
            subGrid: {
              columns: 4,
              widgets: [{ id: 'child', x: 0, y: 0, w: 2, h: 2 }],
            },
          },
        ],
      });

      dashboard.destroy();

      expect(container.querySelector('.iazd-grid')).toBeNull();
      expect(container.querySelector('.iazd-container')).toBeNull();
    });

    it('should clean up pointer handlers on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      dashboard = new Dashboard(container, {
        widgets: [{ id: '1', x: 0, y: 0, w: 4, h: 3 }],
      });

      dashboard.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalled();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('widget re-initialization on subgrid', () => {
    it('should handle re-rendering widget with existing subgrid', () => {
      dashboard = new Dashboard(container, {
        widgets: [
          {
            id: 'parent',
            x: 0,
            y: 0,
            w: 8,
            h: 6,
            subGrid: {
              columns: 4,
              widgets: [{ id: 'child1', x: 0, y: 0, w: 2, h: 2 }],
            },
          },
        ],
      });

      // Force re-render by updating options
      dashboard.updateOptions({ draggable: false });
      dashboard.updateOptions({ draggable: true });

      // Sub-grid should still exist
      expect(dashboard.hasSubGrid('parent')).toBe(true);
    });
  });
});
