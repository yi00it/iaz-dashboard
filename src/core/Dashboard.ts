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
  private batchMode: boolean = false;
  private resizeObservers: Map<string | number, ResizeObserver> = new Map();
  private subGrids: Map<string | number, IAZDashboard> = new Map();

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
      margin: this.options.margin,
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

    // Set grid-level CSS variables
    this.gridElement.style.setProperty('--iazd-columns', String(this.state.columns));
    this.gridElement.style.setProperty('--iazd-row-height', String(this.state.rowHeight));
    this.gridElement.style.setProperty('--iazd-margin', String(this.options.margin));

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
        if (this.options.floatMode) this.compact();
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
        if (this.options.floatMode) this.compact();
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

        // Update grid CSS variables
        if (this.gridElement) {
          this.gridElement.style.setProperty('--iazd-columns', String(this.state.columns));
          this.gridElement.style.setProperty('--iazd-row-height', String(this.state.rowHeight));
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
    const state = JSON.parse(JSON.stringify(this.state));

    // Include sub-grid states
    state.widgets = state.widgets.map((widget: Widget) => {
      const subGrid = this.subGrids.get(widget.id);
      if (subGrid && widget.subGrid) {
        widget.subGrid.widgets = subGrid.getState().widgets;
      }
      return widget;
    });

    return state;
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
   * Begin batch mode - disable rendering until endBatch() is called
   * Useful for adding multiple widgets efficiently
   */
  public beginBatch(): this {
    this.batchMode = true;
    // Disable animations during batch to prevent stuttering
    if (this.gridElement && this.options.animate) {
      this.gridElement.classList.remove('iazd-animate');
    }
    this.log('Batch mode enabled');
    return this;
  }

  /**
   * End batch mode and perform a single render
   */
  public endBatch(): this {
    this.batchMode = false;

    // Apply float mode compaction once if enabled
    if (this.options.floatMode) {
      this.compact();
    }

    // Render once
    this.render();

    // Re-enable animations after render completes
    if (this.gridElement && this.options.animate) {
      // Use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        if (this.gridElement) {
          this.gridElement.classList.add('iazd-animate');
        }
      });
    }

    this.emit('layout:change', this.getState());
    this.log('Batch mode disabled, rendered all widgets');
    return this;
  }

  /**
   * Add a widget to the dashboard
   */
  public addWidget(widget: Partial<Widget> & { id: ID }, options?: { skipCollisions?: boolean; silent?: boolean }): Widget | null {
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

    // Add widget to state
    this.state.widgets.push(newWidget);

    // Resolve collisions if necessary (unless skipCollisions is true)
    const skipCollisions = options?.skipCollisions ?? false;
    let colliding: Widget[] = [];

    if (!skipCollisions) {
      colliding = GridEngine.getCollidingWidgets(newWidget, this.state.widgets);
      if (colliding.length > 0) {
        const resolved = GridEngine.resolveCollisions(newWidget, this.state.widgets);
        if (resolved) {
          this.state.widgets = resolved;
        }
      }
    }

    // Apply float mode compaction if enabled (only if not in batch mode)
    if (this.options.floatMode && !this.batchMode) {
      this.compact();
    }

    // Render the widget (only if not in batch mode)
    if (!this.batchMode) {
      if (colliding.length > 0) {
        // Re-render all widgets since positions may have changed
        this.render();
      } else {
        // Just render the new widget
        this.renderWidget(newWidget);
      }
    }

    // Emit events (unless silent)
    if (!options?.silent) {
      this.emit('widget:add', newWidget);
      if (colliding.length > 0 && !this.batchMode) {
        this.emit('layout:change', this.getState());
      }
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
    this.removeWidgetElement(id);

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
   * Update dashboard options dynamically
   */
  public updateOptions(newOptions: Partial<DashboardOptions>): this {
    // Check if interaction options are changing
    const draggableChanged = 'draggable' in newOptions && newOptions.draggable !== this.options.draggable;
    const resizableChanged = 'resizable' in newOptions && newOptions.resizable !== this.options.resizable;
    const animateChanged = 'animate' in newOptions && newOptions.animate !== this.options.animate;
    const columnsChanged = 'columns' in newOptions && newOptions.columns !== this.state.columns;
    const rowHeightChanged = 'rowHeight' in newOptions && newOptions.rowHeight !== this.state.rowHeight;
    const marginChanged = 'margin' in newOptions && newOptions.margin !== this.options.margin;

    // Update options
    Object.assign(this.options, newOptions);

    // Update state for grid dimensions
    if (columnsChanged && newOptions.columns !== undefined) {
      this.state.columns = newOptions.columns;
    }
    if (rowHeightChanged && newOptions.rowHeight !== undefined) {
      this.state.rowHeight = newOptions.rowHeight;
    }
    if (marginChanged && newOptions.margin !== undefined) {
      this.state.margin = newOptions.margin;
    }

    // Update CSS variables on grid element
    if ((columnsChanged || rowHeightChanged || marginChanged) && this.gridElement) {
      this.gridElement.style.setProperty('--iazd-columns', String(this.state.columns));
      this.gridElement.style.setProperty('--iazd-row-height', String(this.state.rowHeight));
      this.gridElement.style.setProperty('--iazd-margin', String(this.options.margin));
    }

    // Update drag and resize engine options
    if ((columnsChanged || rowHeightChanged || marginChanged)) {
      if (this.dragEngine) {
        (this.dragEngine as any).options.columns = this.state.columns;
        (this.dragEngine as any).options.rowHeight = this.state.rowHeight;
        (this.dragEngine as any).options.margin = this.options.margin;
      }
      if (this.resizeEngine) {
        (this.resizeEngine as any).options.columns = this.state.columns;
        (this.resizeEngine as any).options.rowHeight = this.state.rowHeight;
        (this.resizeEngine as any).options.margin = this.options.margin;
      }
    }

    // Force full re-render if interaction options changed
    // This ensures event listeners are properly attached/detached
    if (draggableChanged || resizableChanged) {
      this.widgetElements.clear();
      if (this.gridElement) {
        this.gridElement.innerHTML = '';
      }
      this.log('Forcing full re-render due to interaction option changes');
    }

    // Handle animate class
    if (animateChanged && this.gridElement) {
      if (this.options.animate) {
        this.gridElement.classList.add('iazd-animate');
      } else {
        this.gridElement.classList.remove('iazd-animate');
      }
    }

    // Re-render to apply changes
    this.render();

    this.emit('options:update', newOptions);
    return this;
  }

  /**
   * Enable or disable dragging for all widgets
   */
  public setDraggable(enabled: boolean): this {
    return this.updateOptions({ draggable: enabled });
  }

  /**
   * Enable or disable resizing for all widgets
   */
  public setResizable(enabled: boolean): this {
    return this.updateOptions({ resizable: enabled });
  }

  /**
   * Check if dragging is enabled
   */
  public isDraggable(): boolean {
    return this.options.draggable;
  }

  /**
   * Check if resizing is enabled
   */
  public isResizable(): boolean {
    return this.options.resizable;
  }

  /**
   * Refresh the dashboard (re-render)
   */
  public refresh(): void {
    this.render();
  }

  /**
   * Render all widgets (with incremental updates)
   */
  private render(): void {
    if (!this.gridElement) return;

    // Get current widget IDs in the DOM
    const existingIds = new Set(this.widgetElements.keys());
    // Get current widget IDs in state
    const currentIds = new Set(this.state.widgets.map(w => w.id));

    // Remove widgets that are no longer in state
    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        this.removeWidgetElement(id);
      }
    }

    // Add or update widgets
    for (const widget of this.state.widgets) {
      if (existingIds.has(widget.id)) {
        // Widget exists, just update position
        this.updateWidgetElement(widget);
      } else {
        // Widget is new, render it
        this.renderWidget(widget);
      }
    }
  }

  /**
   * Remove a widget element from DOM
   */
  private removeWidgetElement(id: ID): void {
    // Clean up sub-grid
    const subGrid = this.subGrids.get(id);
    if (subGrid) {
      subGrid.destroy();
      this.subGrids.delete(id);
    }

    // Clean up ResizeObserver
    const observer = this.resizeObservers.get(id);
    if (observer) {
      observer.disconnect();
      this.resizeObservers.delete(id);
    }

    const element = this.widgetElements.get(id);
    if (element) {
      element.remove();
      this.widgetElements.delete(id);
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

    // Handle size-to-content mode
    const isSizeToContent = widget.sizeToContent ?? this.options.sizeToContent;
    if (isSizeToContent) {
      frame.classList.add('iazd-size-to-content');
      this.setupSizeToContentObserver(widget, frame);
    }

    // Handle sub-grid
    if (widget.subGrid) {
      this.initSubGrid(widget, content);
    }

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
      const handles = createResizeHandles(this.options.resizeHandles ?? ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']);

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
   * Set up ResizeObserver for size-to-content widgets
   */
  private setupSizeToContentObserver(widget: Widget, frame: HTMLElement): void {
    // Clean up existing observer
    const existingObserver = this.resizeObservers.get(widget.id);
    if (existingObserver) {
      existingObserver.disconnect();
    }

    const contentEl = frame.querySelector('.iazd-widget-content');
    if (!contentEl) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const contentHeight = entry.contentRect.height;
        const computedStyle = getComputedStyle(contentEl);
        const padding = parseInt(computedStyle.paddingTop) + parseInt(computedStyle.paddingBottom);
        const totalHeight = contentHeight + padding;

        // Calculate new grid height
        const rowHeight = this.state.rowHeight;
        const margin = this.options.margin;
        const newH = Math.max(widget.minH ?? 1, Math.ceil((totalHeight + margin) / (rowHeight + margin)));

        // Only update if height changed
        if (newH !== widget.h) {
          this.updateWidgetHeight(widget.id, newH);
        }
      }
    });

    observer.observe(contentEl);
    this.resizeObservers.set(widget.id, observer);
  }

  /**
   * Update widget height (for size-to-content)
   */
  private updateWidgetHeight(id: ID, newH: number): void {
    const widget = this.state.widgets.find((w) => w.id === id);
    if (!widget) return;

    const oldH = widget.h;
    widget.h = newH;

    // Check for collisions and resolve
    const colliding = GridEngine.getCollidingWidgets(widget, this.state.widgets);
    if (colliding.length > 0) {
      const resolved = GridEngine.resolveCollisions(widget, this.state.widgets);
      if (resolved) {
        this.state.widgets = resolved;
        this.render();
      }
    } else {
      this.updateWidgetElement(widget);
    }

    if (oldH !== newH) {
      this.emit('widget:resize', widget);
      this.emit('layout:change', this.getState());
    }
  }

  /**
   * Initialize a sub-grid inside a widget
   */
  private initSubGrid(widget: Widget, contentElement: HTMLElement): void {
    const subGridConfig = widget.subGrid!;

    // Clean up existing sub-grid
    const existingSubGrid = this.subGrids.get(widget.id);
    if (existingSubGrid) {
      existingSubGrid.destroy();
    }

    // Create sub-grid container
    const subGridContainer = document.createElement('div');
    subGridContainer.className = 'iazd-subgrid-container';
    subGridContainer.style.width = '100%';
    subGridContainer.style.height = '100%';
    subGridContainer.style.position = 'relative';

    // Clear content and add sub-grid container
    contentElement.innerHTML = '';
    contentElement.appendChild(subGridContainer);

    // Create sub-grid with inherited/overridden options
    const subGrid = new IAZDashboard(subGridContainer, {
      columns: subGridConfig.columns ?? 6,
      rowHeight: subGridConfig.rowHeight ?? 40,
      margin: subGridConfig.margin ?? 4,
      draggable: subGridConfig.draggable ?? this.options.draggable,
      resizable: subGridConfig.resizable ?? this.options.resizable,
      resizeHandles: subGridConfig.resizeHandles ?? this.options.resizeHandles,
      animate: subGridConfig.animate ?? this.options.animate,
      floatMode: subGridConfig.floatMode ?? this.options.floatMode,
      sizeToContent: subGridConfig.sizeToContent ?? this.options.sizeToContent,
      widgets: subGridConfig.widgets ?? [],
      debug: this.options.debug,
    });

    // Store reference
    this.subGrids.set(widget.id, subGrid);

    // Forward events from sub-grid with parent context
    this.forwardSubGridEvents(widget.id, subGrid);

    this.log(`Initialized sub-grid for widget ${widget.id}`);
  }

  /**
   * Forward events from sub-grid to parent
   */
  private forwardSubGridEvents(parentWidgetId: ID, subGrid: IAZDashboard): void {
    const eventsToForward = [
      'widget:add',
      'widget:remove',
      'widget:move',
      'widget:resize',
      'widget:update',
      'layout:change',
      'drag:start',
      'drag:end',
      'resize:start',
      'resize:end',
    ];

    eventsToForward.forEach((eventName) => {
      subGrid.on(eventName, (...args: any[]) => {
        this.emit(`subgrid:${eventName}`, { parentWidgetId, subGrid, originalArgs: args });
      });
    });
  }

  /**
   * Get the sub-grid instance for a widget
   */
  public getSubGrid(widgetId: ID): IAZDashboard | null {
    return this.subGrids.get(widgetId) || null;
  }

  /**
   * Check if a widget has a sub-grid
   */
  public hasSubGrid(widgetId: ID): boolean {
    return this.subGrids.has(widgetId);
  }

  /**
   * Destroy the dashboard
   */
  public destroy(): void {
    this.log('Destroying dashboard');

    this.emit('dashboard:destroy', this);

    // Destroy all sub-grids
    this.subGrids.forEach((subGrid) => subGrid.destroy());
    this.subGrids.clear();

    // Clean up all ResizeObservers
    this.resizeObservers.forEach((observer) => observer.disconnect());
    this.resizeObservers.clear();

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
