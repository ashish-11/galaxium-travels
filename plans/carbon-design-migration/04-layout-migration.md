# Phase 4: Layout and Navigation Migration

## Overview
Migrate the application layout and navigation structure to use Carbon's UI Shell components for consistent, accessible navigation.

## Current Layout Structure

```
Layout
├── Header (custom)
│   ├── Logo/Brand
│   ├── Navigation Links
│   └── User Actions
├── Main Content Area
│   └── Page Components
└── Footer (custom)
```

## Carbon UI Shell Structure

```
HeaderContainer
├── Header
│   ├── HeaderName (Logo/Brand)
│   ├── HeaderNavigation
│   │   └── HeaderMenuItem (Links)
│   └── HeaderGlobalBar
│       └── HeaderGlobalAction (User Actions)
└── Content (with proper spacing)
```

## Implementation Plan

### 1. UI Shell Setup

**Install UI Shell Components**:
```typescript
import {
  Header,
  HeaderContainer,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  HeaderPanel,
  SkipToContent,
  SideNav,
  SideNavItems,
  SideNavLink
} from '@carbon/react';
```

### 2. Header Migration

**New Header Component**:
```typescript
// src/components/layout/CarbonHeader.tsx
import { useState } from 'react';
import {
  Header,
  HeaderContainer,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  HeaderPanel,
  SkipToContent
} from '@carbon/react';
import { User, Logout, Notification } from '@carbon/icons-react';
import { useUser } from '../../hooks/useUser';
import { useNavigate, useLocation } from 'react-router-dom';

export const AppHeader = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserPanelExpanded, setIsUserPanelExpanded] = useState(false);

  return (
    <HeaderContainer
      render={({ isSideNavExpanded, onClickSideNavExpand }) => (
        <>
          <Header aria-label="Galaxium Travels">
            <SkipToContent />
            
            {/* Brand/Logo */}
            <HeaderName href="/" prefix="">
              <span className="header-logo">
                🚀 Galaxium Travels
              </span>
            </HeaderName>

            {/* Main Navigation */}
            <HeaderNavigation aria-label="Main Navigation">
              <HeaderMenuItem
                href="/"
                isActive={location.pathname === '/'}
              >
                Home
              </HeaderMenuItem>
              <HeaderMenuItem
                href="/flights"
                isActive={location.pathname === '/flights'}
              >
                Flights
              </HeaderMenuItem>
              {user && (
                <HeaderMenuItem
                  href="/bookings"
                  isActive={location.pathname === '/bookings'}
                >
                  My Bookings
                </HeaderMenuItem>
              )}
            </HeaderNavigation>

            {/* Global Actions */}
            <HeaderGlobalBar>
              {user ? (
                <>
                  <HeaderGlobalAction
                    aria-label="User Profile"
                    tooltipAlignment="end"
                    onClick={() => setIsUserPanelExpanded(!isUserPanelExpanded)}
                  >
                    <User size={20} />
                  </HeaderGlobalAction>
                  <HeaderGlobalAction
                    aria-label="Logout"
                    tooltipAlignment="end"
                    onClick={logout}
                  >
                    <Logout size={20} />
                  </HeaderGlobalAction>
                </>
              ) : (
                <HeaderGlobalAction
                  aria-label="Login"
                  tooltipAlignment="end"
                  onClick={() => navigate('/flights')}
                >
                  <User size={20} />
                </HeaderGlobalAction>
              )}
            </HeaderGlobalBar>

            {/* User Panel */}
            {user && (
              <HeaderPanel
                aria-label="User Panel"
                expanded={isUserPanelExpanded}
              >
                <div className="user-panel">
                  <h3>Welcome, {user.name}!</h3>
                  <p>Email: {user.email}</p>
                  <p>User ID: {user.user_id}</p>
                </div>
              </HeaderPanel>
            )}
          </Header>
        </>
      )}
    />
  );
};
```

### 3. Responsive Navigation (Side Nav)

**Mobile Navigation**:
```typescript
// Add to AppHeader component
import { SideNav, SideNavItems, SideNavLink } from '@carbon/react';

// Inside HeaderContainer render function:
<SideNav
  aria-label="Side navigation"
  expanded={isSideNavExpanded}
  onOverlayClick={onClickSideNavExpand}
  href="#main-content"
>
  <SideNavItems>
    <SideNavLink href="/">Home</SideNavLink>
    <SideNavLink href="/flights">Flights</SideNavLink>
    {user && (
      <SideNavLink href="/bookings">My Bookings</SideNavLink>
    )}
  </SideNavItems>
</SideNav>
```

### 4. Content Layout

**Main Content Wrapper**:
```typescript
// src/components/layout/CarbonLayout.tsx
import { Content } from '@carbon/react';
import { AppHeader } from './CarbonHeader';
import { AppFooter } from './CarbonFooter';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="app-layout">
      <AppHeader />
      <Content id="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </Content>
      <AppFooter />
    </div>
  );
};
```

### 5. Footer Component

**Simple Footer**:
```typescript
// src/components/layout/CarbonFooter.tsx
export const AppFooter = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>&copy; 2026 Galaxium Travels. All rights reserved.</p>
        <div className="footer-links">
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/contact">Contact</a>
        </div>
      </div>
    </footer>
  );
};
```

## Styling

### Header Styles

