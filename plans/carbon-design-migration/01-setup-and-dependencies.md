# Phase 1: Setup and Dependencies

## Overview
Install and configure IBM Carbon Design System packages for the React application.

## Prerequisites
- Node.js and npm installed
- Existing React application running
- Git for version control

## Installation Steps

### 1. Install Core Carbon Packages

```bash
cd booking_system_frontend
npm install @carbon/react
```

This single package includes:
- Carbon components
- Carbon styles (SCSS)
- Carbon icons
- Carbon themes

### 2. Install Additional Dependencies (if needed)

```bash
# For custom SCSS compilation
npm install --save-dev sass

# Carbon icons (already included in @carbon/react, but can be installed separately)
# npm install @carbon/icons-react
```

### 3. Remove Conflicting Dependencies

After Carbon is working, consider removing:
```bash
# These can be removed after migration is complete
npm uninstall lucide-react
# Keep framer-motion initially for gradual transition
```

## Configuration Changes

### 1. Update `vite.config.ts`

Ensure Vite can handle SCSS files:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ['node_modules']
      }
    }
  }
});
```

### 2. Create Carbon SCSS Entry Point

Create `src/carbon-theme.scss`:

```scss
// Import Carbon styles
@use '@carbon/react';

// Or import specific components
// @use '@carbon/react/scss/components/button';
// @use '@carbon/react/scss/components/modal';
```

### 3. Update Main Entry Point

Modify `src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Import Carbon styles BEFORE custom styles
import './carbon-theme.scss';
import './index.css'; // Keep for any custom overrides

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

## Package.json Updates

Expected additions to `package.json`:

```json
{
  "dependencies": {
    "@carbon/react": "^1.x.x",
    // ... existing dependencies
  },
  "devDependencies": {
    "sass": "^1.x.x",
    // ... existing devDependencies
  }
}
```

## Verification Steps

### 1. Test Installation

Create a test component to verify Carbon is working:

```typescript
// src/components/CarbonTest.tsx
import { Button } from '@carbon/react';

export const CarbonTest = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <Button>Test Carbon Button</Button>
    </div>
  );
};
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Check for Errors

- No console errors related to Carbon imports
- Carbon styles are loading
- Test button renders correctly

## Troubleshooting

### Issue: SCSS compilation errors

**Solution**: Ensure `sass` is installed as a dev dependency:
```bash
npm install --save-dev sass
```

### Issue: Module not found errors

**Solution**: Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Styles not applying

**Solution**: Check import order in `main.tsx` - Carbon styles must come before custom styles.

### Issue: TypeScript errors

**Solution**: Ensure TypeScript can find Carbon types:
```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["vite/client", "node"]
  }
}
```

## File Structure After Setup

```
booking_system_frontend/
├── src/
│   ├── carbon-theme.scss          # NEW: Carbon styles entry
│   ├── main.tsx                   # MODIFIED: Import Carbon styles
│   ├── index.css                  # KEEP: Custom overrides
│   └── components/
│       └── CarbonTest.tsx         # NEW: Test component
├── package.json                   # MODIFIED: New dependencies
├── vite.config.ts                 # MODIFIED: SCSS support
└── node_modules/
    └── @carbon/                   # NEW: Carbon packages
```

## Next Steps

After successful setup:
1. Proceed to Phase 2: Theme Configuration
2. Keep existing components working during migration
3. Test Carbon components alongside existing ones
4. Plan gradual component replacement

## Rollback Plan

If issues arise:
1. Remove Carbon packages: `npm uninstall @carbon/react`
2. Revert changes to `main.tsx` and `vite.config.ts`
3. Remove `carbon-theme.scss`
4. Run `npm install` to restore previous state

## Estimated Time

- Installation: 15 minutes
- Configuration: 30 minutes
- Testing: 15 minutes
- **Total**: ~1 hour

---

**Status**: Ready for implementation  
**Dependencies**: None  
**Blocks**: Phase 2 (Theme Configuration)