/**
 * Test setup file
 * Runs before each test file
 */

// Mock DOM APIs that might not be available in jsdom
global.PointerEvent = class PointerEvent extends MouseEvent {
  constructor(type, params = {}) {
    super(type, params);
    this.pointerId = params.pointerId || 0;
    this.width = params.width || 1;
    this.height = params.height || 1;
    this.pressure = params.pressure || 0;
    this.tangentialPressure = params.tangentialPressure || 0;
    this.tiltX = params.tiltX || 0;
    this.tiltY = params.tiltY || 0;
    this.twist = params.twist || 0;
    this.pointerType = params.pointerType || '';
    this.isPrimary = params.isPrimary || false;
  }
};

// Mock setPointerCapture/releasePointerCapture
if (typeof Element !== 'undefined') {
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || function() {};
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || function() {};
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || function() { return false; };
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
