# TypeScript Typing Guide

This document explains our typing strategy and where `any` is used (and why).

## Typing Philosophy

We follow these principles:
1. **Avoid `any` in production code** - Use proper types or `unknown` with type guards
2. **Minimize `any` in tests** - Use proper types where possible, document when `any` is necessary
3. **Use type guards** - Validate data at runtime with proper type narrowing
4. **Prefer type assertions over `any`** - When we know the type but TypeScript doesn't

## Where `any` is Used (And Why)

### 1. Test Mocks (`__tests__/global.d.ts`)

**Location**: Mock function type parameters

**Why**: Vitest's `MockedFunction` uses `any` as its default type parameter. We use it here because:
- Chrome Extension APIs have complex, overloaded signatures
- Test mocks need flexibility to accept partial objects
- The actual runtime behavior is validated by tests

**Example**:
```typescript
get: MockedFunction<any>; // Accepts any Chrome API signature
```

**Best Practice**: This is acceptable because:
- It's isolated to test code
- The mock behavior is validated by tests
- We use type guards in production code

### 2. Global Chrome Mock (`__tests__/setup.ts`)

**Location**: `(globalThis as any).chrome = mockChrome`

**Why**: We're replacing the real Chrome API types with our mock types. TypeScript sees the real types from `@types/chrome`, but we're using mocks.

**Best Practice**: 
- Use helper functions (`chrome()`) for type-safe access
- Document why the assertion is needed
- Keep mocks consistent with real API structure

### 3. Mocked Functions in Tests (`__tests__/background.test.ts`)

**Location**: `(getStorageData as any).mockResolvedValue(...)`

**Why**: When mocking modules, the mocked functions don't have the same type signature as the real functions.

**Best Practice**: 
- Use `vi.fn()` with proper type parameters when possible
- Document why type assertion is needed
- Consider using `vi.mocked()` helper from Vitest

## Type Safety Improvements Made

### 1. Storage Data Type Guards (`src/utils.ts`)

**Before**:
```typescript
trackedSites: result.trackedSites || {},
```

**After**:
```typescript
trackedSites: isTrackedSites(result.trackedSites) ? result.trackedSites : {},
```

**Benefit**: Runtime validation ensures data integrity

### 2. Runtime State Helper (`src/background.ts`)

**Before**:
```typescript
const sessionData = await chrome.storage.session.get(['currentDomain', 'startTime']) as RuntimeState;
```

**After**:
```typescript
const sessionData = await getRuntimeState();
```

**Benefit**: 
- Centralized type conversion logic
- Proper null handling
- Reusable across functions

### 3. Mock Storage Data Helper (`__tests__/setup.ts`)

**Before**:
```typescript
export function createMockStorageData(overrides = {}) {
```

**After**:
```typescript
export function createMockStorageData(overrides: Partial<StorageData> = {}): StorageData {
```

**Benefit**: Type-safe test data creation

### 4. Reset Mocks Helper (`__tests__/setup.ts`)

**Before**:
```typescript
Object.values(mockChrome.storage.local).forEach((fn: any) => {
```

**After**:
```typescript
function isMockFunction(fn: unknown): fn is { mockClear: () => void } {
  return typeof fn === 'function' && 'mockClear' in fn;
}
Object.values(mockChrome.storage.local).forEach((fn) => {
  if (isMockFunction(fn)) {
    fn.mockClear();
  }
});
```

**Benefit**: Type-safe mock clearing with runtime validation

## Type Guard Pattern

We use type guards extensively for runtime type validation:

```typescript
function isTrackedSites(value: unknown): value is TrackedSites {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => typeof v === 'number')
  );
}
```

**Benefits**:
- Runtime safety
- Type narrowing in TypeScript
- Clear validation logic
- Reusable across codebase

## Best Practices

### ✅ DO

1. **Use type guards** for runtime validation
2. **Create helper functions** for type conversions
3. **Document `any` usage** with comments explaining why
4. **Use `unknown` instead of `any`** when the type is truly unknown
5. **Prefer type assertions** (`as Type`) over `any` when you know the type
6. **Centralize type declarations** in `.d.ts` files

### ❌ DON'T

1. **Don't use `any` in production code** without a good reason
2. **Don't ignore TypeScript errors** with `@ts-ignore` without understanding why
3. **Don't use type assertions** without validation when data comes from external sources
4. **Don't mix `any` and proper types** - be consistent

## Future Improvements

1. **Consider using `vi.mocked()`** from Vitest for better mock typing
2. **Add runtime validation** for all Chrome API responses
3. **Create type-safe wrappers** for Chrome APIs
4. **Use branded types** for domain-specific values (e.g., `Domain`, `Minutes`)

## Resources

- [TypeScript Handbook: Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [TypeScript Handbook: Type Assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)
- [Vitest: Mocking](https://vitest.dev/guide/mocking.html)
