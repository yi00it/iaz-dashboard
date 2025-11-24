/**
 * DOM rendering utilities for dashboard widgets
 */

import type { Widget, RenderHelpers } from '../types';

/**
 * Create a DOM element with optional className
 */
export function createElement(tag: string, className?: string): HTMLElement {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  return el;
}

/**
 * Default widget content renderer
 */
export function defaultWidgetRenderer(widget: Widget): HTMLElement {
  const content = createElement('div', 'iazd-widget-content');

  if (typeof widget.content === 'string') {
    content.innerHTML = widget.content;
  } else if (widget.content instanceof HTMLElement) {
    content.appendChild(widget.content);
  } else {
    content.textContent = `Widget ${widget.id}`;
  }

  return content;
}

/**
 * Default widget frame renderer
 */
export function defaultFrameRenderer(widget: Widget): HTMLElement {
  const frame = createElement('div', 'iazd-widget');
  frame.setAttribute('data-widget-id', String(widget.id));
  frame.setAttribute('role', 'region');
  frame.setAttribute('aria-label', `Widget ${widget.id}`);

  return frame;
}

/**
 * Get render helpers for custom hooks
 */
export function getRenderHelpers(): RenderHelpers {
  return {
    createElement,
    defaultWidgetRenderer,
    defaultFrameRenderer,
  };
}

/**
 * Position a widget element on the grid using CSS variables
 */
export function positionWidget(
  element: HTMLElement,
  widget: Widget,
  columns: number,
  rowHeight: number,
  margin: number
): void {
  // Set CSS custom properties for positioning
  element.style.setProperty('--iazd-widget-x', String(widget.x));
  element.style.setProperty('--iazd-widget-y', String(widget.y));
  element.style.setProperty('--iazd-widget-w', String(widget.w));
  element.style.setProperty('--iazd-widget-h', String(widget.h));

  // Grid-level variables (inherited from parent, but can override)
  element.style.setProperty('--iazd-columns', String(columns));
  element.style.setProperty('--iazd-row-height', String(rowHeight));
  element.style.setProperty('--iazd-margin', String(margin));
}
