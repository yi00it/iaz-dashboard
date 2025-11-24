/**
 * IAZ Dashboard
 * World-class Vanilla JavaScript dashboard grid & layout builder
 * Zero dependencies
 */

export { IAZDashboard } from './core/Dashboard';
export { GridEngine } from './core/GridEngine';
export { EventEmitter } from './core/Events';

export type {
  Widget,
  DashboardState,
  DashboardOptions,
  RenderHelpers,
  RenderWidgetHook,
  RenderWidgetFrameHook,
  IAZDPlugin,
  PluginContext,
  BreakpointConfig,
  BreakpointLayouts,
  ID,
  ResizeHandle,
  SubGridOptions,
} from './types';

export type { GridRect } from './core/GridEngine';

// Export plugins
export {
  savePlugin,
  createSavePlugin,
  constraintsPlugin,
  createConstraintsPlugin,
  snaplinesPlugin,
  createSnaplinesPlugin,
} from './plugins';

export type {
  SavePluginOptions,
  ConstraintsPluginOptions,
  SnaplinesPluginOptions,
} from './plugins';

// Import CSS
import './styles/main.css';
