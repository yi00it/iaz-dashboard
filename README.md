# IAZ Dashboard

[![npm version](https://img.shields.io/npm/v/iaz-dashboard.svg?style=flat-square)](https://www.npmjs.com/package/iaz-dashboard)
[![npm downloads](https://img.shields.io/npm/dm/iaz-dashboard.svg?style=flat-square)](https://www.npmjs.com/package/iaz-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![CI](https://img.shields.io/github/actions/workflow/status/yi00it/iaz-dashboard/ci.yml?branch=main&style=flat-square)](https://github.com/yi00it/iaz-dashboard/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/iaz-dashboard?style=flat-square)](https://bundlephobia.com/package/iaz-dashboard)

> World-class Vanilla JavaScript dashboard grid & layout builder — **zero dependencies**

A modern, framework-agnostic alternative to gridstack.js for building interactive dashboard layouts with drag & drop, resizing, and responsive breakpoints.

## Features

- ✨ Pure Vanilla JavaScript (no dependencies)
- 🎯 Grid-based widget placement
- 🎨 Customizable rendering via hooks
- 📦 UMD + ESM builds
- 🎭 Event-driven architecture
- 🔌 Extensible plugin system
- 📱 Mobile & touch support
- ⚡ High performance
- 🎪 Full TypeScript support

## Current Status

**v0.7.0** - Plugin System (Milestone 7) ✅

✅ **Plugin architecture** with context-based API
✅ **Save Plugin** - Auto-save to localStorage with debouncing
✅ **Constraints Plugin** - Advanced widget validation rules
✅ **Snaplines Plugin** - Visual alignment guides
✅ Plugin registration via `.use()` method or options
✅ Plugin context with state management and events
✅ Custom plugin support with full API access

**Previous Milestones:**
- ✅ v0.6.0 - Custom Rendering & Themes (6 presets, hooks, CSS variables)
- ✅ v0.5.0 - Responsive breakpoints with layout persistence
- ✅ v0.4.0 - Resize engine with handles and constraints
- ✅ v0.3.0 - Drag & drop with mouse and touch
- ✅ v0.2.0 - Grid engine with collision detection
- ✅ v0.1.0 - Foundation and basic rendering

🚧 Coming soon: Production Release (v1.0.0)

## Installation

### Via npm (once published)

```bash
npm install iazd-dashboard
```

### Via CDN (once published)

```html
<link rel="stylesheet" href="https://cdn.example.com/iazd-dashboard.css" />
<script src="https://cdn.example.com/iazd-dashboard.umd.js"></script>
```

## Quick Start

### HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="iazd-dashboard.css" />
  </head>
  <body>
    <div id="dashboard"></div>
    <script src="iazd-dashboard.umd.js"></script>
    <script src="app.js"></script>
  </body>
</html>
```

### JavaScript

```js
const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 50,
  margin: 16,
});

// Add widgets
dashboard.addWidget({
  id: 'widget-1',
  x: 0,
  y: 0,
  w: 4,
  h: 3,
  content: '<h3>My Widget</h3><p>Content here</p>',
});

dashboard.addWidget({
  id: 'widget-2',
  x: 4,
  y: 0,
  w: 4,
  h: 3,
  content: '<h3>Another Widget</h3>',
});

// Get current state
console.log(dashboard.getState());
```

### Responsive Breakpoints (v0.5.0)

```js
const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  breakpoints: {
    mobile: {
      width: 0,        // 0px and up
      columns: 1,      // Single column layout
      rowHeight: 80,   // Taller rows for mobile
    },
    tablet: {
      width: 640,      // 640px and up
      columns: 6,      // Medium grid
      rowHeight: 70,
    },
    desktop: {
      width: 1024,     // 1024px and up
      columns: 12,     // Full grid
      rowHeight: 60,
    },
  },
});

