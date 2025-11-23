/**
 * Resize handle creation and management
 */

import type { ResizeHandle } from '../core/ResizeEngine';

/**
 * Create resize handles for a widget
 */
export function createResizeHandles(handles: ResizeHandle[] = ['se', 's', 'e']): HTMLElement[] {
  return handles.map((handle) => createResizeHandle(handle));
}

/**
 * Create a single resize handle
 */
export function createResizeHandle(handle: ResizeHandle): HTMLElement {
  const handleEl = document.createElement('div');
  handleEl.className = `sdb-resize-handle sdb-resize-handle-${handle}`;
  handleEl.setAttribute('data-resize-handle', handle);

  // Set cursor based on handle position
  const cursorMap: Record<ResizeHandle, string> = {
    se: 'nwse-resize',
    sw: 'nesw-resize',
    ne: 'nesw-resize',
    nw: 'nwse-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    s: 'ns-resize',
    n: 'ns-resize',
  };

  handleEl.style.cursor = cursorMap[handle];

  return handleEl;
}

/**
 * Get handle type from element
 */
export function getHandleType(element: HTMLElement): ResizeHandle | null {
  const handle = element.getAttribute('data-resize-handle');
  return handle as ResizeHandle | null;
}

/**
 * Check if element is a resize handle
 */
export function isResizeHandle(element: HTMLElement): boolean {
  return element.classList.contains('iazd-resize-handle');
}
