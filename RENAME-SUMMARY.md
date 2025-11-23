# Project Rename Summary: Saharos Dashboard Builder → IAZ Dashboard

**Date**: November 23, 2025
**Version**: 0.7.0

## Overview

Complete renaming of the project from "Saharos Dashboard Builder" (saharos-dashboard-builder) to "IAZ Dashboard" (iazd-dashboard). All references, class names, CSS prefixes, and file names have been updated throughout the entire codebase.

## Changes Summary

### 1. Package & Build Configuration

**package.json**
- Package name: `saharos-dashboard-builder` → `iazd-dashboard`
- Main UMD: `dist/saharos-dashboard-builder.umd.js` → `dist/iazd-dashboard.umd.js`
- Main ESM: `dist/saharos-dashboard-builder.esm.js` → `dist/iazd-dashboard.esm.js`
- CSS file: `dist/saharos-dashboard-builder.css` → `dist/iazd-dashboard.css`

**vite.config.js**
- UMD global name: `SaharosDashboardBuilder` → `IAZDashboard`
- Output filenames: `saharos-dashboard-builder.*` → `iazd-dashboard.*`

### 2. Main Class & Types

**Class Name**
- `SaharosDashboardBuilder` → `IAZDashboard`

**Plugin Type**
- `SDBPlugin` → `IAZDPlugin`

**Debug Prefix**
- `[SDB]` → `[IAZD]`

### 3. CSS Class Prefixes

All CSS classes updated throughout the project:
- `sdb-container` → `iazd-container`
- `sdb-grid` → `iazd-grid`
- `sdb-widget` → `iazd-widget`
- `sdb-animate` → `iazd-animate`
- `sdb-theme-*` → `iazd-theme-*`
- And all other `sdb-*` classes

**CSS Variables**
- `--sdb-*` → `--iazd-*` (all custom properties)

### 4. Default Storage Keys

**Save Plugin**
- Default key: `sdb-state` → `iazd-state`

**Example Storage Keys**
- `sdb-save-plugin-demo` → `iazd-save-plugin-demo`
- `sdb-all-plugins-demo` → `iazd-all-plugins-demo`

### 5. Files Modified

#### Source Files (src/)
- `src/core/Dashboard.ts` - Main class renamed, debug prefix updated
- `src/types.ts` - `SDBPlugin` → `IAZDPlugin`, comments updated
- `src/index.ts` - Export name and documentation updated
- `src/plugins/savePlugin.ts` - Plugin type and storage key updated
- `src/plugins/constraintsPlugin.ts` - Plugin type updated
- `src/plugins/snaplinesPlugin.ts` - Plugin type updated
- `src/plugins/index.ts` - Comments updated
- `src/styles/main.css` - All CSS classes updated
- `src/styles/themes.css` - All CSS classes updated
- `src/dom/*.ts` - CSS class references updated

#### Documentation Files
- `README.md` - All references updated
- `PLUGIN-SYSTEM.md` - All references updated
- `SAHAROS-DASHBOARD-BUILDER.md` → `IAZ-DASHBOARD.md` (renamed and updated)

#### Example Files (examples/)
All 14 HTML example files updated:
- Import paths: `../dist/saharos-dashboard-builder.esm.js` → `../dist/iazd-dashboard.esm.js`
- Class names: `SaharosDashboardBuilder` → `IAZDashboard`
- CSS classes: `sdb-*` → `iazd-*`
- Storage keys updated

### 6. Build Output

**Before:**
```
dist/saharos-dashboard-builder.esm.js  46.42 kB
dist/saharos-dashboard-builder.umd.js  32.45 kB
dist/saharos-dashboard-builder.css      7.05 kB
```

**After:**
```
dist/iazd-dashboard.esm.js  46.39 kB
dist/iazd-dashboard.umd.js  32.42 kB
dist/iazd-dashboard.css      7.05 kB
```

### 7. API Changes

#### Import Statement
**Before:**
```javascript
import { SaharosDashboardBuilder, savePlugin } from 'saharos-dashboard-builder';
```

**After:**
```javascript
import { IAZDashboard, savePlugin } from 'iazd-dashboard';
```