// Listen to breakpoint changes
dashboard.on('breakpoint:change', ({ name, config, oldName }) => {
  console.log(`Switched from ${oldName} to ${name}`);
  console.log(`New layout: ${config.columns} columns`);
});
```

### Custom Rendering (v0.6.0)

```js
// Custom widget frame renderer
function customFrame(widget, helpers) {
  const frame = helpers.createElement('div', 'iazd-widget my-custom-frame');
  frame.setAttribute('data-widget-id', String(widget.id));
  // Add custom attributes, classes, or structure
  return frame;
}

// Custom widget content renderer
function customContent(widget, helpers) {
  const content = helpers.createElement('div', 'my-custom-content');

  // Create custom header
  const header = helpers.createElement('div', 'my-header');
  header.textContent = widget.meta?.title || 'Widget';
  content.appendChild(header);

  // Create custom body
  const body = helpers.createElement('div', 'my-body');
  body.innerHTML = widget.content || '';
  content.appendChild(body);

  return content;
}

const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  renderWidgetFrame: customFrame,
  renderWidget: customContent,
});
```

### Theming (v0.6.0)

```js
// Apply a theme by adding a class to the container
const container = document.querySelector('.iazd-container');
container.classList.add('iazd-theme-dark'); // or any theme

// Built-in themes:
// - (default) - Light theme
// - iazd-theme-dark - Dark theme
// - iazd-theme-minimal - Minimal clean theme
// - iazd-theme-colorful - Vibrant gradient theme
// - iazd-theme-glass - Glassmorphism effect
// - iazd-theme-neon - Cyberpunk neon theme
```

```css
/* Custom theme using CSS variables */
.iazd-container.my-custom-theme {
  --iazd-grid-bg: #yourcolor;
  --iazd-widget-bg: #yourcolor;
  --iazd-widget-border: #yourcolor;
  --iazd-widget-shadow: rgba(0, 0, 0, 0.1);
  --iazd-radius: 12px;
  --iazd-handle-color: #yourcolor;
  /* ... and many more variables */
}
```

### Plugin System (v0.7.0)

The plugin system allows you to extend the dashboard with custom functionality. Plugins receive a context object with access to the dashboard's state, events, and API.

#### Using Built-in Plugins

```js
import {
  IAZDashboard,
  savePlugin,
  createConstraintsPlugin,
  snaplinesPlugin
} from 'iazd-dashboard';

const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  storageKey: 'my-dashboard', // Used by save plugin
})
  .use(savePlugin)                    // Auto-save to localStorage
  .use(snaplinesPlugin)               // Visual alignment guides
  .use(createConstraintsPlugin({      // Widget validation rules
    maxWidgets: 10,
    minWidgetSize: { w: 2, h: 2 },
    maxWidgetSize: { w: 6, h: 6 },
  }));
```

#### Save Plugin

Automatically persists dashboard state to localStorage.

```js
import { savePlugin, createSavePlugin } from 'iazd-dashboard';

// Default plugin (uses storageKey from options)
dashboard.use(savePlugin);

// Customized plugin
dashboard.use(createSavePlugin({
  storageKey: 'my-custom-key',
  debounce: 1000,        // Save delay in ms
  autoLoad: true,        // Auto-load on init
  autoSave: true,        // Auto-save on changes
}));

// Manual save/load/clear
dashboard.saveState();
dashboard.loadState();
dashboard.clearSavedState();

// Listen to events
dashboard.on('save:success', ({ storageKey, state }) => {
  console.log('Saved to', storageKey);
});
```

#### Constraints Plugin

Enforces validation rules on widgets.

```js
import { createConstraintsPlugin } from 'iazd-dashboard';

dashboard.use(createConstraintsPlugin({
  maxWidgets: 10,                    // Max widget count
  minWidgetSize: { w: 2, h: 2 },    // Minimum size
  maxWidgetSize: { w: 6, h: 6 },    // Maximum size
  maxRows: 12,                       // Height limit
  lockAspectRatio: false,           // Lock aspect ratios
  restrictedAreas: [                // No-go zones
    { x: 0, y: 0, w: 2, h: 2 }
  ],
  blockInvalid: true,               // Block or just warn
  customValidator: (widget, state) => {
    // Custom validation logic
    return widget.w <= 4 || 'Widget too wide!';
  },
}));

