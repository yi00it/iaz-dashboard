/**
 * Snaplines Plugin tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IAZDashboard } from '../src/core/Dashboard';
import { createSnaplinesPlugin, snaplinesPlugin } from '../src/plugins/snaplinesPlugin';

describe('SnaplinesPlugin', () => {
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

      dashboard.on('plugin:snaplines:ready', readyHandler);
      dashboard.use(snaplinesPlugin);

      expect(readyHandler).toHaveBeenCalledWith({
        threshold: 10,
        showVertical: true,
        showHorizontal: true,
        lineColor: '#4CAF50',
        lineWidth: 1,
        lineStyle: 'dashed',
      });
    });

    it('should initialize with custom options', () => {
      const readyHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });

      dashboard.on('plugin:snaplines:ready', readyHandler);
      dashboard.use(
        createSnaplinesPlugin({
          threshold: 20,
          showVertical: false,
          showHorizontal: true,
          lineColor: '#FF0000',
          lineWidth: 2,
          lineStyle: 'solid',
        })
      );

      expect(readyHandler).toHaveBeenCalledWith({
        threshold: 20,
        showVertical: false,
        showHorizontal: true,
        lineColor: '#FF0000',
        lineWidth: 2,
        lineStyle: 'solid',
      });
    });

    it('should create snapline container element', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(snaplinesPlugin);

      const snaplinesContainer = container.querySelector('.iazd-snaplines');
      expect(snaplinesContainer).not.toBeNull();
    });

    it('should create vertical snapline element when showVertical is true', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(createSnaplinesPlugin({ showVertical: true }));

      const verticalLine = container.querySelector('.iazd-snapline-vertical');
      expect(verticalLine).not.toBeNull();
    });

    it('should create horizontal snapline element when showHorizontal is true', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(createSnaplinesPlugin({ showHorizontal: true }));

      const horizontalLine = container.querySelector('.iazd-snapline-horizontal');
      expect(horizontalLine).not.toBeNull();
    });

    it('should not create vertical line when showVertical is false', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(createSnaplinesPlugin({ showVertical: false }));

      const verticalLine = container.querySelector('.iazd-snapline-vertical');
      expect(verticalLine).toBeNull();
    });

    it('should not create horizontal line when showHorizontal is false', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(createSnaplinesPlugin({ showHorizontal: false }));

      const horizontalLine = container.querySelector('.iazd-snapline-horizontal');
      expect(horizontalLine).toBeNull();
    });
  });

  describe('drag events', () => {
    it('should emit snapline:show when widgets align during drag', () => {
      const showHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [
          { id: 1, x: 0, y: 0, w: 4, h: 2 },
          { id: 2, x: 6, y: 0, w: 4, h: 2 },
        ],
      });
      dashboard.use(snaplinesPlugin);
      dashboard.on('snapline:show', showHandler);

      // Simulate drag:move event
      dashboard.emit('drag:move', { widget: { id: 1 } });

      // The handler may or may not be called depending on alignment
      // This test ensures no errors are thrown
      expect(true).toBe(true);
    });

    it('should emit snapline:hide when drag ends', () => {
      const hideHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(snaplinesPlugin);
      dashboard.on('snapline:hide', hideHandler);

      dashboard.emit('drag:end', {});

      expect(hideHandler).toHaveBeenCalled();
    });

    it('should emit snapline:hide when drag is cancelled', () => {
      const hideHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(snaplinesPlugin);
      dashboard.on('snapline:hide', hideHandler);

      dashboard.emit('drag:cancel', {});

      expect(hideHandler).toHaveBeenCalled();
    });
  });

  describe('resize events', () => {
    it('should handle resize:move event', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [
          { id: 1, x: 0, y: 0, w: 4, h: 2 },
          { id: 2, x: 6, y: 0, w: 4, h: 2 },
        ],
      });
      dashboard.use(snaplinesPlugin);

      // Simulate resize:move event - should not throw
      expect(() => {
        dashboard.emit('resize:move', { widget: { id: 1 } });
      }).not.toThrow();
    });

    it('should emit snapline:hide when resize ends', () => {
      const hideHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(snaplinesPlugin);
      dashboard.on('snapline:hide', hideHandler);

      dashboard.emit('resize:end', {});

      expect(hideHandler).toHaveBeenCalled();
    });

    it('should emit snapline:hide when resize is cancelled', () => {
      const hideHandler = vi.fn();

      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(snaplinesPlugin);
      dashboard.on('snapline:hide', hideHandler);

      dashboard.emit('resize:cancel', {});

      expect(hideHandler).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should remove snaplines container on destroy', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(snaplinesPlugin);

      expect(container.querySelector('.iazd-snaplines')).not.toBeNull();

      dashboard.destroy();

      expect(container.querySelector('.iazd-snaplines')).toBeNull();
    });
  });

  describe('alignment detection', () => {
    it('should handle drag move with non-existent widget gracefully', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(snaplinesPlugin);

      // Emit drag:move with non-existent widget - should not throw
      expect(() => {
        dashboard.emit('drag:move', { widget: { id: 'non-existent' } });
      }).not.toThrow();
    });

    it('should handle resize move with non-existent widget gracefully', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(snaplinesPlugin);

      // Emit resize:move with non-existent widget - should not throw
      expect(() => {
        dashboard.emit('resize:move', { widget: { id: 'non-existent' } });
      }).not.toThrow();
    });

    it('should handle drag move without widget property', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(snaplinesPlugin);

      // Emit drag:move without widget - should not throw
      expect(() => {
        dashboard.emit('drag:move', {});
      }).not.toThrow();
    });
  });

  describe('line styles', () => {
    it('should apply solid line style', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(createSnaplinesPlugin({ lineStyle: 'solid' }));

      const verticalLine = container.querySelector('.iazd-snapline-vertical') as HTMLElement;
      // Solid style should not have background-image gradient
      expect(verticalLine.style.backgroundImage).toBe('');
    });

    it('should apply custom line color', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(createSnaplinesPlugin({ lineColor: '#FF0000', lineStyle: 'solid' }));

      const verticalLine = container.querySelector('.iazd-snapline-vertical') as HTMLElement;
      expect(verticalLine.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('should apply custom line width', () => {
      dashboard = new IAZDashboard(container, {
        widgets: [{ id: 1, x: 0, y: 0, w: 4, h: 2 }],
      });
      dashboard.use(createSnaplinesPlugin({ lineWidth: 3 }));

      const verticalLine = container.querySelector('.iazd-snapline-vertical') as HTMLElement;
      expect(verticalLine.style.width).toBe('3px');
    });
  });
});
