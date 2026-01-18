# Testing Best Practices: Using `globalThis` in Tests

## Overview

This document explains best practices for using `globalThis` in test environments and how we maintain type safety and code quality in our test suite.

## Why `globalThis`?

### ✅ Best Practice: Use `globalThis`

`globalThis` is the **standard JavaScript way** to access the global object across all environments:

- **Browser**: `window === globalThis`
- **Node.js**: `global === globalThis`  
- **Web Workers**: `self === globalThis`
- **Universal**: Works everywhere

### ❌ Avoid: Environment-Specific Globals

- `global` - Node.js only, not standard
- `window` - Browser only
- `self` - Web Workers only

## Our Implementation

### 1. Type Declarations (`global.d.ts`)

We centralize all global type declarations in `__tests__/global.d.ts`:

```typescript
// Define the shape of our mocked Chrome API
export interface MockChrome {
  storage: { /* ... */ };
  tabs: { /* ... */ };
  // ... etc
}

// Extend globalThis with our test mocks
declare global {
  var chrome: any; // MockChrome in test environment
  var fetch: typeof globalThis.fetch;
}
```

**Benefits:**
- Single source of truth for test types
- Type safety across all test files
- Easy to maintain and update

### 2. Centralized Setup (`setup.ts`)

All global mocks are initialized in `__tests__/setup.ts`:

```typescript
// Create mock
const mockChrome: MockChrome = { /* ... */ };

// Set up global chrome mock
(globalThis as any).chrome = mockChrome;

// Export helper for type-safe access
export const chrome = () => (globalThis as any).chrome as MockChrome;
```

**Benefits:**
- All mocks in one place
- Consistent initialization
- Reusable helper functions

### 3. Type-Safe Access in Tests

Instead of using `(globalThis as any).chrome` everywhere, we use a helper:

```typescript
// ❌ Bad: Type assertions scattered everywhere
(globalThis as any).chrome.storage.local.get.mockResolvedValue(data);

// ✅ Good: Use helper function
import { chrome } from './setup';
chrome().storage.local.get.mockResolvedValue(data);
```

**Benefits:**
- Cleaner code
- Better type safety
- Easier refactoring
- Consistent pattern

## Best Practices Summary

### ✅ DO

1. **Use `globalThis`** for cross-environment compatibility
2. **Centralize type declarations** in `.d.ts` files
3. **Initialize mocks in setup files** (Vitest's `setupFiles`)
4. **Export helper functions** for type-safe access
5. **Document why** you're using type assertions
6. **Keep mocks consistent** across test files

### ❌ DON'T

1. **Don't use `global`** - it's Node.js-specific
2. **Don't scatter type assertions** - use helpers instead
3. **Don't redeclare variables** - use helper functions
4. **Don't ignore TypeScript errors** without understanding why
5. **Don't mix real and mock types** - be explicit

## Type Safety Strategy

### The Challenge

TypeScript sees the **real** Chrome API types from `@types/chrome`, but in tests we're using **mocked** versions. This creates a type conflict.

### Our Solution

1. **Type Declaration File**: Define `MockChrome` interface matching our mock structure
2. **Helper Function**: Export `chrome()` helper that returns properly typed mock
3. **Type Assertions**: Use `as any` only in setup, not in tests
4. **Documentation**: Comment why assertions are needed

### Example Pattern

```typescript
// setup.ts - Initialize once
(globalThis as any).chrome = mockChrome;
export const chrome = () => (globalThis as any).chrome as MockChrome;

// test.ts - Use helper everywhere
import { chrome } from './setup';
chrome().storage.local.get.mockResolvedValue(data); // ✅ Type-safe!
```

## Maintaining Standards

### Code Review Checklist

- [ ] Are all global mocks in `setup.ts`?
- [ ] Are type declarations in `global.d.ts`?
- [ ] Are tests using the `chrome()` helper?
- [ ] Are there any scattered `(globalThis as any)` calls?
- [ ] Are type assertions documented?

### Refactoring Guidelines

1. **Adding new mocks**: Update `MockChrome` interface in `global.d.ts`
2. **Changing mock structure**: Update both `setup.ts` and `global.d.ts`
3. **Accessing mocks**: Always use helper functions, never direct `globalThis` access

## Alternative Approaches

### Option 1: Module Mocking (Current)
```typescript
// Mock at module level
vi.mock('../src/utils', () => ({ /* ... */ }));
```

### Option 2: Dependency Injection
```typescript
// Pass dependencies as parameters
function myFunction(chrome: ChromeAPI) { /* ... */ }
```

### Option 3: Test Utilities
```typescript
// Create test-specific utilities
export const testHelpers = {
  getChrome: () => globalThis.chrome as MockChrome,
  // ...
};
```

**We use Option 1** because:
- Chrome Extension APIs are inherently global
- Module mocking works well with Vitest
- Less boilerplate than dependency injection
- Aligns with how extensions actually work

## Resources

- [MDN: globalThis](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis)
- [TypeScript: Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [Vitest: Setup Files](https://vitest.dev/config/#setupfiles)
