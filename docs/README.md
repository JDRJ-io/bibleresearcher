# Architecture Documentation

This directory contains comprehensive documentation for the React Anchor-based Architecture used in the Anointed.io Bible study platform.

## Files Overview

### 📋 [architecture.md](./architecture.md)
The complete architectural specification including:
- **Mermaid flow diagrams** showing data flow from user scroll to Supabase
- **File responsibility matrix** mapping each component to its purpose
- **Performance benchmarks** for 10,000 concurrent users
- **State management patterns** using Zustand
- **Testing strategies** with Jest and Cypress guardrails

### 🔧 Validation Scripts
- **`scripts/lint-architecture.js`** - AST-based validation for facade pattern compliance
- **`scripts/validate-architecture.sh`** - Comprehensive CI pipeline validation
- **`.eslintrc.js`** - ESLint rules enforcing architectural boundaries

## Key Architectural Principles

### 1. **Facade Pattern Enforcement**
```typescript
// ✅ CORRECT - Via facade
import { loadTranslation } from '@/data/BibleDataAPI';
const translation = await loadTranslation('KJV');

// ❌ INCORRECT - Direct access
import { supabase } from '@/lib/supabase';
const { data } = await supabase.storage.from('translations').download('KJV.txt');
```

### 2. **React-Only DOM Access**
```typescript
// ✅ CORRECT - Via custom hook
const useBodyClass = (className: string) => {
  useEffect(() => {
    document.body.classList.add(className);
    return () => document.body.classList.remove(className);
  }, [className]);
};

// ❌ INCORRECT - Direct DOM manipulation
document.body.classList.add('dark-theme');
```

### 3. **Anchor-Centered Loading**
```typescript
// ✅ CORRECT - Center-anchored slice
const { anchorIndex, slice } = useAnchorSlice();
const verses = loadChunk(anchorIndex, 100); // ±100 verses around center

// ❌ INCORRECT - Edge-based loading
const verses = loadMore(lastIndex, 100); // Loads from edge
```

## Running Architecture Validation

### Quick Validation
```bash
# Run all architectural checks
./scripts/validate-architecture.sh
```

### Individual Checks
```bash
# ESLint rules
npx eslint client/src --quiet

# Custom architecture validation
node scripts/lint-architecture.js

# Jest tests
npx jest client/src/__tests__/noRawFetch.test.ts

# TypeScript compilation
npx tsc --noEmit
```

## CI Integration

For continuous integration, add this to your CI pipeline:

```yaml
# .github/workflows/architecture.yml
name: Architecture Validation
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: ./scripts/validate-architecture.sh
```

## Contributing Guidelines

### Before Creating PRs
1. **Run validation**: `./scripts/validate-architecture.sh`
2. **Document changes**: Update `architecture.md` if adding new layers
3. **Mention layers**: Include which architectural layers your PR touches

### Common Violations
- **Direct Supabase imports** outside `BibleDataAPI.ts`
- **Raw fetch calls** outside facade files
- **DOM manipulation** outside guard hooks
- **Missing anchor preservation** in mutation callbacks

### Architecture Layers
When contributing, identify which layer(s) your changes affect:
- **Providers** - State management (Zustand)
- **Core hooks** - Viewport math and data slicing
- **Guard hooks** - DOM interactions
- **Facade** - Data access abstraction
- **Workers** - Background processing
- **UI components** - Pure React components
- **Integration tests** - Architectural guardrails

## Performance Targets

### Current Metrics (99% Foundation Complete)
- ✅ **Memory**: ~200MB for 31,102 verses
- ✅ **Network**: ≤20 requests per 5-second scroll
- ✅ **Bundle**: <2MB gzipped
- ✅ **Scroll**: Smooth Genesis 1 → Revelation 22

### Production Targets (10,000 Users)
- 🎯 **Response Time**: <100ms verse navigation
- 🎯 **Concurrent Users**: 10,000 simultaneous
- 🎯 **Database Queries**: <50ms average
- 🎯 **CDN Cache Hit**: >95%

## Getting Help

### Architecture Questions
1. Review the [architecture.md](./architecture.md) specification
2. Check existing components for patterns
3. Run validation scripts to identify issues
4. Refer to the responsibility matrix for file purposes

### Debugging Architecture Issues
1. **ESLint errors**: Check `.eslintrc.js` overrides
2. **Fetch violations**: Ensure all data access goes through `BibleDataAPI`
3. **DOM access**: Move to appropriate guard hooks
4. **Performance**: Verify anchor-centered loading pattern

---

**Last Updated**: July 7, 2025  
**Architecture Version**: 99% Foundation Complete  
**Target**: 10,000 Concurrent Users