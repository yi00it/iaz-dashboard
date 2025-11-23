# Plugin System - v0.7.0

## Overview

The plugin system allows extending IAZ Dashboard with custom functionality through a clean, event-driven API. Plugins receive a context object with full access to the dashboard's state, events, and configuration.

## Implementation Summary

### Core Components

#### 1. Plugin Context (`PluginContext`)
Located in: `src/types.ts`

```typescript
interface PluginContext {
  dashboard: any;                           // Dashboard instance
  getState(): DashboardState;               // Get current state
  setState(state, opts?): void;             // Update state
  on(event, handler): void;                 // Listen to events
  off(event, handler): void;                // Remove listener
  emit(event, ...args): void;               // Emit events
  options: DashboardOptions;                // Dashboard config
}
```

#### 2. Plugin Registration
Located in: `src/core/Dashboard.ts`

- **`.use(plugin)` method**: Register plugins at runtime
- **`plugins` option**: Auto-register during initialization
- **Plugin lifecycle**: Initialize → Execute → Listen to events

### Built-in Plugins

#### 1. Save Plugin (`src/plugins/savePlugin.ts`)
**Purpose**: Automatic localStorage persistence

**Features**:
- Auto-save with debouncing (default 500ms)
- Auto-load on initialization
- Manual save/load/clear methods
- Events: `save:success`, `save:error`, `load:success`, `load:error`

**Usage**:
```typescript
dashboard.use(savePlugin);
// or
dashboard.use(createSavePlugin({
  storageKey: 'my-key',
  debounce: 1000,
  autoLoad: true,
  autoSave: true
}));
```

#### 2. Constraints Plugin (`src/plugins/constraintsPlugin.ts`)
**Purpose**: Widget validation and constraints enforcement

**Features**:
- Max widget count limits
- Min/max widget size constraints
- Max row limits
- Aspect ratio locking
- Restricted areas (no-go zones)
- Custom validation functions
- Block or warn modes

**Usage**:
```typescript
dashboard.use(createConstraintsPlugin({
  maxWidgets: 10,
  minWidgetSize: { w: 2, h: 2 },
  maxWidgetSize: { w: 6, h: 6 },
  maxRows: 12,
  restrictedAreas: [{ x: 0, y: 0, w: 2, h: 2 }],
  blockInvalid: true
}));
```

#### 3. Snaplines Plugin (`src/plugins/snaplinesPlugin.ts`)
**Purpose**: Visual alignment guides during drag and resize

**Features**:
- Horizontal and vertical alignment guides
- Configurable snap threshold (default 10px)
- Customizable line color and style
- Shows alignments for edges and centers
- Works during drag and resize operations

**Usage**:
```typescript
dashboard.use(snaplinesPlugin);
// or
dashboard.use(createSnaplinesPlugin({
  threshold: 10,
  lineColor: '#4CAF50',
  lineStyle: 'dashed'
}));
```

## Example Demos

Located in: `examples/`

1. **dashboard-plugins-save.html** - Save plugin demonstration
2. **dashboard-plugins-constraints.html** - Constraints plugin demonstration
3. **dashboard-plugins-snaplines.html** - Snaplines plugin demonstration
4. **dashboard-plugins-all.html** - All plugins working together

## Creating Custom Plugins

### Basic Plugin Template

```typescript
import type { IAZDPlugin } from 'iazd-dashboard';

export const myPlugin: IAZDPlugin = (ctx) => {
  // 1. Access dashboard state
  const state = ctx.getState();

  // 2. Listen to events
  ctx.on('widget:add', (widget) => {
    console.log('Widget added:', widget);
  });

  ctx.on('layout:change', (state) => {
    // React to layout changes
  });

  // 3. Add custom methods to dashboard
  ctx.dashboard.myMethod = () => {
    console.log('Custom method!');
  };

  // 4. Emit plugin ready event
  ctx.emit('plugin:my-plugin:ready', { version: '1.0' });
};
```

### Advanced Plugin Example

