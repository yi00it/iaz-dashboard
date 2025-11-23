# Testing Guide

This document describes the testing infrastructure and practices for IAZ Dashboard.

## Overview

IAZ Dashboard uses **Vitest** as its testing framework, providing fast unit and integration tests with excellent TypeScript support.

### Test Coverage

- **176+ Tests** covering all major components
- **Target: 80%+ coverage** for lines, functions, branches, and statements
- **Core Components**: GridEngine, DragEngine, ResizeEngine, BreakpointManager
- **Integration Tests**: Full Dashboard API and lifecycle
- **Plugin Tests**: Save, Constraints, and Snaplines plugins

## Running Tests

### All Tests

```bash
npm test                # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:ui         # Run tests with UI dashboard
npm run test:coverage   # Run tests with coverage report
```

### Specific Test Files

```bash
npm test GridEngine     # Run only GridEngine tests
npm test Dashboard      # Run only Dashboard tests
```

### Coverage Reports

After running `npm run test:coverage`, coverage reports are available in:

- **Terminal**: Summary displayed in console
- **HTML**: `./coverage/index.html` (interactive report)
- **LCOV**: `./coverage/lcov.info` (for CI/CD integrations)

## Test Structure

### Directory Layout

```
tests/
├── setup.js                    # Global test setup
├── GridEngine.test.js          # Grid collision & layout tests
├── DragEngine.test.ts          # Drag & drop tests
├── ResizeEngine.test.ts        # Resize handle tests
├── BreakpointManager.test.ts   # Responsive breakpoint tests
├── Dashboard.test.ts           # Integration tests
└── Plugins.test.ts             # Plugin system tests
```

### Test Categories

#### 1. Unit Tests (GridEngine, DragEngine, ResizeEngine)

Test individual components in isolation:

```typescript
describe('GridEngine', () => {
  describe('checkCollision', () => {
    it('should detect collision when widgets overlap', () => {
      const w1 = { x: 0, y: 0, w: 4, h: 3 };
      const w2 = { x: 2, y: 1, w: 4, h: 3 };
      expect(GridEngine.checkCollision(w1, w2)).toBe(true);
    });
  });
});
```

#### 2. Integration Tests (Dashboard)

Test the complete Dashboard API:

```typescript
describe('Dashboard', () => {
  it('should add and remove widgets', () => {
    const dashboard = new Dashboard(container);
    dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3 });
    expect(dashboard.getState().widgets).toHaveLength(1);

    dashboard.removeWidget('1');
    expect(dashboard.getState().widgets).toHaveLength(0);
  });
});
```

#### 3. Plugin Tests

Test plugin functionality and integration:

```typescript
describe('SavePlugin', () => {
  it('should auto-save to localStorage', async () => {
    dashboard.use(createSavePlugin({ storageKey: 'test', debounce: 50 }));
    dashboard.addWidget({ id: '1', x: 0, y: 0, w: 4, h: 3 });

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(localStorage.getItem('test')).toBeTruthy();
  });
});
```

## Test Setup

### Global Setup (`tests/setup.js`)

The setup file provides:

- **PointerEvent polyfill** for drag/resize tests
- **ResizeObserver mock** for responsive tests
- **DOM APIs** for jsdom compatibility

### Environment

- **Environment**: jsdom (simulated browser)
- **Globals**: Vitest globals enabled (`describe`, `it`, `expect`)
- **TypeScript**: Full TS support via Vite

## Writing New Tests

### Best Practices

1. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should do something', () => {
     // Arrange: Set up test data
     const widget = { id: '1', x: 0, y: 0, w: 4, h: 3 };

     // Act: Perform the action
     const result = GridEngine.moveWidget('1', 4, 2, [widget], 12);

     // Assert: Verify the outcome
     expect(result[0].x).toBe(4);
   });
   ```

2. **Use beforeEach for Setup**
   ```typescript
   describe('Component', () => {
     let component;

     beforeEach(() => {
       component = new Component();
     });

     it('should work', () => {
       // Test using component
     });
   });
   ```

3. **Test Edge Cases**
   - Null/undefined inputs
   - Empty arrays
   - Boundary conditions
   - Error scenarios

4. **Mock External Dependencies**
   ```typescript
   const mockEmit = vi.fn();
   const engine = new DragEngine(getState, setState, mockEmit, ...);

   // Verify mock was called
   expect(mockEmit).toHaveBeenCalledWith('drag:start', expect.any(Object));
   ```

### Example Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MyComponent } from '../src/MyComponent';

describe('MyComponent', () => {
  let component: MyComponent;

  beforeEach(() => {
    // Setup runs before each test
    component = new MyComponent();
  });

  describe('myMethod', () => {
    it('should handle normal case', () => {
      const result = component.myMethod('input');
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      const result = component.myMethod(null);
      expect(result).toBeNull();
    });

    it('should throw on invalid input', () => {
      expect(() => component.myMethod(-1)).toThrow();
    });
  });
});
```

## Continuous Integration

Tests run automatically on:

- **Push to main/develop branches**
- **Pull requests**

### CI Workflow

1. Run type checking (`npm run typecheck`)
2. Run all tests (`npm run test:run`)
3. Generate coverage report
4. Upload coverage to Codecov (optional)
5. Build project (`npm run build`)

See `.github/workflows/ci.yml` for configuration.

## Coverage Goals

### Current Coverage

Run `npm run test:coverage` to see current coverage metrics.

### Target Coverage (v1.0)

- **Lines**: ≥ 80%
- **Functions**: ≥ 80%
- **Branches**: ≥ 80%
- **Statements**: ≥ 80%

### Coverage by Component

| Component | Status |
|-----------|--------|
| GridEngine | ✅ High coverage (95%+) |
| DragEngine | ✅ High coverage (90%+) |
| ResizeEngine | ✅ High coverage (90%+) |
| BreakpointManager | ✅ High coverage (85%+) |
| Dashboard | ⚠️ Good coverage (75%+) |
| Plugins | ⚠️ Good coverage (70%+) |

## Debugging Tests

### VS Code Debugging

1. Set breakpoints in test files
2. Open VS Code debugger
3. Select "Debug Current Test File"
4. Step through code

### Console Logging

```typescript
it('should debug something', () => {
  const result = myFunction();
  console.log('Result:', result);  // Visible in test output
  expect(result).toBe(expected);
});
```

### Test UI

For visual debugging:

```bash
npm run test:ui
```

Opens an interactive UI at `http://localhost:51204/` showing:
- Test file tree
- Test results
- Console output
- Source code

## Common Issues

### 1. Timeout Errors

If tests timeout, increase the timeout:

```typescript
it('should handle long operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

### 2. DOM Not Available

Ensure jsdom environment is configured in `vitest.config.js`:

```javascript
export default defineConfig({
  test: {
    environment: 'jsdom',
  },
});
```

### 3. Module Import Errors

Check that imports use correct paths and file extensions for TypeScript.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest Expect API](https://jestjs.io/docs/expect) (Vitest uses same API)

## Contributing

When adding new features:

1. Write tests **before** implementation (TDD)
2. Aim for ≥80% coverage for new code
3. Test both happy path and error cases
4. Update this document if adding new test categories
