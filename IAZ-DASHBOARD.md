# SAHAROS-DASHBOARD-BUILDER.md
### World-class Vanilla JavaScript Dashboard Layout & Grid Builder  
### Direct Competitor to Gridstack.js — Project Brain v1.0

---

# **0. Overview**

**Saharos-Dashboard-Builder (SDB)** is a next-generation, zero-dependency, **Vanilla JavaScript dashboard grid & layout system** providing:

- Full drag & drop widgets  
- Grid-based placement  
- Collision detection  
- Snap-to-grid  
- Resize handles  
- Responsive breakpoints  
- Layout serialization  
- Touch/mobile support  
- Plugin system  
- Custom widget rendering  
- High performance for real dashboards  
- UMD + ESM builds  
- Full AI-friendly architecture  

IAZ competes directly with **Gridstack.js** while focusing on:

- **Cleaner architecture**  
- **Better extensibility**  
- **Lighter footprint**  
- **Modern Pointer Events**  
- **AI-friendly modularity**  

---

# **1. Core Principles**

✔ Pure Vanilla JS  
✔ No dependencies  
✔ Snap-to-grid movement  
✔ Deterministic collision engine  
✔ Modular rendering  
✔ Event-driven  
✔ Plugin extendable  
✔ Fast & responsive  
✔ Mobile-ready  
✔ Fully serializable JSON layout  

---

# **2. Roadmap**

## **Milestone 1 — Foundation (v0.1.0)**
- Repo setup  
- TS internal / JS output  
- Grid engine skeleton  
- Basic rendering  
- Example dashboard  

## **Milestone 2 — Grid Engine (v0.2.0)**
- Collision detection  
- Grid snapping algorithm  
- Auto-positioning  
- Layout management  

## **Milestone 3 — Drag Engine (v0.3.0)**
- Pointer-based drag  
- Mirror/ghost elements  
- Auto-scroll on edge drag  
- Drag preview  
- Drag events  

## **Milestone 4 — Resize Engine (v0.4.0)**
- Resize handles  
- Collision-aware resize  
- Min/max w/h  
- Auto-height behavior  
- Resize events  

## **Milestone 5 — Responsive Breakpoints (v0.5.0)**
- Per-screen-width layouts  
- Breakpoint detection  
- Auto reflow  
- Mobile layout support  

## **Milestone 6 — Rendering & Themes (v0.6.0)**
- Custom render hooks  
- Widget frame renderer  
- Themes via CSS variables  
- Optional Shadow DOM  

## **Milestone 7 — Plugin System (v0.7.0)**
- Plugin registration  
- Plugin context  
- Built-in plugins (save, constraints, snaplines)

## **Milestone 8 — v1.0.0**
- Optimizations  
- Docs website  
- Full test coverage  
- Release to npm, CDN  

---

# **3. Technical Architecture**

## **3.1 Folder Structure**

```
iazd-dashboard/
├── src/
│   ├── core/
│   │   ├── Dashboard.ts
│   │   ├── GridEngine.ts
│   │   ├── LayoutManager.ts
│   │   ├── DragEngine.ts
│   │   ├── ResizeEngine.ts
│   │   ├── Events.ts
│   │   ├── Plugins.ts
│   ├── dom/
│   │   ├── render.ts
│   │   ├── frames/
│   │   ├── helpers.ts
│   │   └── a11y.ts
│   ├── styles/
│   └── index.ts
├── dist/
├── examples/
├── tests/
└── README.md
```

---

# **3.2 Grid Model**

Widgets defined as:

```ts
interface Widget {
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
```

The full layout:

```ts
interface DashboardState {
  columns: number;
  rowHeight: number;
  widgets: Widget[];
  breakpoints?: BreakpointLayouts;
}
```

---

# **3.3 Drag Flow**

1. PointerDown  
2. Lock starting grid position  
3. Create ghost element  
4. Track pointer movement  
5. Compute new X/Y grid coordinates  
6. Resolve collisions  
7. Update preview  
8. On drop → commit new position  
9. Emit drag events  

---

# **3.4 Resize Flow**

1. PointerDown on handle  
2. Lock initial size  
3. Track pointer delta  
4. Snap resize to grid units  
5. Collision-safe expand/shrink  
6. Commit & emit events  

---

# **4. Public API**

---

# **4.1 Constructor**

```js
const dashboard = new IAZDashboard(container, options)
```

---

# **4.2 Options**

