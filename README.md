# IAZ Dashboard

A TypeScript dashboard grid library with zero dependencies.

[![npm version](https://img.shields.io/npm/v/iaz-dashboard.svg?style=flat-square)](https://www.npmjs.com/package/iaz-dashboard)
[![npm downloads](https://img.shields.io/npm/dm/iaz-dashboard.svg?style=flat-square)](https://www.npmjs.com/package/iaz-dashboard)
[![bundle size](https://img.shields.io/bundlephobia/minzip/iaz-dashboard?style=flat-square)](https://bundlephobia.com/package/iaz-dashboard)
[![CI](https://img.shields.io/github/actions/workflow/status/yi00it/iaz-dashboard/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/yi00it/iaz-dashboard/actions)
[![codecov](https://img.shields.io/codecov/c/github/yi00it/iaz-dashboard?style=flat-square)](https://codecov.io/gh/yi00it/iaz-dashboard)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

[Live Demo](https://yi00it.github.io/iaz-dashboard/) · [GitHub](https://github.com/yi00it/iaz-dashboard)

## Install

```bash
npm install iaz-dashboard
```

Or include directly via CDN:

```html
<link href="https://unpkg.com/iaz-dashboard/dist/iaz-dashboard.css" rel="stylesheet" />
<script src="https://unpkg.com/iaz-dashboard/dist/iaz-dashboard.umd.js"></script>
```

## Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://unpkg.com/iaz-dashboard/dist/iaz-dashboard.css" rel="stylesheet" />
  <script src="https://unpkg.com/iaz-dashboard/dist/iaz-dashboard.umd.js"></script>
</head>
<body>
  <div id="dashboard"></div>

  <script>
    const dashboard = new IAZDashboard('#dashboard', {
      columns: 12,
      rowHeight: 60
    });

    dashboard.addWidget({ id: 1, x: 0, y: 0, w: 4, h: 2, content: 'Widget 1' });
    dashboard.addWidget({ id: 2, x: 4, y: 0, w: 4, h: 2, content: 'Widget 2' });
    dashboard.addWidget({ id: 3, x: 8, y: 0, w: 4, h: 2, content: 'Widget 3' });
  </script>
</body>
</html>
```

Or with ES modules:

```js
import { IAZDashboard } from 'iaz-dashboard';
import 'iaz-dashboard/dist/iaz-dashboard.css';

const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60
});

dashboard.addWidget({ id: 1, x: 0, y: 0, w: 4, h: 2, content: 'Widget 1' });
```

## Features

- Grid-based layout with drag & drop
- 8-direction resize handles
- Collision detection
- Responsive breakpoints
- Nested grids
- Size-to-content (auto-height)
- Plugin system
- Works with any framework

## Edit Mode

Toggle drag and resize interactions:

```js
// Start in view mode
const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  draggable: false,
  resizable: false
});

// Enable edit mode
dashboard.setDraggable(true);
dashboard.setResizable(true);

// Listen for changes
dashboard.on('interaction:end', (type, widget, changed) => {
  if (changed) {
    console.log(`Widget ${widget.id} was modified`);
  }
});
```

## Responsive Breakpoints

```js
const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  breakpoints: {
    mobile: { width: 0, columns: 1 },
    tablet: { width: 640, columns: 6 },
    desktop: { width: 1024, columns: 12 }
  }
});

dashboard.on('breakpoint:change', ({ name }) => {
  console.log(`Layout: ${name}`);
});
```

## Size-to-Content

Widgets that auto-adjust height based on content:

```js
dashboard.addWidget({
  id: 'auto',
  x: 0, y: 0, w: 4, h: 2,
  sizeToContent: true,
  content: '<p>Height adjusts automatically</p>'
});
```

## Nested Grids

Create sub-dashboards inside widgets:

```js
dashboard.addWidget({
  id: 'container',
  x: 0, y: 0, w: 8, h: 6,
  subGrid: {
    columns: 4,
    rowHeight: 40,
    widgets: [
      { id: 'sub-1', x: 0, y: 0, w: 2, h: 2 },
      { id: 'sub-2', x: 2, y: 0, w: 2, h: 2 }
    ]
  }
});

// Access nested dashboard
const nested = dashboard.getSubGrid('container');
```

## Custom Rendering

```js
const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  renderWidget: (widget, helpers) => {
    const el = helpers.createElement('div', 'my-widget');
    el.innerHTML = `<h3>${widget.meta?.title || 'Widget'}</h3>`;
    return el;
  }
});
```

## Themes

```html
<!-- Add theme class to container -->
<script>
  const container = document.querySelector('.iazd-container');
  container.classList.add('iazd-theme-dark');
</script>
```

Available: `iazd-theme-dark`, `iazd-theme-minimal`, `iazd-theme-colorful`, `iazd-theme-glass`, `iazd-theme-neon`

Custom theme with CSS variables:

```css
.iazd-container.my-theme {
  --iazd-grid-bg: #f5f5f5;
  --iazd-widget-bg: #ffffff;
  --iazd-widget-border: #e0e0e0;
  --iazd-radius: 8px;
}
```

## Plugins

```js
import { IAZDashboard, savePlugin, snaplinesPlugin } from 'iaz-dashboard';

const dashboard = new IAZDashboard('#dashboard', {
  columns: 12,
  rowHeight: 60,
  storageKey: 'my-dashboard'
})
  .use(savePlugin)
  .use(snaplinesPlugin);

// Save plugin methods
dashboard.saveState();
dashboard.loadState();
dashboard.clearSavedState();
```

## API Reference

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `columns` | number | - | Number of grid columns |
| `rowHeight` | number | - | Height of each row in pixels |
| `margin` | number | 8 | Gap between widgets |
| `draggable` | boolean | true | Enable drag & drop |
| `resizable` | boolean | true | Enable resizing |
| `animate` | boolean | true | Enable animations |
| `floatMode` | boolean | false | Auto-compact layout |
| `autoPosition` | boolean | true | Auto-find position for new widgets |

### Widget Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string \| number | Unique identifier |
| `x`, `y` | number | Grid position |
| `w`, `h` | number | Size in grid units |
| `content` | string \| HTMLElement | Widget content |
| `minW`, `minH`, `maxW`, `maxH` | number | Size constraints |
| `locked` | boolean | Prevent move and resize |
| `noMove` | boolean | Prevent move only |
| `noResize` | boolean | Prevent resize only |
| `sizeToContent` | boolean | Auto-adjust height |
| `subGrid` | object | Nested grid options |

### Methods

```js
// Widget management
dashboard.addWidget(widget)
dashboard.updateWidget(id, patch)
dashboard.removeWidget(id)
dashboard.moveWidget(id, x, y)
dashboard.resizeWidget(id, w, h)

// State
dashboard.getState()
dashboard.loadState(state)
dashboard.updateOptions(options)
dashboard.refresh()
dashboard.compact()

// Edit mode
dashboard.setDraggable(enabled)
dashboard.setResizable(enabled)
dashboard.isDraggable()
dashboard.isResizable()

// Nested grids
dashboard.getSubGrid(widgetId)
dashboard.hasSubGrid(widgetId)

// Events
dashboard.on(event, handler)
dashboard.off(event, handler)

// Cleanup
dashboard.destroy()
```

### Events

```js
// Widget events
dashboard.on('widget:add', (widget) => {});
dashboard.on('widget:remove', (widget) => {});
dashboard.on('widget:move', (widget) => {});
dashboard.on('widget:resize', (widget) => {});

// Interaction events
dashboard.on('interaction:start', (type, widget) => {});
dashboard.on('interaction:end', (type, widget, changed) => {});

// Drag events
dashboard.on('drag:start', (widget, pos) => {});
dashboard.on('drag:move', (widget, pos) => {});
dashboard.on('drag:end', (widget, pos) => {});

// Resize events
dashboard.on('resize:start', (widget, size) => {});
dashboard.on('resize:move', (widget, size) => {});
dashboard.on('resize:end', (widget, size) => {});

// Layout events
dashboard.on('layout:change', (state) => {});
dashboard.on('breakpoint:change', ({ name, config }) => {});
```

## License

MIT
