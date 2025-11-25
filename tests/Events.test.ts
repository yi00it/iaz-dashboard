/**
 * Events tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from '../src/core/Events';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on', () => {
    it('should register an event handler', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.emit('test', 'arg1', 'arg2');

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should allow multiple handlers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.emit('test');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should unregister an event handler', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.off('test', handler);
      emitter.emit('test');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should only remove the specified handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.off('test', handler1);
      emitter.emit('test');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should handle removing non-existent handler', () => {
      const handler = vi.fn();
      expect(() => emitter.off('test', handler)).not.toThrow();
    });

    it('should clean up event set when last handler removed', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.off('test', handler);

      expect(emitter.listenerCount('test')).toBe(0);
    });
  });

  describe('once', () => {
    it('should only call handler once', () => {
      const handler = vi.fn();
      emitter.once('test', handler);
      emitter.emit('test');
      emitter.emit('test');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to handler', () => {
      const handler = vi.fn();
      emitter.once('test', handler);
      emitter.emit('test', 'arg1', 'arg2');

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('emit', () => {
    it('should handle emitting event with no handlers', () => {
      expect(() => emitter.emit('nonexistent')).not.toThrow();
    });

    it('should catch errors in event handlers and log them', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorHandler = () => {
        throw new Error('Handler error');
      };
      const normalHandler = vi.fn();

      emitter.on('test', errorHandler);
      emitter.on('test', normalHandler);
      emitter.emit('test');

      expect(errorSpy).toHaveBeenCalledWith(
        'Error in event handler for "test":',
        expect.any(Error)
      );
      // Other handlers should still be called
      expect(normalHandler).toHaveBeenCalled();

      errorSpy.mockRestore();
    });

    it('should pass multiple arguments to handlers', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.emit('test', 1, 2, 3, 4, 5);

      expect(handler).toHaveBeenCalledWith(1, 2, 3, 4, 5);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const otherHandler = vi.fn();

      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.on('other', otherHandler);

      emitter.removeAllListeners('test');

      emitter.emit('test');
      emitter.emit('other');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(otherHandler).toHaveBeenCalled();
    });

    it('should remove all listeners when no event specified', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('event1', handler1);
      emitter.on('event2', handler2);

      emitter.removeAllListeners();

      emitter.emit('event1');
      emitter.emit('event2');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('should return 0 for event with no listeners', () => {
      expect(emitter.listenerCount('nonexistent')).toBe(0);
    });

    it('should return correct count for event with listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.on('test', handler3);

      expect(emitter.listenerCount('test')).toBe(3);
    });

    it('should update count when listeners are removed', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      expect(emitter.listenerCount('test')).toBe(1);

      emitter.off('test', handler);
      expect(emitter.listenerCount('test')).toBe(0);
    });
  });
});
