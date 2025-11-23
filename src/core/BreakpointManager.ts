/**
 * BreakpointManager - Responsive breakpoint detection and layout switching
 * Handles viewport-based layout adaptation
 */

import type { Widget, BreakpointLayouts, BreakpointConfig } from '../types';

export class BreakpointManager {
  private currentBreakpointName: string | null = null;
  private resizeHandler: (() => void) | null = null;
  private resizeTimeout: number | null = null;
  private readonly RESIZE_DEBOUNCE = 150; // ms

  constructor(
    private breakpoints: BreakpointLayouts,
    private getCurrentLayout: () => Widget[],
    private onBreakpointChange: (name: string, config: BreakpointConfig, oldName: string | null) => void,
    private debug: boolean = false
  ) {
    // Sort breakpoints by width (mobile-first)
    this.sortBreakpoints();
  }

  /**
   * Sort breakpoints by width in ascending order (mobile-first)
   */
  private sortBreakpoints(): void {
    const sorted = Object.entries(this.breakpoints).sort(([, a], [, b]) => a.width - b.width);
    this.breakpoints = Object.fromEntries(sorted);
  }

  /**
   * Get current viewport width
   */
  private getViewportWidth(): number {
    return window.innerWidth || document.documentElement.clientWidth;
  }

  /**
   * Detect current breakpoint based on viewport width
   */
  public getCurrentBreakpoint(): { name: string; config: BreakpointConfig } | null {
    const width = this.getViewportWidth();
    let matchedBreakpoint: { name: string; config: BreakpointConfig } | null = null;

    // Find the largest breakpoint that fits (mobile-first)
    for (const [name, config] of Object.entries(this.breakpoints)) {
      if (width >= config.width) {
        matchedBreakpoint = { name, config };
      } else {
        break; // Breakpoints are sorted, so we can stop here
      }
    }

    return matchedBreakpoint;
  }

  /**
   * Get layout for a specific breakpoint
   */
  public getLayoutForBreakpoint(name: string): Widget[] | null {
    const config = this.breakpoints[name];
    if (!config) return null;

    return config.layout || null;
  }

  /**
   * Save current layout for a specific breakpoint
   */
  public saveLayoutForBreakpoint(name: string, layout: Widget[]): void {
    if (this.breakpoints[name]) {
      this.breakpoints[name].layout = JSON.parse(JSON.stringify(layout));
      this.log(`Saved layout for breakpoint: ${name}`);
    }
  }

  /**
   * Save current layout for current breakpoint
   */
  public saveCurrentLayout(): void {
    if (!this.currentBreakpointName) return;

    const layout = this.getCurrentLayout();
    this.saveLayoutForBreakpoint(this.currentBreakpointName, layout);
  }

  /**
   * Switch to a specific breakpoint
   */
  public switchToBreakpoint(name: string, force: boolean = false): boolean {
    const config = this.breakpoints[name];
    if (!config) {
      this.log(`Breakpoint not found: ${name}`, 'warn');
      return false;
    }

    // Check if already at this breakpoint
    if (!force && this.currentBreakpointName === name) {
      this.log(`Already at breakpoint: ${name}`);
      return false;
    }

    const oldName = this.currentBreakpointName;

    // Save current layout before switching (if we have a current breakpoint)
    if (oldName) {
      this.saveCurrentLayout();
    }

    // Update current breakpoint
    this.currentBreakpointName = name;

    // Trigger callback
    this.onBreakpointChange(name, config, oldName);

    this.log(`Switched to breakpoint: ${name} (${config.columns} columns)`);

    return true;
  }

  /**
   * Check viewport and switch breakpoint if needed
   */
  private checkAndSwitch(): void {
    const current = this.getCurrentBreakpoint();
    if (!current) {
      this.log('No breakpoint matched', 'warn');
      return;
    }

    this.switchToBreakpoint(current.name);
  }

  /**
   * Handle window resize with debouncing
   */
  private handleResize = (): void => {
    // Clear previous timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // Debounce resize events
    this.resizeTimeout = window.setTimeout(() => {
      this.checkAndSwitch();
    }, this.RESIZE_DEBOUNCE);
  };

  /**
   * Start listening to window resize
   */
  public startListening(): void {
    if (this.resizeHandler) {
      this.log('Already listening to resize events', 'warn');
      return;
    }

    this.resizeHandler = this.handleResize;
    window.addEventListener('resize', this.resizeHandler);

    // Initial check
    this.checkAndSwitch();

    this.log('Started listening to window resize');
  }

  /**
   * Stop listening to window resize
   */
  public stopListening(): void {
    if (!this.resizeHandler) return;

    window.removeEventListener('resize', this.resizeHandler);
    this.resizeHandler = null;

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    this.log('Stopped listening to window resize');
  }

  /**
   * Get all breakpoint names
   */
  public getBreakpointNames(): string[] {
    return Object.keys(this.breakpoints);
  }

  /**
   * Get breakpoint configuration
   */
  public getBreakpointConfig(name: string): BreakpointConfig | null {
    return this.breakpoints[name] || null;
  }

  /**
   * Get current breakpoint name
   */
  public getCurrentBreakpointName(): string | null {
    return this.currentBreakpointName;
  }

  /**
   * Check if a breakpoint exists
   */
  public hasBreakpoint(name: string): boolean {
    return name in this.breakpoints;
  }

  /**
   * Update breakpoint configuration
   */
  public updateBreakpoint(name: string, config: Partial<BreakpointConfig>): boolean {
    if (!this.breakpoints[name]) {
      this.log(`Breakpoint not found: ${name}`, 'warn');
      return false;
    }

    this.breakpoints[name] = { ...this.breakpoints[name], ...config };
    this.sortBreakpoints();

    this.log(`Updated breakpoint: ${name}`);

    return true;
  }

  /**
   * Destroy breakpoint manager
   */
  public destroy(): void {
    this.stopListening();
    this.currentBreakpointName = null;
    this.log('Destroyed');
  }

  /**
   * Debug logging
   */
  private log(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
    if (this.debug) {
      console[level](`[BreakpointManager] ${message}`);
    }
  }
}
