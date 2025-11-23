# IAZ Dashboard

[![npm version](https://img.shields.io/npm/v/iaz-dashboard.svg?style=flat-square)](https://www.npmjs.com/package/iaz-dashboard)
[![npm downloads](https://img.shields.io/npm/dm/iaz-dashboard.svg?style=flat-square)](https://www.npmjs.com/package/iaz-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![CI](https://img.shields.io/github/actions/workflow/status/yi00it/iaz-dashboard/ci.yml?branch=main&style=flat-square)](https://github.com/yi00it/iaz-dashboard/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/iaz-dashboard?style=flat-square)](https://bundlephobia.com/package/iaz-dashboard)

A modern dashboard grid and layout builder for creating interactive, responsive dashboard interfaces. Built with pure Vanilla JavaScript and zero dependencies.

## Features

- **Zero Dependencies** - Pure Vanilla JavaScript, no external libraries required
- **Grid-Based Layout** - Flexible grid system with customizable columns and row heights
- **Drag & Drop** - Intuitive widget repositioning with mouse and touch support
- **Resizable Widgets** - 8-point resize handles with collision detection
- **Responsive Breakpoints** - Mobile-first design with automatic layout switching
- **Custom Rendering** - Hooks for complete control over widget appearance
- **Theme System** - 6 built-in themes with CSS variable customization
- **Plugin Architecture** - Extensible design with built-in and custom plugins
- **TypeScript Support** - Full type definitions included
- **Framework Agnostic** - Works with any framework or vanilla JavaScript

## Installation

### npm

```bash
npm install iaz-dashboard
```

### CDN

#### unpkg
```html
<link rel="stylesheet" href="https://unpkg.com/iaz-dashboard/dist/iaz-dashboard.css">
<script src="https://unpkg.com/iaz-dashboard/dist/iaz-dashboard.umd.js"></script>
```

#### jsDelivr
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/iaz-dashboard/dist/iaz-dashboard.css">
<script src="https://cdn.jsdelivr.net/npm/iaz-dashboard/dist/iaz-dashboard.umd.js"></script>
```

## Quick Start

### HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="iaz-dashboard.css">
  </head>
  <body>
    <div id="dashboard"></div>
    <script src="iaz-dashboard.umd.js"></script>
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

## Responsive Breakpoints

Create layouts that adapt to different screen sizes:

```js
const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  breakpoints: {
    mobile: {
      width: 0,
      columns: 1,
      rowHeight: 80,
    },
    tablet: {
      width: 640,
      columns: 6,
      rowHeight: 70,
    },
    desktop: {
      width: 1024,
      columns: 12,
      rowHeight: 60,
    },
  },
});

dashboard.on('breakpoint:change', ({ name, config }) => {
  console.log(`Switched to ${name}: ${config.columns} columns`);
});
```

## Custom Rendering

Take full control of widget appearance:

```js
function customContent(widget, helpers) {
  const content = helpers.createElement('div', 'my-custom-content');

  const header = helpers.createElement('div', 'my-header');
  header.textContent = widget.meta?.title || 'Widget';
  content.appendChild(header);

  const body = helpers.createElement('div', 'my-body');
  body.innerHTML = widget.content || '';
  content.appendChild(body);

  return content;
}

const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  renderWidget: customContent,
});
```

## Theming

Built-in themes and CSS variable customization:

```js
// Apply a built-in theme
const container = document.querySelector('.iazd-container');
container.classList.add('iazd-theme-dark');

// Available themes:
// - Default (light)
// - iazd-theme-dark
// - iazd-theme-minimal
// - iazd-theme-colorful
// - iazd-theme-glass
// - iazd-theme-neon
```

```css
/* Custom theme using CSS variables */
.iazd-container.my-theme {
  --iazd-grid-bg: #f5f5f5;
  --iazd-widget-bg: #ffffff;
  --iazd-widget-border: #e0e0e0;
  --iazd-radius: 12px;
  --iazd-handle-color: #2196F3;
}
```

## Plugin System

Extend functionality with built-in or custom plugins:

### Save Plugin

Automatically persist dashboard state to localStorage:

```js
import { IAZDashboard, savePlugin } from 'iaz-dashboard';

const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  storageKey: 'my-dashboard',
}).use(savePlugin);

// Manual operations
dashboard.saveState();
dashboard.loadState();
dashboard.clearSavedState();