```ts
interface DashboardOptions {
  columns: number;
  rowHeight: number;
  margin?: number;

  draggable?: boolean;
  resizable?: boolean;

  animate?: boolean;
  autoPosition?: boolean;
  floatMode?: boolean;

  breakpoints?: {
    [name: string]: {
      width: number;
      columns: number;
      rowHeight?: number;
      layout?: Widget[];
    }
  };

  renderWidget?: RenderWidgetHook;
  renderWidgetFrame?: RenderWidgetFrameHook;

  plugins?: SDBPlugin[];
  on?: Partial<SDBEventHandlers>;

  storageKey?: string;
  debug?: boolean;
}
```

---

# **4.3 Methods**

## Layout

```ts
getState(): DashboardState;
loadState(state: DashboardState, opts?: { silent?: boolean }): void;
refresh(): void;
destroy(): void;
setOptions(patch: Partial<DashboardOptions>): void;
```

## Widget Management

```ts
addWidget(widget: Widget): Widget;
updateWidget(id: ID, patch: Partial<Widget>): Widget | null;
removeWidget(id: ID): boolean;
moveWidget(id: ID, x: number, y: number): boolean;
resizeWidget(id: ID, w: number, h: number): boolean;
```

## Utilities

```ts
serialize(): string;
deserialize(json: string): void;

scrollToWidget(id: ID): void;
use(plugin: SDBPlugin): void;
```

---

# **4.4 Events**

```ts
dashboard.on(event, handler)
dashboard.off(event, handler)
dashboard.once(event, handler)
```

### Event Map

- dashboard:ready  
- dashboard:destroy  
- widget:add  
- widget:update  
- widget:remove  
- widget:move  
- widget:resize  
- drag:start  
- drag:move  
- drag:end  
- drag:cancel  
- resize:start  
- resize:move  
- resize:end  
- layout:change  
- breakpoint:change  

---

# **5. Rendering System**

Render helpers:

```ts
interface RenderHelpers {
  createElement(tag: string, className?: string): HTMLElement;
  defaultWidgetRenderer(widget: Widget): HTMLElement;
  defaultFrameRenderer(widget: Widget): HTMLElement;
}
```

Hooks:

```ts
type RenderWidgetHook = (widget: Widget, helpers: RenderHelpers) => HTMLElement;
type RenderWidgetFrameHook = (widget: Widget, helpers: RenderHelpers) => HTMLElement;
```

---

# **6. Plugin System**

```ts
type SDBPlugin = (ctx: PluginContext) => void;

interface PluginContext {
  dashboard: IAZDashboard;
  getState(): DashboardState;
  setState(state: DashboardState, opts?: { silent?: boolean }): void;
  on: typeof dashboard.on;
  off: typeof dashboard.off;
  emit: typeof dashboard.emit;
  options: DashboardOptions;
}
```

---

# **7. Accessibility**

- Widgets → `role="region"`  
- Draggable handles labeled with ARIA  
- Keyboard navigation  
- Resizable via keyboard modifiers  

---

# **8. CSS & Theming**

CSS variables:

```
--iazd-grid-bg
--iazd-widget-bg
--iazd-widget-border
--iazd-radius
--iazd-gap
--iazd-handle-size
```

---

# **9. Engineering Rules**

1. Zero dependencies  
2. Minimal DOM updates only  
3. TS internal, JS output  
4. All interactions emit events  
5. Deterministic collision resolution  
6. Always maintain 60fps drag  
7. Always mobile-friendly  

---

# **10. Build Output**

- iazd-dashboard.esm.js  
- iazd-dashboard.umd.js  
- iazd-dashboard.css  

---

# **11. Example Initialization**

```js
const dashboard = new IAZDashboard('#dash', {
  columns: 12,
  rowHeight: 40,
  margin: 8,
  draggable: true,
  resizable: true,
});
```

---

# **12. AI Agent Instructions**

AI must:

- Follow this document strictly  
- Keep code modular  
- Provide Plan → Design → Code → Tests → Example  
- Update docs & examples  
- Never add dependencies  
- Maintain performance & correctness  

---

# **13. Example Agent Commands**

- "Initialize full project structure"
- "Implement collision detection"
- "Add drag engine"
- "Implement resize engine"
- "Add breakpoint reflow"
- "Create plugin system"

---

# **14. License**
MIT

---

# **15. Final Note**
This document is the **brain** of the entire project.  
All contributors—human or AI—must follow it exactly.