```typescript
export function createAdvancedPlugin(options = {}) {
  return (ctx) => {
    // Plugin state
    let enabled = true;

    // Helper functions
    const doSomething = () => {
      if (!enabled) return;
      const state = ctx.getState();
      // ... plugin logic
    };

    // Event handlers
    const onWidgetAdd = (widget) => {
      doSomething();
    };

    // Register event listeners
    ctx.on('widget:add', onWidgetAdd);

    // Expose API
    ctx.dashboard.pluginAPI = {
      enable: () => { enabled = true; },
      disable: () => { enabled = false; },
    };

    // Cleanup on destroy
    ctx.on('dashboard:destroy', () => {
      ctx.off('widget:add', onWidgetAdd);
    });
  };
}
```

## Plugin Events

### Dashboard Events (Available to plugins)
- `dashboard:ready` - Dashboard initialized
- `dashboard:destroy` - Dashboard destroyed
- `widget:add` - Widget added
- `widget:update` - Widget updated
- `widget:remove` - Widget removed
- `widget:move` - Widget moved
- `widget:resize` - Widget resized
- `layout:change` - Layout changed
- `drag:start`, `drag:move`, `drag:end`, `drag:cancel`
- `resize:start`, `resize:move`, `resize:end`, `resize:cancel`
- `breakpoint:change` - Breakpoint changed

### Plugin-specific Events
Plugins can emit custom events using `ctx.emit()`:
- `plugin:{name}:ready` - Plugin initialized
- `save:success`, `save:error` - Save plugin events
- `load:success`, `load:error` - Load plugin events
- `constraint:violation` - Constraint plugin events
- `snapline:show`, `snapline:hide` - Snapline plugin events

## Best Practices

1. **Always emit a ready event** when your plugin initializes
2. **Clean up listeners** on `dashboard:destroy`
3. **Validate plugin options** and provide defaults
4. **Use debouncing** for frequent operations
5. **Document your plugin API** thoroughly
6. **Provide factory functions** for configurable plugins
7. **Avoid blocking the main thread** for heavy operations
8. **Test plugin combinations** to ensure compatibility

## Architecture

```
Dashboard Instance
    ↓
Plugin Context Created
    ↓
Plugins Registered (via .use() or options)
    ↓
Plugin Functions Called with Context
    ↓
Plugins Listen to Events & Extend Dashboard
    ↓
Dashboard Lifecycle Events Trigger Plugin Logic
```

## Files Modified/Added

### Modified Files:
- `src/core/Dashboard.ts` - Added plugin registration system
- `src/types.ts` - Plugin types already existed
- `src/index.ts` - Export plugins
- `README.md` - Added plugin documentation
- `package.json` - Updated version to 0.7.0

### New Files:
- `src/plugins/savePlugin.ts` - Save plugin implementation
- `src/plugins/constraintsPlugin.ts` - Constraints plugin implementation
- `src/plugins/snaplinesPlugin.ts` - Snaplines plugin implementation
- `src/plugins/index.ts` - Plugin exports
- `examples/dashboard-plugins-save.html` - Save demo
- `examples/dashboard-plugins-constraints.html` - Constraints demo
- `examples/dashboard-plugins-snaplines.html` - Snaplines demo
- `examples/dashboard-plugins-all.html` - Combined demo
- `PLUGIN-SYSTEM.md` - This file

## Build Output

```
dist/iazd-dashboard.esm.js  46.42 kB  (increased from 35 kB)
dist/iazd-dashboard.umd.js  32.45 kB  (increased from 25 kB)
dist/iazd-dashboard.css      7.05 kB  (unchanged)
dist/index.d.ts                        11 kB     (increased from ~8 kB)
```

## Testing

Run the examples:
```bash
npm run build
npm run dev
# Open http://localhost:5173/examples/dashboard-plugins-all.html
```

## Next Steps for v1.0.0

1. Expand test coverage for plugins
2. Performance profiling and optimization
3. Documentation website with live examples
4. NPM and CDN publishing
5. Community plugin ecosystem

---

**Status**: ✅ Complete - Milestone 7 (v0.7.0) Plugin System
**Date**: November 23, 2025
