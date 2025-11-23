/**
 * IAZDashboard - Main dashboard class
 */

import type { DashboardOptions, DashboardState, Widget, ID, IAZDPlugin, PluginContext } from '../types';
import {
  createElement,
  getRenderHelpers,
  positionWidget,
  defaultWidgetRenderer,
  defaultFrameRenderer,
} from '../dom/render';
import { GridEngine } from './GridEngine';
import { EventEmitter } from './Events';
import { DragEngine } from './DragEngine';
import { ResizeEngine } from './ResizeEngine';
import { BreakpointManager } from './BreakpointManager';
import { createResizeHandles, getHandleType, isResizeHandle } from '../dom/resizeHandles';

export class IAZDashboard extends EventEmitter {
  private container: HTMLElement;
  private options: DashboardOptions & {
    margin: number;
    draggable: boolean;
    resizable: boolean;
    animate: boolean;
    debug: boolean;
    floatMode: boolean;
    autoPosition: boolean;
  };
  private state: DashboardState;
  private gridElement: HTMLElement | null = null;
  private widgetElements: Map<string | number, HTMLElement> = new Map();
  private dragEngine: DragEngine | null = null;
  private resizeEngine: ResizeEngine | null = null;
  private breakpointManager: BreakpointManager | null = null;
  private pointerHandlers: Map<string, (e: PointerEvent) => void> = new Map();
  private plugins: IAZDPlugin[] = [];
  private pluginContext: PluginContext | null = null;

  constructor(container: string | HTMLElement, options: DashboardOptions = {}) {
    super();

    // Resolve container
    if (typeof container === 'string') {
      const el = document.querySelector<HTMLElement>(container);
      if (!el) {
        throw new Error(`Container not found: ${container}`);
      }
      this.container = el;
    } else if (!container) {
      throw new Error('Container is required');
    } else {
      this.container = container;
    }

    // Merge options with defaults
    this.options = {
      columns: 12,
      rowHeight: 60,
      margin: 8,
      draggable: true,
      resizable: true,
      animate: true,
      debug: false,
      floatMode: options.float ?? options.floatMode ?? false, // Support both float and floatMode
      autoPosition: true,
      ...options,
    };

    // Initialize state
    this.state = {
      columns: this.options.columns!,
      rowHeight: this.options.rowHeight!,
      widgets: [],
      breakpoints: this.options.breakpoints,
    };

    // Create plugin context
    this.pluginContext = this.createPluginContext();

    // Register plugins from options
    if (this.options.plugins && this.options.plugins.length > 0) {
      this.options.plugins.forEach((plugin) => this.use(plugin));
    }

    // Initialize dashboard
    this.init();

    // Add initial widgets if provided
    if (options.widgets && options.widgets.length > 0) {
      options.widgets.forEach((widget) => this.addWidget(widget));
    }
  }

  /**
   * Initialize the dashboard
   */
  private init(): void {
    this.log('Initializing dashboard');

    // Create grid container
    this.gridElement = createElement('div', 'iazd-grid');
    this.container.appendChild(this.gridElement);

    // Apply container styles
    this.container.classList.add('iazd-container');

    // Apply animate class if enabled
    if (this.options.animate) {
      this.gridElement.classList.add('iazd-animate');
    }

    // Initialize drag engine if draggable
    if (this.options.draggable) {
      this.initDragEngine();
    }

    // Initialize resize engine if resizable
    if (this.options.resizable) {
      this.initResizeEngine();
    }

    // Initialize breakpoint manager if breakpoints are defined
    if (this.options.breakpoints) {
      this.initBreakpointManager();
    }

    // Emit ready event
    this.emit('dashboard:ready', this);

    this.log('Dashboard initialized');
  }

  /**
   * Create plugin context for plugins to interact with dashboard
   */
  private createPluginContext(): PluginContext {
    return {
      dashboard: this,
      state: this.state,
      events: this,
      getState: () => this.getState(),
      setState: (state: DashboardState, opts?: { silent?: boolean }) => this.loadState(state, opts),
      on: (event: string, handler: (...args: any[]) => void) => this.on(event, handler),
      off: (event: string, handler: (...args: any[]) => void) => this.off(event, handler),
      emit: (event: string, ...args: any[]) => this.emit(event, ...args),
      options: this.options,
    };
  }

