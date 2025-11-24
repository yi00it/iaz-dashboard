/**
 * Sub-Grids / Nested Grids feature tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IAZDashboard } from '../src/core/Dashboard';

describe('Sub-Grids / Nested Grids', () => {
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

  it('should create a sub-grid inside a widget', () => {
    dashboard = new IAZDashboard(container, {
      widgets: [
        {
          id: 'parent',
          x: 0,
          y: 0,
          w: 6,
          h: 4,
          subGrid: {
            columns: 4,
            widgets: [{ id: 'child1', x: 0, y: 0, w: 2, h: 2 }],
          },
        },
      ],
    });

    expect(dashboard.hasSubGrid('parent')).toBe(true);

    const subGrid = dashboard.getSubGrid('parent');
    expect(subGrid).not.toBeNull();
    expect(subGrid?.getState().widgets.length).toBe(1);
  });

  it('should clean up sub-grid when parent is removed', () => {
    dashboard = new IAZDashboard(container, {
      widgets: [
        {
          id: 'parent',
          x: 0,
          y: 0,
          w: 6,
          h: 4,
          subGrid: { widgets: [] },
        },
      ],
    });

    expect(dashboard.hasSubGrid('parent')).toBe(true);

    dashboard.removeWidget('parent');

    expect(dashboard.hasSubGrid('parent')).toBe(false);
  });

  it('should include sub-grid state in getState()', () => {
    dashboard = new IAZDashboard(container, {
      widgets: [
        {
          id: 'parent',
          x: 0,
          y: 0,
          w: 6,
          h: 4,
          subGrid: {
            widgets: [{ id: 'child', x: 0, y: 0, w: 2, h: 2 }],
          },
        },
      ],
    });

    const state = dashboard.getState();
    expect(state.widgets[0].subGrid?.widgets?.length).toBe(1);
  });

  it('should forward sub-grid events to parent', () => {
    const handler = vi.fn();

    dashboard = new IAZDashboard(container, {
      widgets: [
        {
          id: 'parent',
          x: 0,
          y: 0,
          w: 6,
          h: 4,
          subGrid: { widgets: [] },
        },
      ],
    });

    dashboard.on('subgrid:widget:add', handler);

    const subGrid = dashboard.getSubGrid('parent');
    subGrid?.addWidget({ id: 'new-child', x: 0, y: 0, w: 2, h: 2 });

    expect(handler).toHaveBeenCalled();
  });

  it('should return null for non-existent sub-grid', () => {
    dashboard = new IAZDashboard(container, {
      widgets: [{ id: 'regular', x: 0, y: 0, w: 4, h: 2 }],
    });

    expect(dashboard.getSubGrid('regular')).toBeNull();
    expect(dashboard.hasSubGrid('regular')).toBe(false);
  });

  it('should inherit options from parent dashboard', () => {
    dashboard = new IAZDashboard(container, {
      draggable: true,
      resizable: true,
      animate: false,
      widgets: [
        {
          id: 'parent',
          x: 0,
          y: 0,
          w: 6,
          h: 4,
          subGrid: {
            widgets: [{ id: 'child', x: 0, y: 0, w: 2, h: 2 }],
          },
        },
      ],
    });

    const subGrid = dashboard.getSubGrid('parent');
    expect(subGrid).not.toBeNull();
    // Sub-grid should have inherited options
    expect(subGrid?.isDraggable()).toBe(true);
    expect(subGrid?.isResizable()).toBe(true);
  });

  it('should allow sub-grid options to override parent', () => {
    dashboard = new IAZDashboard(container, {
      draggable: true,
      resizable: true,
      widgets: [
        {
          id: 'parent',
          x: 0,
          y: 0,
          w: 6,
          h: 4,
          subGrid: {
            draggable: false,
            resizable: false,
            widgets: [{ id: 'child', x: 0, y: 0, w: 2, h: 2 }],
          },
        },
      ],
    });

    const subGrid = dashboard.getSubGrid('parent');
    expect(subGrid).not.toBeNull();
    expect(subGrid?.isDraggable()).toBe(false);
    expect(subGrid?.isResizable()).toBe(false);
  });
});