// Listen to save events
dashboard.on('save:success', ({ storageKey, state }) => {
  console.log('Dashboard saved');
});
```

### Constraints Plugin

Enforce validation rules on widgets:

```js
import { createConstraintsPlugin } from 'iaz-dashboard';

dashboard.use(createConstraintsPlugin({
  maxWidgets: 10,
  minWidgetSize: { w: 2, h: 2 },
  maxWidgetSize: { w: 6, h: 6 },
  maxRows: 12,
}));

dashboard.on('constraint:violation', ({ widget, reason, type }) => {
  console.log(`Constraint violation: ${reason}`);
});
```

### Snaplines Plugin

Visual alignment guides during drag and resize:

```js
import { snaplinesPlugin } from 'iaz-dashboard';

dashboard.use(snaplinesPlugin);

dashboard.on('snapline:show', ({ widget, alignments }) => {
  console.log('Widget aligned');
});
```

### Custom Plugins

Create your own plugins:

```js
function myCustomPlugin(ctx) {
  // Access dashboard state
  const state = ctx.getState();

  // Listen to events
  ctx.on('widget:add', (widget) => {
    console.log('Widget added:', widget);
  });

  // Add custom methods
  ctx.dashboard.myCustomMethod = () => {
    console.log('Custom method called');
  };

  // Emit custom events
  ctx.emit('plugin:ready', { version: '1.0' });
}

dashboard.use(myCustomPlugin);
```

## API

### Constructor

```ts
new IAZDashboard(container: string | HTMLElement, options: DashboardOptions)
```

### Options

```ts
interface DashboardOptions {
  columns: number;           // Number of grid columns
  rowHeight: number;         // Height of each row in pixels
  margin?: number;           // Gap between widgets (default: 8)
  draggable?: boolean;       // Enable drag & drop (default: true)
  resizable?: boolean;       // Enable resizing (default: true)
  animate?: boolean;         // Enable animations (default: true)
  floatMode?: boolean;       // Auto-compact layout (default: false)
  autoPosition?: boolean;    // Auto-find position (default: true)
  breakpoints?: BreakpointLayouts;
  renderWidget?: RenderWidgetHook;
  renderWidgetFrame?: RenderWidgetFrameHook;
  debug?: boolean;
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
compact(): void

// Events
on(event: string, handler: Function): void
off(event: string, handler: Function): void
once(event: string, handler: Function): void

// Lifecycle
destroy(): void
```

### Events

```ts
// Lifecycle events
dashboard.on('dashboard:ready', (dashboard) => {});
dashboard.on('dashboard:destroy', (dashboard) => {});

// Widget events
dashboard.on('widget:add', (widget) => {});
dashboard.on('widget:remove', (widget) => {});
dashboard.on('widget:move', (widget) => {});
dashboard.on('widget:resize', (widget) => {});
dashboard.on('widget:update', (widget) => {});
dashboard.on('layout:change', (state) => {});

// Drag events
dashboard.on('drag:start', (widget, { x, y }) => {});
dashboard.on('drag:move', (widget, { x, y }) => {});
dashboard.on('drag:end', (widget, { x, y, moved }) => {});
dashboard.on('drag:cancel', (widget) => {});

// Resize events
dashboard.on('resize:start', (widget, { w, h, handle }) => {});
dashboard.on('resize:move', (widget, { w, h, x, y }) => {});
dashboard.on('resize:end', (widget, { w, h, resized }) => {});
dashboard.on('resize:cancel', (widget) => {});

// Breakpoint events
dashboard.on('breakpoint:change', ({ name, config, oldName }) => {});
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

IAZ Dashboard has comprehensive test coverage with 177 tests:

```bash
npm test                # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:ui         # Interactive test UI
npm run test:coverage   # Generate coverage report
```

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Type check
npm run typecheck

# Build the library
npm run build
```

### Build Output

- `dist/iaz-dashboard.esm.js` - ES Module
- `dist/iaz-dashboard.umd.js` - UMD (browser global)
- `dist/iaz-dashboard.css` - Styles
- `dist/index.d.ts` - TypeScript definitions

## Documentation

- [Plugin System](./PLUGIN-SYSTEM.md)
- [Testing Guide](./TESTING.md)
- [Architecture](./IAZ-DASHBOARD.md)
- [Changelog](./CHANGELOG.md)

## License

MIT © Yigit
