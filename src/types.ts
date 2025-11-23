/**
 * Core types for Saharos Dashboard Builder
 */

export type ID = string | number;

/**
 * Widget represents a single dashboard item on the grid
 */
export interface Widget {
  id: ID;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  locked?: boolean;
  noMove?: boolean;
  noResize?: boolean;
  content?: string | HTMLElement;
  meta?: any;
}

/**
 * Breakpoint layout configuration
 */
export interface BreakpointConfig {
  width: number;
  columns: number;
  rowHeight?: number;
  layout?: Widget[];
}

export interface BreakpointLayouts {
  [name: string]: BreakpointConfig;
}

/**
 * Dashboard state - single source of truth
 */
export interface DashboardState {
  columns: number;
  rowHeight: number;
  widgets: Widget[];
  breakpoints?: BreakpointLayouts;
}

/**
 * Render helpers passed to custom render hooks
 */
export interface RenderHelpers {
  createElement(tag: string, className?: string): HTMLElement;
  defaultWidgetRenderer(widget: Widget): HTMLElement;
  defaultFrameRenderer(widget: Widget): HTMLElement;
}

/**
 * Custom render hooks
 */
export type RenderWidgetHook = (widget: Widget, helpers: RenderHelpers) => HTMLElement;
export type RenderWidgetFrameHook = (widget: Widget, helpers: RenderHelpers) => HTMLElement;

/**
 * Plugin context passed to each plugin
 */
export interface PluginContext {
  dashboard: any; // Will be IAZDashboard
  state: DashboardState; // Direct access to state
  events: any; // Event emitter reference
  getState(): DashboardState;
  setState(state: DashboardState, opts?: { silent?: boolean }): void;
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
  options: DashboardOptions;
}

/**
 * Plugin function signature
 */
export type IAZDPlugin = (ctx: PluginContext) => void;

/**
 * Dashboard configuration options
 */
export interface DashboardOptions {
  columns?: number;
  rowHeight?: number;
  margin?: number;

  draggable?: boolean;
  resizable?: boolean;

  animate?: boolean;
  autoPosition?: boolean;
  float?: boolean; // Alias for floatMode
  floatMode?: boolean;

  breakpoints?: BreakpointLayouts;

  renderWidget?: RenderWidgetHook;
  renderWidgetFrame?: RenderWidgetFrameHook;

  plugins?: IAZDPlugin[];
  widgets?: Widget[];

  storageKey?: string;
  debug?: boolean;
}