// Listen to constraint violations
dashboard.on('constraint:violation', ({ widget, reason, type }) => {
  console.log(`${type} blocked:`, reason);
});
```

#### Snaplines Plugin

Shows visual alignment guides during drag and resize.

```js
import { snaplinesPlugin, createSnaplinesPlugin } from 'iazd-dashboard';

// Default plugin
dashboard.use(snaplinesPlugin);

// Customized plugin
dashboard.use(createSnaplinesPlugin({
  threshold: 10,           // Snap distance in pixels
  showVertical: true,      // Show vertical guides
  showHorizontal: true,    // Show horizontal guides
  lineColor: '#4CAF50',   // Guide color
  lineWidth: 1,           // Line thickness
  lineStyle: 'dashed',    // 'solid' or 'dashed'
}));

// Listen to snapline events
dashboard.on('snapline:show', ({ widget, alignments }) => {
  console.log('Aligned!', alignments);
});
```

#### Creating Custom Plugins

```js
// Custom plugin example
function myCustomPlugin(ctx) {
  // Access dashboard state
  const state = ctx.getState();

  // Listen to events
  ctx.on('widget:add', (widget) => {
    console.log('Widget added:', widget);
  });

  // Modify state
  ctx.on('layout:change', (state) => {
    // Custom logic here
  });

  // Add custom methods to dashboard
  ctx.dashboard.myCustomMethod = () => {
    console.log('Custom method called!');
  };

  // Emit custom events
  ctx.emit('plugin:custom:ready', { version: '1.0' });
}

// Use the plugin
dashboard.use(myCustomPlugin);

// Or register during initialization
const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  plugins: [myCustomPlugin], // Auto-registered
});
```

#### Plugin Context API

```ts
interface PluginContext {
  dashboard: IAZDashboard;   // Dashboard instance
  getState(): DashboardState;           // Get current state
  setState(state, opts?): void;         // Update state
  on(event, handler): void;             // Listen to event
  off(event, handler): void;            // Remove listener
  emit(event, ...args): void;           // Emit custom event
  options: DashboardOptions;            // Dashboard options
}
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Type check
npm run typecheck

# Run dev server
npm run dev
```

### Build Output

- `dist/iazd-dashboard.esm.js` - ES Module
- `dist/iazd-dashboard.umd.js` - UMD (browser global)
- `dist/iazd-dashboard.css` - Styles
- `dist/index.d.ts` - TypeScript definitions

### Examples

Open `examples/dashboard-basic.html` in a browser after running `npm run build`.

## API Documentation

### Constructor

```ts
new IAZDashboard(container, options)
```

### Options

```ts
interface DashboardOptions {
  columns: number;           // Number of grid columns
  rowHeight: number;         // Height of each row in pixels
  margin?: number;           // Gap between widgets (default: 8)
  draggable?: boolean;       // Enable drag & drop (default: true) ✅ v0.3.0
  resizable?: boolean;       // Enable resizing (default: true) ✅ v0.4.0
  animate?: boolean;         // Enable animations (default: true)
  floatMode?: boolean;       // Auto-compact layout (default: false)
  autoPosition?: boolean;    // Auto-find position for widgets (default: true)
  breakpoints?: BreakpointLayouts; // Responsive breakpoints (default: none) ✅ v0.5.0
  renderWidget?: RenderWidgetHook; // Custom widget renderer (default: defaultWidgetRenderer) ✅ v0.6.0
  renderWidgetFrame?: RenderWidgetFrameHook; // Custom frame renderer (default: defaultFrameRenderer) ✅ v0.6.0
  debug?: boolean;           // Enable debug logging (default: false)
}

interface BreakpointLayouts {
  [name: string]: BreakpointConfig;
}

interface BreakpointConfig {
  width: number;             // Minimum viewport width for this breakpoint
  columns: number;           // Number of columns at this breakpoint
  rowHeight?: number;        // Optional row height override
  layout?: Widget[];         // Saved layout for this breakpoint (auto-managed)
}
```

### Methods

```ts
// State management
getState(): DashboardState
loadState(state: DashboardState, opts?: { silent?: boolean }): void
refresh(): void

