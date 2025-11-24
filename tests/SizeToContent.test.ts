/**
 * Size-to-Content feature tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IAZDashboard } from '../src/core/Dashboard';

describe('Size-to-Content', () => {
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

  it('should add size-to-content class when enabled on widget', () => {
    dashboard = new IAZDashboard(container, {
      widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2, sizeToContent: true }],
    });

    const widget = container.querySelector('[data-widget-id="1"]');
    expect(widget?.classList.contains('iazd-size-to-content')).toBe(true);
  });

  it('should respect global sizeToContent option', () => {
    dashboard = new IAZDashboard(container, {
      sizeToContent: true,
      widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
    });

    const widget = container.querySelector('[data-widget-id="1"]');
    expect(widget?.classList.contains('iazd-size-to-content')).toBe(true);
  });

  it('widget-level sizeToContent false should override global true', () => {
    dashboard = new IAZDashboard(container, {
      sizeToContent: true,
      widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2, sizeToContent: false }],
    });

    const widget = container.querySelector('[data-widget-id="1"]');
    expect(widget?.classList.contains('iazd-size-to-content')).toBe(false);
  });

  it('should not add size-to-content class when disabled', () => {
    dashboard = new IAZDashboard(container, {
      widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
    });

    const widget = container.querySelector('[data-widget-id="1"]');
    expect(widget?.classList.contains('iazd-size-to-content')).toBe(false);
  });
});