  /**
   * Register a plugin
   */
  public use(plugin: IAZDPlugin): this {
    if (!this.pluginContext) {
      throw new Error('Plugin context not initialized');
    }

    // Check if plugin is already registered
    if (this.plugins.includes(plugin)) {
      this.log('Plugin already registered, skipping');
      return this;
    }

    this.log('Registering plugin');

    // Add to plugins list
    this.plugins.push(plugin);

    // Initialize plugin with context
    try {
      plugin(this.pluginContext);
      this.log('Plugin registered successfully');
    } catch (error) {
      console.error('[IAZD] Plugin initialization failed:', error);
      // Remove from plugins list if initialization failed
      const index = this.plugins.indexOf(plugin);
      if (index > -1) {
        this.plugins.splice(index, 1);
      }
      throw error;
    }

    return this;
  }

  /**
   * Initialize drag engine
   */
  private initDragEngine(): void {
    if (!this.gridElement) return;

    this.dragEngine = new DragEngine(
      () => this.getState(),
      (state) => {
        this.state = state;
        this.render();
      },
      (event, ...args) => this.emit(event, ...args),
      this.container,
      this.gridElement,
      {
        columns: this.state.columns,
        rowHeight: this.state.rowHeight,
        margin: this.options.margin,
        animate: this.options.animate,
      }
    );

    this.setupGlobalPointerHandlers();
  }

  /**
   * Initialize resize engine
   */
  private initResizeEngine(): void {
    if (!this.gridElement) return;

    this.resizeEngine = new ResizeEngine(
      () => this.getState(),
      (state) => {
        this.state = state;
        this.render();
      },
      (event, ...args) => this.emit(event, ...args),
      this.container,
      this.gridElement,
      {
        columns: this.state.columns,
        rowHeight: this.state.rowHeight,
        margin: this.options.margin,
        animate: this.options.animate,
      }
    );

    // Global pointer handlers are shared with drag engine
  }

  /**
   * Initialize breakpoint manager
   */
  private initBreakpointManager(): void {
    if (!this.options.breakpoints) return;

    this.breakpointManager = new BreakpointManager(
      this.options.breakpoints,
      () => this.state.widgets,
      (name, config, oldName) => {
        this.log(`Breakpoint changed: ${oldName} → ${name}`);

        // Save current layout before switching
        if (oldName && this.breakpointManager) {
          this.breakpointManager.saveCurrentLayout();
        }

        // Update columns and rowHeight
        const oldColumns = this.state.columns;
        const oldRowHeight = this.state.rowHeight;

        this.state.columns = config.columns;
        this.state.rowHeight = config.rowHeight ?? this.options.rowHeight ?? 60;

        // Load layout for new breakpoint (if it exists)
        const breakpointLayout = this.breakpointManager?.getLayoutForBreakpoint(name);

        if (breakpointLayout && breakpointLayout.length > 0) {
          // Use saved layout for this breakpoint
          this.state.widgets = JSON.parse(JSON.stringify(breakpointLayout));
          this.log(`Loaded saved layout for breakpoint: ${name} (${breakpointLayout.length} widgets)`);
        } else if (oldName && oldColumns !== this.state.columns) {
          // First time switching to this breakpoint - adapt current layout
          // This is a simplified adaptation - you could implement more sophisticated logic
          this.log(`Adapting layout for new breakpoint: ${name}`);

          // Revalidate all widget positions for new column count
          this.state.widgets = this.state.widgets.map(widget => {
            // Clamp x position to new column bounds
            const maxX = Math.max(0, this.state.columns - widget.w);
            const newX = Math.min(widget.x, maxX);

            // Clamp width to new column bounds
            const maxW = this.state.columns;
            const newW = Math.min(widget.w, maxW);

            return { ...widget, x: newX, w: newW };
          });

          // Resolve any collisions that may have occurred
          const hasCollisions = this.state.widgets.some((w1, i) =>
            this.state.widgets.slice(i + 1).some(w2 =>
              GridEngine.checkCollision(w1, w2)
            )
          );

          if (hasCollisions) {
            this.state.widgets = GridEngine.compactLayout(this.state.widgets);
          }
        }

        // Update drag and resize engines with new dimensions
        if (this.dragEngine) {
          (this.dragEngine as any).columns = this.state.columns;
          (this.dragEngine as any).rowHeight = this.state.rowHeight;
        }
        if (this.resizeEngine) {
          (this.resizeEngine as any).columns = this.state.columns;
          (this.resizeEngine as any).rowHeight = this.state.rowHeight;
        }

        // Re-render everything
        this.render();

        // Emit breakpoint change event
        this.emit('breakpoint:change', {
          name,
          config,
          oldName,
          oldColumns,
          oldRowHeight,
        });

        // Emit layout change
        this.emit('layout:change', this.getState());
      },
      this.options.debug
    );

    // Start listening to window resize
    this.breakpointManager.startListening();

    this.log('Breakpoint manager initialized');
  }

