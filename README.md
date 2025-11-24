# IAZ Dashboard

A TypeScript dashboard grid library with zero dependencies.

[![npm version](https://img.shields.io/npm/v/iaz-dashboard.svg?style=flat-square)](https://www.npmjs.com/package/iaz-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

[Live Demo](https://yi00it.github.io/iaz-dashboard/) · [Documentation](./docs)

## What it does

- Grid-based widget layout with drag & drop
- 8-direction resize handles
- Collision detection and auto-positioning
- Responsive breakpoints
- Nested grids (sub-dashboards)
- Size-to-content (auto-height widgets)
- CSS variable positioning
- Plugin system
- Works with any framework or plain JavaScript

## Install

```bash
npm install iaz-dashboard
```

Or use a CDN:

```html
<link rel="stylesheet" href="https://unpkg.com/iaz-dashboard/dist/iaz-dashboard.css">
<script src="https://unpkg.com/iaz-dashboard/dist/iaz-dashboard.umd.js"></script>
```

## Usage

```js
import { IAZDashboard } from 'iaz-dashboard';
import 'iaz-dashboard/dist/iaz-dashboard.css';

const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  margin: 16
});

dashboard.addWidget({
  id: 'widget-1',
  x: 0,
  y: 0,
  w: 4,
  h: 3,
  content: '<h3>Widget</h3>'
});
```

### Edit Mode

```js
// Disable interactions (view mode)
dashboard.setDraggable(false);
dashboard.setResizable(false);

// Enable interactions (edit mode)
dashboard.setDraggable(true);
dashboard.setResizable(true);

// Listen for changes
dashboard.on('interaction:end', (type, widget, changed) => {
  if (changed) {
    console.log(`Widget ${widget.id} was modified`);
  }
});
```

### Responsive Breakpoints

```js
const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  breakpoints: {
    mobile: { width: 0, columns: 1, rowHeight: 80 },
    tablet: { width: 640, columns: 6, rowHeight: 70 },
    desktop: { width: 1024, columns: 12, rowHeight: 60 }
  }
});

dashboard.on('breakpoint:change', ({ name }) => {
  console.log(`Now using ${name} layout`);
});
```

### Size-to-Content

Widgets that automatically adjust height based on content:

```js
dashboard.addWidget({
  id: 'auto-height',
  x: 0,
  y: 0,
  w: 4,
  h: 2,
  sizeToContent: true,
  content: '<p>Height adjusts to content</p>'
});
```

### Nested Grids

Create sub-dashboards inside widgets:

```js
dashboard.addWidget({
  id: 'container',
  x: 0,
  y: 0,
  w: 8,
  h: 6,
  subGrid: {
    columns: 6,
    rowHeight: 40,
    widgets: [
      { id: 'nested-1', x: 0, y: 0, w: 3, h: 2 },
      { id: 'nested-2', x: 3, y: 0, w: 3, h: 2 }
    ]
  }
});

// Access nested dashboard
const nestedDashboard = dashboard.getSubGrid('container');
```

### Custom Rendering

```js
const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  renderWidget: (widget, helpers) => {
    const content = helpers.createElement('div', 'custom-widget');
    content.innerHTML = `<h3>${widget.meta?.title || 'Widget'}</h3>`;
    return content;
  }
});
```

### Themes

```js
// Built-in themes
const container = document.querySelector('.iazd-container');
container.classList.add('iazd-theme-dark');

// Available: default, iazd-theme-dark, iazd-theme-minimal,
// iazd-theme-colorful, iazd-theme-glass, iazd-theme-neon
```

```css
/* Custom theme */
.iazd-container.my-theme {
  --iazd-grid-bg: #f5f5f5;
  --iazd-widget-bg: #ffffff;
  --iazd-widget-border: #e0e0e0;
  --iazd-radius: 8px;
}
```

### Plugins

```js
import { IAZDashboard, savePlugin, snaplinesPlugin } from 'iaz-dashboard';

const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  storageKey: 'my-dashboard'
})
  .use(savePlugin)
  .use(snaplinesPlugin);

// Save plugin adds: saveState(), loadState(), clearSavedState()
dashboard.saveState();
```

## API

### Options

```ts
interface DashboardOptions {
  columns: number;
  rowHeight: number;
  margin?: number;              // default: 8
  draggable?: boolean;          // default: true
  resizable?: boolean;          // default: true
  animate?: boolean;            // default: true
  floatMode?: boolean;          // default: false
  autoPosition?: boolean;       // default: true
  breakpoints?: BreakpointLayouts;
  renderWidget?: RenderWidgetHook;
  renderWidgetFrame?: RenderWidgetFrameHook;
}
```

### Widget

```ts
interface Widget {
  id: string | number;
  x: number;
  y: number;
  w: number;
  h: number;
  content?: string | HTMLElement;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  locked?: boolean;
  noMove?: boolean;
  noResize?: boolean;
  sizeToContent?: boolean;
  sizeToContentMin?: number;
  sizeToContentMax?: number;
  subGrid?: SubGridOptions;
  meta?: any;
}
```

### Methods

```ts
// Widgets
addWidget(widget): Widget
updateWidget(id, patch): Widget | null
removeWidget(id): boolean
moveWidget(id, x, y): boolean
resizeWidget(id, w, h): boolean

// State
getState(): DashboardState
loadState(state): void
updateOptions(options): this
refresh(): void
compact(): void

// Edit mode
setDraggable(enabled): this
setResizable(enabled): this
isDraggable(): boolean
isResizable(): boolean

// Sub-grids
getSubGrid(widgetId): IAZDashboard | undefined
hasSubGrid(widgetId): boolean

// Events
on(event, handler): void
off(event, handler): void
once(event, handler): void

// Lifecycle
destroy(): void
```

### Events

```ts
// Widget lifecycle
'widget:add', 'widget:remove', 'widget:move', 'widget:resize', 'widget:update'

// Interactions
'interaction:start'  // (type: 'drag' | 'resize', widget)
'interaction:end'    // (type, widget, changed: boolean)

// Drag
'drag:start', 'drag:move', 'drag:end', 'drag:cancel'

// Resize
'resize:start', 'resize:move', 'resize:end', 'resize:cancel'

// Layout
'layout:change', 'breakpoint:change', 'options:update'

// Lifecycle
'dashboard:ready', 'dashboard:destroy'
```

## Development

```bash
npm install
npm run dev          # dev server
npm run build        # build library
npm run test         # run tests
npm run typecheck    # type check
```

## License

MIT