#### Instantiation
**Before:**
```javascript
const dashboard = new SaharosDashboardBuilder('#container', options);
```

**After:**
```javascript
const dashboard = new IAZDashboard('#container', options);
```

#### Plugin Type
**Before:**
```typescript
export type SDBPlugin = (ctx: PluginContext) => void;
```

**After:**
```typescript
export type IAZDPlugin = (ctx: PluginContext) => void;
```

#### CSS Classes
**Before:**
```html
<div class="sdb-container sdb-theme-dark">
  <div class="sdb-grid">
    <div class="sdb-widget">...</div>
  </div>
</div>
```

**After:**
```html
<div class="iazd-container iazd-theme-dark">
  <div class="iazd-grid">
    <div class="iazd-widget">...</div>
  </div>
</div>
```

### 8. Theme Classes

All theme classes updated:
- `sdb-theme-dark` → `iazd-theme-dark`
- `sdb-theme-minimal` → `iazd-theme-minimal`
- `sdb-theme-colorful` → `iazd-theme-colorful`
- `sdb-theme-glass` → `iazd-theme-glass`
- `sdb-theme-neon` → `iazd-theme-neon`

### 9. Type Definitions

**Verified in dist/index.d.ts:**
- ✅ `export declare class IAZDashboard`
- ✅ `export declare type IAZDPlugin`
- ✅ All plugin functions return `IAZDPlugin`
- ✅ `use(plugin: IAZDPlugin): this`

### 10. Global UMD Access

**Browser global:**
```javascript
// Before
window.SaharosDashboardBuilder

// After
window.IAZDashboard
```

## Migration Guide for Users

### For npm Users

**package.json:**
```diff
{
  "dependencies": {
-   "saharos-dashboard-builder": "^0.7.0"
+   "iazd-dashboard": "^0.7.0"
  }
}
```

### For Code Updates

1. **Update imports:**
   ```diff
   - import { SaharosDashboardBuilder } from 'saharos-dashboard-builder';
   + import { IAZDashboard } from 'iazd-dashboard';
   ```

2. **Update class instantiation:**
   ```diff
   - const dashboard = new SaharosDashboardBuilder('#container', options);
   + const dashboard = new IAZDashboard('#container', options);
   ```

3. **Update plugin types (if creating custom plugins):**
   ```diff
   - import type { SDBPlugin } from 'saharos-dashboard-builder';
   + import type { IAZDPlugin } from 'iazd-dashboard';

   - export const myPlugin: SDBPlugin = (ctx) => { ... };
   + export const myPlugin: IAZDPlugin = (ctx) => { ... };
   ```

4. **Update CSS imports:**
   ```diff
   - @import 'saharos-dashboard-builder/dist/saharos-dashboard-builder.css';
   + @import 'iazd-dashboard/dist/iazd-dashboard.css';
   ```

5. **Update custom CSS (if overriding styles):**
   ```diff
   - .sdb-container { ... }
   + .iazd-container { ... }

   - --sdb-widget-bg: #fff;
   + --iazd-widget-bg: #fff;
   ```

## Verification Checklist

- ✅ Package name updated in package.json
- ✅ Build configuration updated (vite.config.js)
- ✅ Main class renamed to IAZDashboard
- ✅ Plugin type renamed to IAZDPlugin
- ✅ All CSS class prefixes changed to iazd-
- ✅ All CSS variables prefixed with --iazd-
- ✅ All documentation updated
- ✅ All examples updated
- ✅ Architecture document renamed
- ✅ Build successful with new names
- ✅ Type definitions generated correctly
- ✅ UMD global name verified
- ✅ Storage keys updated

## Breaking Changes

This is a **breaking change** for all users. The package name, main class, and all CSS classes have changed. Users must update:

1. Package installation command
2. Import statements
3. Class instantiation
4. Custom CSS selectors (if any)
5. Plugin type annotations (if creating custom plugins)

## Files Unchanged

The following remain the same:
- Project structure
- API functionality
- Plugin system behavior
- All features and capabilities
- TypeScript configuration
- Build process (only output names changed)

---

**Status**: ✅ Complete - All references to "Saharos Dashboard Builder" have been replaced with "IAZ Dashboard"
