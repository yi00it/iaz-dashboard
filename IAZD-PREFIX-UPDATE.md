# IAZD Prefix Update - Product-Specific Naming

**Date**: November 23, 2025
**Version**: 0.7.0

## Rationale

Updated from generic `iaz-` prefix to product-specific `iazd-` prefix to support the IAZ product ecosystem:
- **IAZD** - IAZ Dashboard (`iazd-*` classes)
- **IAZK** - IAZ Kanban (future: `iazk-*` classes)
- **IAZG** - IAZ Gantt (future: `iazg-*` classes)

This prevents CSS class conflicts when multiple IAZ products are used together on the same page.

## Changes Applied

### 1. CSS Class Prefixes
**All CSS classes updated:**
- `iaz-container` → `iazd-container`
- `iaz-grid` → `iazd-grid`
- `iaz-widget` → `iazd-widget`
- `iaz-animate` → `iazd-animate`
- All theme classes: `iaz-theme-*` → `iazd-theme-*`
- All other classes follow the same pattern

### 2. CSS Variables
**All custom properties updated:**
- `--iaz-grid-bg` → `--iazd-grid-bg`
- `--iaz-widget-bg` → `--iazd-widget-bg`
- `--iaz-widget-border` → `--iazd-widget-border`
- And all other `--iaz-*` variables → `--iazd-*`

### 3. Plugin Type
**TypeScript type renamed:**
- `IAZPlugin` → `IAZDPlugin`

This prevents TypeScript import conflicts:
```typescript
// Now you can import from multiple IAZ products without conflicts
import { IAZDPlugin } from 'iaz-dashboard';
import { IAZKPlugin } from 'iaz-kanban';  // future
import { IAZGPlugin } from 'iaz-gantt';   // future
```

### 4. Debug Prefix
**Console logging prefix:**
- `[IAZ]` → `[IAZD]`

Helps identify which IAZ product is logging in multi-product setups.

### 5. Default Storage Keys
**localStorage keys updated:**
- `iaz-state` → `iazd-state`
- `iaz-save-plugin-demo` → `iazd-save-plugin-demo`
- `iaz-all-plugins-demo` → `iazd-all-plugins-demo`

## Files Updated

### Source Files
- All `.ts` files in `src/`
- All `.css` files in `src/styles/`
- Plugin files with storage keys

### Documentation
- `README.md`
- `PLUGIN-SYSTEM.md`
- `IAZ-DASHBOARD.md`
- `RENAME-SUMMARY.md`

### Examples
- All 14 HTML example files

## Build Verification

**Build successful:**
```
dist/iaz-dashboard.esm.js  46.42 kB
dist/iaz-dashboard.umd.js  32.45 kB
dist/iaz-dashboard.css      7.25 kB
```

**Type definitions verified:**
```typescript
export declare class IAZDashboard extends EventEmitter {
  use(plugin: IAZDPlugin): this;
}

export declare type IAZDPlugin = (ctx: PluginContext) => void;
```

## Updated Usage

### Import & Instantiation
```javascript
import { IAZDashboard, savePlugin } from 'iaz-dashboard';

const dashboard = new IAZDashboard('#container', {
  columns: 12,
  rowHeight: 60
}).use(savePlugin);
```

### HTML/CSS
```html
<div class="iazd-container iazd-theme-dark">
  <div class="iazd-grid">
    <div class="iazd-widget">...</div>
  </div>
</div>
```

### Custom CSS
```css
.iazd-container {
  --iazd-widget-bg: #fff;
  --iazd-widget-border: #ddd;
}

.iazd-widget:hover {
  background: var(--iazd-widget-bg);
}
```

### Plugin Development
```typescript
import type { IAZDPlugin } from 'iaz-dashboard';

export const myPlugin: IAZDPlugin = (ctx) => {
  ctx.on('widget:add', (widget) => {
    console.log('Widget added:', widget);
  });
};
```

## Benefits

### ✅ No CSS Conflicts
Multiple IAZ products can coexist on the same page without class name collisions.

### ✅ Clear Product Identity
Looking at CSS classes or console logs, you immediately know which product it belongs to.

### ✅ TypeScript Safety
No import naming conflicts when using multiple IAZ products in TypeScript.

### ✅ Future-Proof
Scales cleanly as more IAZ products are added to the ecosystem.

## Example: Multi-Product Page

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="iaz-dashboard.css">
  <link rel="stylesheet" href="iaz-kanban.css">
</head>
<body>
  <!-- Dashboard section -->
  <div class="iazd-container">
    <div class="iazd-grid">
      <div class="iazd-widget">Dashboard Widget</div>
    </div>
  </div>

  <!-- Kanban section -->
  <div class="iazk-container">
    <div class="iazk-board">
      <div class="iazk-column">
        <div class="iazk-card">Kanban Card</div>
      </div>
    </div>
  </div>

  <script type="module">
    import { IAZDashboard, IAZDPlugin } from 'iaz-dashboard';
    import { IAZKanban, IAZKPlugin } from 'iaz-kanban';

    const dashboard = new IAZDashboard('#dashboard', { ... });
    const kanban = new IAZKanban('#kanban', { ... });
  </script>
</body>
</html>
```

No conflicts! Each product has its own namespace.

## Summary

- ✅ CSS classes: `iaz-*` → `iazd-*`
- ✅ CSS variables: `--iaz-*` → `--iazd-*`
- ✅ Plugin type: `IAZPlugin` → `IAZDPlugin`
- ✅ Debug prefix: `[IAZ]` → `[IAZD]`
- ✅ Storage keys: `iaz-state` → `iazd-state`
- ✅ All files updated
- ✅ Build successful
- ✅ Ready for production

The project is now properly namespaced for the IAZ product ecosystem!
