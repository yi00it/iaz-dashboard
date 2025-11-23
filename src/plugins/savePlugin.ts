/**
 * Save Plugin - Automatic localStorage persistence
 *
 * This plugin automatically saves and loads the dashboard state to/from localStorage.
 * It listens to layout changes and persists the state whenever the layout changes.
 *
 * Usage:
 *   import { savePlugin } from 'iazd-dashboard';
 *
 *   const dashboard = new IAZDashboard('#container', {
 *     columns: 12,
 *     rowHeight: 60,
 *     storageKey: 'my-dashboard-layout'
 *   }).use(savePlugin);
 */

import type { IAZDPlugin } from '../types';

export interface SavePluginOptions {
  /**
   * localStorage key to use for saving state
   * Default: 'iazd-state'
   */
  storageKey?: string;

  /**
   * Debounce delay in milliseconds before saving
   * Default: 500ms
   */
  debounce?: number;

  /**
   * Whether to automatically load state on initialization
   * Default: true
   */
  autoLoad?: boolean;

  /**
   * Whether to automatically save on layout changes
   * Default: true
   */
  autoSave?: boolean;
}

/**
 * Create a save plugin with custom options
 */
export function createSavePlugin(options: SavePluginOptions = {}): IAZDPlugin {
  const {
    storageKey = options.storageKey || 'iazd-state',
    debounce = 500,
    autoLoad = true,
    autoSave = true,
  } = options;

  let saveTimeout: number | null = null;

  return (ctx) => {
    // Helper to save state to localStorage
    const saveState = () => {
      try {
        const state = ctx.getState();
        localStorage.setItem(storageKey, JSON.stringify(state));
        ctx.emit('save:success', { storageKey, state });
      } catch (error) {
        console.error('[SavePlugin] Failed to save state:', error);
        ctx.emit('save:error', { error, storageKey });
      }
    };

    // Debounced save function
    const debouncedSave = () => {
      if (saveTimeout !== null) {
        clearTimeout(saveTimeout);
      }
      saveTimeout = window.setTimeout(() => {
        saveState();
        saveTimeout = null;
      }, debounce);
    };

    // Helper to load state from localStorage
    const loadState = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const state = JSON.parse(saved);
          ctx.setState(state, { silent: true });
          ctx.emit('load:success', { storageKey, state });
          return true;
        }
        return false;
      } catch (error) {
        console.error('[SavePlugin] Failed to load state:', error);
        ctx.emit('load:error', { error, storageKey });
        return false;
      }
    };

    // Helper to clear saved state
    const clearState = () => {
      try {
        localStorage.removeItem(storageKey);
        ctx.emit('clear:success', { storageKey });
      } catch (error) {
        console.error('[SavePlugin] Failed to clear state:', error);
        ctx.emit('clear:error', { error, storageKey });
      }
    };

    // Auto-load state on initialization
    if (autoLoad) {
      const loaded = loadState();
      if (loaded) {
        // Refresh the dashboard to render loaded state
        ctx.dashboard.refresh();
      }
    }

    // Auto-save on layout changes
    if (autoSave) {
      ctx.on('layout:change', debouncedSave);
      ctx.on('widget:add', debouncedSave);
      ctx.on('widget:remove', debouncedSave);
    }

    // Add helper methods to dashboard instance
    if (ctx.dashboard) {
      ctx.dashboard.saveState = saveState;
      ctx.dashboard.loadState = loadState;
      ctx.dashboard.clearSavedState = clearState;
    }

    // Emit plugin ready event
    ctx.emit('plugin:save:ready', { storageKey, autoLoad, autoSave });
  };
}

/**
 * Default save plugin - uses storageKey from options or default 'iazd-state'
 */
export const savePlugin: IAZDPlugin = (ctx) => {
  const storageKey = ctx.options.storageKey || 'iazd-state';
  const plugin = createSavePlugin({ storageKey });
  plugin(ctx);
};