```scss
// src/styles/header.scss
.cds--header {
  background: var(--glass-effect);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--glass-border);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 8000;
}

.header-logo {
  font-size: 1.25rem;
  font-weight: 700;
  background: var(--cosmic-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cds--header__menu-item {
  &[aria-current="page"] {
    background: rgba(99, 102, 241, 0.1);
    border-bottom: 3px solid var(--cosmic-purple);
  }
}

.cds--header__global {
  background: transparent;
}

.cds--header__action {
  &:hover {
    background: rgba(99, 102, 241, 0.1);
  }
}

// User Panel
.user-panel {
  padding: 1.5rem;
  background: var(--glass-effect);
  
  h3 {
    margin-bottom: 0.5rem;
    color: var(--star-white);
  }
  
  p {
    color: rgba(249, 250, 251, 0.7);
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }
}
```

### Content Layout Styles

```scss
// src/styles/layout.scss
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--space-gradient);
}

.cds--content {
  flex: 1;
  margin-top: 3rem; // Header height
  padding: 2rem 1rem;
  
  @media (min-width: 768px) {
    padding: 3rem 2rem;
  }
}

.content-wrapper {
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

// Footer
.app-footer {
  background: var(--glass-effect);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--glass-border);
  padding: 2rem 1rem;
  margin-top: auto;
  
  .footer-content {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    
    p {
      color: rgba(249, 250, 251, 0.7);
      margin: 0;
    }
  }
  
  .footer-links {
    display: flex;
    gap: 1.5rem;
    
    a {
      color: rgba(249, 250, 251, 0.7);
      text-decoration: none;
      transition: color 0.2s;
      
      &:hover {
        color: var(--cosmic-purple);
      }
    }
  }
}
```

### Side Navigation Styles

```scss
// src/styles/sidenav.scss
.cds--side-nav {
  background: var(--glass-effect);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--glass-border);
}

.cds--side-nav__link {
  color: var(--star-white);
  
  &:hover {
    background: rgba(99, 102, 241, 0.1);
    color: var(--cosmic-purple);
  }
  
  &[aria-current="page"] {
    background: rgba(99, 102, 241, 0.2);
    border-left: 3px solid var(--cosmic-purple);
  }
}
```

## Accessibility Features

### Skip to Content
```typescript
<SkipToContent />
```
Allows keyboard users to skip navigation and jump to main content.

### ARIA Labels
```typescript
<Header aria-label="Galaxium Travels">
<HeaderNavigation aria-label="Main Navigation">
<HeaderGlobalBar aria-label="User Actions">
```

### Keyboard Navigation
- Tab through navigation items
- Enter to activate links
- Escape to close panels
- Arrow keys for menu navigation

## Responsive Breakpoints

```scss
// Mobile: < 672px
@media (max-width: 671px) {
  .cds--header__nav {
    display: none; // Show side nav instead
  }
}

// Tablet: 672px - 1056px
@media (min-width: 672px) and (max-width: 1055px) {
  .content-wrapper {
    padding: 0 2rem;
  }
}

// Desktop: > 1056px
@media (min-width: 1056px) {
  .content-wrapper {
    padding: 0 3rem;
  }
}
```

## Migration Steps

### Step 1: Create New Components
1. Create `CarbonHeader.tsx`
2. Create `CarbonLayout.tsx`
3. Create `CarbonFooter.tsx`

### Step 2: Update App.tsx
```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './hooks/useUser';
import { Layout } from './components/layout/CarbonLayout'; // Updated
import { Home } from './pages/Home';
import { Flights } from './pages/Flights';
import { MyBookings } from './pages/MyBookings';

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/flights" element={<Flights />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
```

### Step 3: Test Navigation
- [ ] All links work correctly
- [ ] Active states display properly
- [ ] User panel opens/closes
- [ ] Logout functionality works
- [ ] Mobile navigation works
- [ ] Keyboard navigation works

### Step 4: Remove Old Components
After verification:
1. Delete old `Header.tsx`
2. Delete old `Layout.tsx`
3. Delete old `Footer.tsx`
4. Update imports across the app

## Testing Checklist

### Functionality
- [ ] Navigation links work
- [ ] Active page highlighting
- [ ] User authentication state
- [ ] Logout functionality
- [ ] Mobile menu toggle
- [ ] Panel expand/collapse

### Accessibility
- [ ] Skip to content works
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Focus indicators visible
- [ ] ARIA labels present

### Responsive Design
- [ ] Mobile (< 672px)
- [ ] Tablet (672px - 1056px)
- [ ] Desktop (> 1056px)
- [ ] Side nav on mobile
- [ ] Header on desktop

### Visual
- [ ] Glass effect applied
- [ ] Cosmic gradient on logo
- [ ] Hover states work
- [ ] Active states visible
- [ ] Spacing consistent

## Common Issues

### Issue: Header overlaps content

**Solution**: Add proper margin-top to content:
```scss
.cds--content {
  margin-top: 3rem; // Match header height
}
```

### Issue: Side nav not showing on mobile

**Solution**: Ensure HeaderMenuButton is present:
```typescript
<HeaderMenuButton
  aria-label="Open menu"
  onClick={onClickSideNavExpand}
  isActive={isSideNavExpanded}
/>
```

### Issue: Active state not updating

**Solution**: Use React Router's `useLocation` hook:
```typescript
const location = useLocation();
<HeaderMenuItem isActive={location.pathname === '/flights'}>
```

## Performance Considerations

- Header is fixed position (GPU accelerated)
- Backdrop filter may impact performance on older devices
- Consider disabling blur on low-end devices
- Lazy load user panel content

## Estimated Time

- Header component: 3 hours
- Layout component: 1 hour
- Footer component: 30 minutes
- Styling: 2 hours
- Testing: 1.5 hours
- **Total**: ~8 hours

---

**Status**: Ready for implementation  
**Dependencies**: Phase 3 (Component Migration)  
**Blocks**: Phase 5 (Testing and Validation)