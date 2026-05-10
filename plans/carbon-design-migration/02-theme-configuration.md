# Phase 2: Theme Configuration

## Overview
Configure Carbon Design System themes to create a cohesive design that maintains the space travel aesthetic while following Carbon design principles.

## Carbon Theme System

Carbon provides four built-in themes:
- **White** (default light theme)
- **Gray 10** (light theme with subtle gray background)
- **Gray 90** (dark theme)
- **Gray 100** (darkest theme)

For Galaxium Travels, we'll use **Gray 100** as the base and customize it.

## Theme Configuration Strategy

### 1. Base Theme Selection

Use Carbon's Gray 100 theme as the foundation:

```scss
// src/carbon-theme.scss
@use '@carbon/react' with (
  $theme: 'g100'
);
```

### 2. Custom Token Overrides

Create custom theme tokens to maintain space aesthetic:

```scss
// src/carbon-theme.scss
@use '@carbon/react/scss/theme' with (
  $theme: (
    // Background colors
    background: #030712,           // space-dark
    background-hover: #0A1929,     // space-blue
    
    // Interactive colors
    interactive: #6366F1,          // cosmic-purple
    interactive-hover: #7C3AED,
    
    // Focus colors
    focus: #6366F1,
    
    // Border colors
    border-subtle: rgba(255, 255, 255, 0.1),
    border-strong: rgba(255, 255, 255, 0.2),
    
    // Text colors
    text-primary: #F9FAFB,         // star-white
    text-secondary: rgba(249, 250, 251, 0.7),
    text-on-color: #FFFFFF,
    
    // Layer colors (for cards, modals)
    layer-01: rgba(255, 255, 255, 0.05),
    layer-02: rgba(255, 255, 255, 0.08),
    layer-03: rgba(255, 255, 255, 0.12),
    
    // Support colors
    support-error: #EF4444,
    support-success: #10B981,      // alien-green
    support-warning: #F59E0B,      // solar-orange
    support-info: #6366F1,
  )
);

@use '@carbon/react';
```

### 3. Custom CSS Variables

Add custom variables for space-specific styling:

```scss
// src/carbon-theme.scss (continued)

:root {
  // Custom space theme colors
  --space-dark: #030712;
  --space-blue: #0A1929;
  --cosmic-purple: #6366F1;
  --nebula-pink: #EC4899;
  --alien-green: #10B981;
  --solar-orange: #F59E0B;
  --star-white: #F9FAFB;
  
  // Custom gradients
  --cosmic-gradient: linear-gradient(135deg, #6366F1, #EC4899);
  --space-gradient: linear-gradient(to bottom, #030712, #0A1929);
  
  // Custom effects
  --glass-effect: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
}
```

### 4. Component-Specific Overrides

Override specific Carbon component styles:

```scss
// src/carbon-overrides.scss

// Button customizations
.cds--btn--primary {
  background: var(--cosmic-gradient);
  border: none;
  
  &:hover {
    background: linear-gradient(135deg, #7C3AED, #F472B6);
    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.5);
  }
}

// Card/Tile customizations
.cds--tile {
  background: var(--glass-effect);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

// Modal customizations
.cds--modal {
  .cds--modal-container {
    background: var(--glass-effect);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
  }
}

// Input field customizations
.cds--text-input,
.cds--select-input {
  background: var(--glass-effect);
  border-color: var(--glass-border);
  color: var(--star-white);
  
  &:focus {
    outline: 2px solid var(--cosmic-purple);
    outline-offset: 2px;
  }
}

// Header/UI Shell customizations
.cds--header {
  background: var(--glass-effect);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--glass-border);
}
```

## File Structure

```scss
// src/carbon-theme.scss
@use '@carbon/react/scss/theme' with (
  $theme: ( /* custom tokens */ )
);
@use '@carbon/react';

// Import custom overrides
@import './carbon-overrides.scss';
```

```scss
// src/carbon-overrides.scss
// Component-specific style overrides
```

```css
// src/index.css
/* Keep for global styles and utilities */
@import './carbon-theme.scss';

/* Custom animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: var(--space-blue);
}

::-webkit-scrollbar-thumb {
  background: var(--cosmic-purple);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--nebula-pink);
}
```

## Theme Switching (Optional)

If you want to support light/dark mode switching:

```typescript
// src/hooks/useTheme.tsx
import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-carbon-theme', 
      theme === 'dark' ? 'g100' : 'white'
    );
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  
  return { theme, toggleTheme };
};
```

## Color Palette Mapping

| Current Custom Color | Carbon Token | Custom Override |
|---------------------|--------------|-----------------|
| space-dark (#030712) | background | Yes |
| space-blue (#0A1929) | background-hover | Yes |
| cosmic-purple (#6366F1) | interactive | Yes |
| nebula-pink (#EC4899) | - | CSS variable |
| alien-green (#10B981) | support-success | Yes |
| solar-orange (#F59E0B) | support-warning | Yes |
| star-white (#F9FAFB) | text-primary | Yes |

## Typography Configuration

Carbon includes IBM Plex fonts. Configure typography:

```scss
// src/carbon-theme.scss
@use '@carbon/react/scss/type' as *;

// Use Carbon's type scale
body {
  @include type-style('body-01');
}

h1 {
  @include type-style('heading-05');
}

h2 {
  @include type-style('heading-04');
}

h3 {
  @include type-style('heading-03');
}
```

## Spacing and Layout

Use Carbon's spacing tokens:

```scss
// Instead of custom padding values, use Carbon tokens
.custom-component {
  padding: $spacing-05; // 1rem
  margin: $spacing-06;  // 1.5rem
  gap: $spacing-04;     // 0.75rem
}
```

## Testing Theme Configuration

### Visual Checks
1. Background colors match space theme
2. Interactive elements use cosmic-purple
3. Text is readable (contrast ratio ≥ 4.5:1)
4. Hover states are visible
5. Focus indicators are clear

### Accessibility Checks
```bash
# Use axe DevTools or similar
npm install --save-dev @axe-core/react
```

### Browser Testing
- Chrome/Edge
- Firefox
- Safari
- Mobile browsers

## Common Issues and Solutions

### Issue: Colors not applying

**Solution**: Check import order - theme configuration must come before component imports:
```scss
// Correct order
@use '@carbon/react/scss/theme' with ($theme: (...));
@use '@carbon/react';
```

### Issue: Custom variables not working

**Solution**: Ensure CSS variables are defined in `:root` and imported after Carbon styles.

### Issue: Contrast issues

**Solution**: Use Carbon's color contrast checker or adjust custom colors:
```scss
// Ensure sufficient contrast
$text-on-dark: #FFFFFF;  // 21:1 contrast on #030712
$text-secondary: rgba(255, 255, 255, 0.7);  // 10:1 contrast
```

## Performance Considerations

### Optimize SCSS Compilation
```scss
// Import only needed components
@use '@carbon/react/scss/components/button';
@use '@carbon/react/scss/components/modal';
// etc.
```

### CSS Bundle Size
- Full Carbon CSS: ~200KB (gzipped)
- Selective imports: ~50-100KB (gzipped)
- Custom overrides: ~10-20KB

## Next Steps

After theme configuration:
1. Test theme in isolation with sample components
2. Document any custom color usage
3. Proceed to Phase 3: Component Migration
4. Update style guide documentation

## Estimated Time

- Theme configuration: 2 hours
- Custom overrides: 2 hours
- Testing and refinement: 1 hour
- **Total**: ~5 hours

---

**Status**: Ready for implementation  
**Dependencies**: Phase 1 (Setup and Dependencies)  
**Blocks**: Phase 3 (Component Migration)