// Widget management
addWidget(widget: Partial<Widget> & { id: ID }): Widget
updateWidget(id: ID, patch: Partial<Widget>): Widget | null
removeWidget(id: ID): boolean
moveWidget(id: ID, x: number, y: number): boolean
resizeWidget(id: ID, w: number, h: number): boolean

// Layout operations
compact(): void  // Compact layout (float mode)

// Events
on(event: string, handler: Function): void
off(event: string, handler: Function): void
once(event: string, handler: Function): void

// Lifecycle
destroy(): void
```

### Events

```ts
dashboard.on('dashboard:ready', (dashboard) => { });
dashboard.on('widget:add', (widget) => { });
dashboard.on('widget:remove', (widget) => { });
dashboard.on('widget:move', (widget) => { });
dashboard.on('widget:resize', (widget) => { });
dashboard.on('widget:update', (widget) => { });
dashboard.on('layout:change', (state) => { });
dashboard.on('dashboard:destroy', (dashboard) => { });

// Drag events (v0.3.0)
dashboard.on('drag:start', (widget, { x, y }) => { });
dashboard.on('drag:move', (widget, { x, y }) => { });
dashboard.on('drag:end', (widget, { x, y, moved }) => { });
dashboard.on('drag:cancel', (widget) => { });

// Resize events (v0.4.0)
dashboard.on('resize:start', (widget, { w, h, handle }) => { });
dashboard.on('resize:move', (widget, { w, h, x, y }) => { });
dashboard.on('resize:end', (widget, { w, h, resized }) => { });
dashboard.on('resize:cancel', (widget) => { });

// Breakpoint events (v0.5.0)
dashboard.on('breakpoint:change', ({ name, config, oldName, oldColumns, oldRowHeight }) => { });
```

### Widget Interface

```ts
interface Widget {
  id: string | number;
  x: number;                 // Grid column position
  y: number;                 // Grid row position
  w: number;                 // Width in grid units
  h: number;                 // Height in grid units
  content?: string | HTMLElement;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  locked?: boolean;
  noMove?: boolean;
  noResize?: boolean;
  meta?: any;
}
```

## Testing

IAZ Dashboard has comprehensive test coverage with 176+ tests using Vitest.

### Running Tests

```bash
npm test                # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:ui         # Interactive test UI
npm run test:coverage   # Generate coverage report
```

### Test Coverage

- **GridEngine**: 95%+ coverage (collision detection, layout algorithms)
- **DragEngine**: 90%+ coverage (pointer events, drag operations)
- **ResizeEngine**: 90%+ coverage (resize handles, constraints)
- **BreakpointManager**: 85%+ coverage (responsive behavior)
- **Dashboard**: 75%+ coverage (integration tests)
- **Plugins**: 70%+ coverage (save, constraints, snaplines)

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## Roadmap

- [x] **v0.1.0** - Foundation (package setup, TypeScript, basic rendering) ✅
- [x] **v0.2.0** - Grid Engine (collision detection, auto-positioning, layout compaction) ✅
- [x] **v0.3.0** - Drag Engine (pointer-based drag & drop, ghost preview, auto-scroll) ✅
- [x] **v0.4.0** - Resize Engine (resize handles, constraints, collision resolution) ✅
- [x] **v0.5.0** - Responsive Breakpoints (mobile-first, layout persistence, auto-switching) ✅
- [x] **v0.6.0** - Custom Rendering & Themes (hooks, CSS variables, 6 presets) ✅
- [x] **v0.7.0** - Plugin System ✅
- [ ] **v1.0.0** - Production Release (tests, optimization, npm publication)

## Contributing

Contributions are welcome! Please follow these steps:

1. Read the [Architecture Document](./IAZ-DASHBOARD.md)
2. Check the [Testing Guide](./TESTING.md) for test requirements
3. Ensure all tests pass and coverage remains ≥80%
4. Follow the existing code style and conventions

## License

MIT © Yigit