  /**
   * Set up global pointer handlers for drag and resize
   */
  private setupGlobalPointerHandlers(): void {
    const onPointerMove = (e: PointerEvent) => {
      if (this.dragEngine?.isDragging()) {
        e.preventDefault();
        this.dragEngine.updateDrag(e.clientX, e.clientY);
      } else if (this.resizeEngine?.isResizing()) {
        e.preventDefault();
        this.resizeEngine.updateResize(e.clientX, e.clientY);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (this.dragEngine?.isDragging()) {
        e.preventDefault();
        this.dragEngine.endDrag();
      } else if (this.resizeEngine?.isResizing()) {
        e.preventDefault();
        this.resizeEngine.endResize();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (this.dragEngine?.isDragging()) {
          this.dragEngine.cancelDrag();
        } else if (this.resizeEngine?.isResizing()) {
          this.resizeEngine.cancelResize();
        }
      }
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('keydown', onKeyDown);

    // Store handlers for cleanup
    this.pointerHandlers.set('pointermove', onPointerMove as any);
    this.pointerHandlers.set('pointerup', onPointerUp as any);
    this.pointerHandlers.set('keydown', onKeyDown as any);
  }

  /**
   * Get current dashboard state
   */
  public getState(): DashboardState {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Serialize state to JSON string
   */
  public serialize(): string {
    return JSON.stringify(this.state);
  }

  /**
   * Load state from JSON string
   */
  public load(json: string): void {
    try {
      const state = JSON.parse(json);
      this.loadState(state);
    } catch (error) {
      console.error('[IAZD] Failed to load state from JSON:', error);
      throw error;
    }
  }

  /**
   * Load a new state
   */
  public loadState(state: Partial<DashboardState>, opts?: { silent?: boolean }): void {
    // Merge with current state to preserve columns/rowHeight
    this.state = {
      ...this.state,
      ...JSON.parse(JSON.stringify(state)),
    };

    // Apply float mode compaction if enabled
    if (this.options.floatMode) {
      this.compact();
    }

    this.render();

    if (!opts?.silent) {
      this.emit('layout:change', this.getState());
    }
  }

  /**
   * Add a widget to the dashboard
   */
  public addWidget(widget: Partial<Widget> & { id: ID }): Widget | null {
    // Auto-position if x/y not provided
    if (this.options.autoPosition && (widget.x === undefined || widget.y === undefined)) {
      const position = GridEngine.findFirstAvailablePosition(
        { w: widget.w ?? 4, h: widget.h ?? 3 },
        this.state.widgets,
        this.state.columns
      );
      widget.x = position.x;
      widget.y = position.y;
    }

    // Apply defaults
    const newWidget: Widget = {
      w: 4,
      h: 3,
      ...widget,
      x: widget.x ?? 0,
      y: widget.y ?? 0,
    };

    // Validate and snap to grid
    newWidget.x = GridEngine.snapToGrid(newWidget.x);
    newWidget.y = GridEngine.snapToGrid(newWidget.y);
    newWidget.w = GridEngine.snapToGrid(newWidget.w);
    newWidget.h = GridEngine.snapToGrid(newWidget.h);

    // Emit before:widget:add event to allow plugins to cancel
    const eventData = { widget: newWidget, cancel: false };
    this.emit('before:widget:add', eventData);

    // If cancelled by a plugin, return null
    if (eventData.cancel) {
      return null;
    }

    // Add widget and resolve collisions
    this.state.widgets.push(newWidget);

    // Resolve collisions if necessary
    const colliding = GridEngine.getCollidingWidgets(newWidget, this.state.widgets);
    if (colliding.length > 0) {
      const resolved = GridEngine.resolveCollisions(newWidget, this.state.widgets);
      if (resolved) {
        this.state.widgets = resolved;
      }
    }

    // Apply float mode compaction if enabled
    if (this.options.floatMode) {
      this.compact();
    }

    this.renderWidget(newWidget);

    // Emit events
    this.emit('widget:add', newWidget);
    if (colliding.length > 0) {
      this.emit('layout:change', this.getState());
      // Re-render all widgets since positions may have changed
      this.render();
    }

    return newWidget;
  }

  /**
   * Update a widget
   */
  public updateWidget(id: ID, patch: Partial<Widget>): Widget | null {
    const widget = this.state.widgets.find((w) => w.id === id);
    if (!widget) return null;

    Object.assign(widget, patch);

    // Re-render the widget
    this.updateWidgetElement(widget);

    this.emit('widget:update', widget);

    return widget;
  }

  /**
   * Remove a widget
   */
  public removeWidget(id: ID): boolean {
    const index = this.state.widgets.findIndex((w) => w.id === id);
    if (index === -1) return false;

    this.state.widgets.splice(index, 1);

    // Remove from DOM
    const element = this.widgetElements.get(id);
    if (element) {
      element.remove();
      this.widgetElements.delete(id);
    }

    // Apply float mode compaction if enabled
    if (this.options.floatMode) {
      this.compact();
      this.render();
    }

    this.emit('widget:remove', id);
    if (this.options.floatMode) {
      this.emit('layout:change', this.getState());
    }

    return true;
  }

  /**
   * Move a widget to a new position
   */
  public moveWidget(id: ID, x: number, y: number): boolean {
    const result = GridEngine.moveWidget(id, x, y, this.state.widgets, this.state.columns);

    if (!result) return false;

    this.state.widgets = result;

    // Apply float mode compaction if enabled
    if (this.options.floatMode) {
      this.compact();
    }

    // Re-render all widgets
    this.render();

    const widget = this.state.widgets.find((w) => w.id === id);
    if (widget) {
      this.emit('widget:move', widget);
      this.emit('layout:change', this.getState());
    }

    return true;
  }

  /**
   * Resize a widget
   */
  public resizeWidget(id: ID, w: number, h: number): boolean {
    const result = GridEngine.resizeWidget(id, w, h, this.state.widgets, this.state.columns);

    if (!result) return false;

    this.state.widgets = result;

    // Apply float mode compaction if enabled
    if (this.options.floatMode) {
      this.compact();
    }

    // Re-render all widgets
    this.render();

    const widget = this.state.widgets.find((w) => w.id === id);
    if (widget) {
      this.emit('widget:resize', widget);
      this.emit('layout:change', this.getState());
    }

    return true;
  }

  /**
   * Compact the layout (float mode)
   */
  public compact(): void {
    this.state.widgets = GridEngine.compactLayout(this.state.widgets);
  }

  /**
   * Get a widget by ID
   */
  public getWidget(id: ID): Widget | null {
    return this.state.widgets.find((w) => w.id === id) || null;
  }

  /**
   * Clear all widgets
   */
  public clear(): void {
    const widgetIds = this.state.widgets.map((w) => w.id);
    widgetIds.forEach((id) => this.removeWidget(id));
  }

  /**
   * Refresh the dashboard (re-render)
   */
  public refresh(): void {
    this.render();
  }

  /**
   * Render all widgets
   */
  private render(): void {
    if (!this.gridElement) return;

    // Clear existing widgets
    this.widgetElements.clear();
    this.gridElement.innerHTML = '';

    // Render each widget
    for (const widget of this.state.widgets) {
      this.renderWidget(widget);
    }
  }

  /**
   * Render a single widget
   */
  private renderWidget(widget: Widget): void {
    if (!this.gridElement) return;

    const helpers = getRenderHelpers();

    // Create widget frame
    const frameRenderer = this.options.renderWidgetFrame || defaultFrameRenderer;
    const frame = frameRenderer(widget, helpers);

    // Create widget content
    const contentRenderer = this.options.renderWidget || defaultWidgetRenderer;
    const content = contentRenderer(widget, helpers);

    // Append content to frame
    frame.appendChild(content);

    // Position the widget
    positionWidget(frame, widget, this.state.columns, this.state.rowHeight, this.options.margin);

    // Add draggable attribute and pointer handler
    if (this.options.draggable && !widget.locked && !widget.noMove) {
      frame.setAttribute('data-draggable', 'true');
      frame.style.cursor = 'move';

      const onPointerDown = (e: PointerEvent) => {
        // Check if this is a resize handle
        const target = e.target as HTMLElement;
        if (isResizeHandle(target)) {
          return; // Let resize handler handle it
        }

        // Only handle left mouse button or touch
        if (e.button !== 0 && e.pointerType === 'mouse') return;

        // Prevent text selection
        e.preventDefault();

        // Start drag
        if (this.dragEngine) {
          this.dragEngine.startDrag(widget.id, e.clientX, e.clientY, frame);
        }
      };

      frame.addEventListener('pointerdown', onPointerDown);
    }

    // Add resize handles if resizable
    if (this.options.resizable && !widget.locked && !widget.noResize) {
      const handles = createResizeHandles(['se', 's', 'e']);

      handles.forEach((handleEl) => {
        const onPointerDown = (e: PointerEvent) => {
          // Only handle left mouse button or touch
          if (e.button !== 0 && e.pointerType === 'mouse') return;

          // Prevent event bubbling and text selection
          e.stopPropagation();
          e.preventDefault();

          // Start resize
          const handleType = getHandleType(handleEl);
          if (handleType && this.resizeEngine) {
            this.resizeEngine.startResize(widget.id, handleType, e.clientX, e.clientY, frame);
          }
        };

        handleEl.addEventListener('pointerdown', onPointerDown);
        frame.appendChild(handleEl);
      });
    }

    // Add to grid
    this.gridElement.appendChild(frame);
    this.widgetElements.set(widget.id, frame);

    this.log(`Rendered widget ${widget.id}`);
  }

  /**
   * Update a single widget element (repositioning only)
   */
  private updateWidgetElement(widget: Widget): void {
    const element = this.widgetElements.get(widget.id);
    if (!element) return;

    positionWidget(element, widget, this.state.columns, this.state.rowHeight, this.options.margin);
  }

  /**
   * Destroy the dashboard
   */
  public destroy(): void {
    this.log('Destroying dashboard');

    this.emit('dashboard:destroy', this);

    // Destroy drag engine
    if (this.dragEngine) {
      this.dragEngine.destroy();
      this.dragEngine = null;
    }

    // Destroy resize engine
    if (this.resizeEngine) {
      this.resizeEngine.destroy();
      this.resizeEngine = null;
    }

    // Destroy breakpoint manager
    if (this.breakpointManager) {
      this.breakpointManager.destroy();
      this.breakpointManager = null;
    }

    // Remove global pointer handlers
    this.pointerHandlers.forEach((handler, event) => {
      document.removeEventListener(event as any, handler as any);
    });
    this.pointerHandlers.clear();

    if (this.gridElement) {
      this.gridElement.remove();
      this.gridElement = null;
    }

    this.widgetElements.clear();
    this.container.classList.remove('iazd-container');

    // Remove all event listeners
    this.removeAllListeners();
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[IAZD]', ...args);
    }
  }
}
