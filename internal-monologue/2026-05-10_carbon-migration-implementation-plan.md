# Carbon Design System Migration - Implementation Plan
**Date**: 2026-05-10
**Task**: Implement Carbon Design System migration for Galaxium Travels

## Executive Summary

Migrating the Galaxium Travels booking system from custom Tailwind CSS components to IBM Carbon Design System while preserving the space-themed aesthetic and all functionality.

## Current State Analysis

### Technology Stack
- **Frontend**: React 19.2.0 + TypeScript + Vite
- **Styling**: Tailwind CSS 3.4.19 with custom space theme
- **Components**: Custom components with Framer Motion animations
- **Icons**: Lucide React
- **State**: React Context (UserProvider)

### Components to Migrate
1. **Common Components**: Button, Card, Input, Modal, LoadingSpinner
2. **Feature Components**: FlightCard, BookingCard, UserIdentification
3. **Layout Components**: Header, Footer, Layout
4. **Icons**: All Lucide icons → Carbon icons

## Implementation Strategy

### Phase 1: Setup and Dependencies (2-3 hours)
**Goal**: Install Carbon packages and configure build system

**Actions**:
1. Install `@carbon/react` package (includes components, styles, icons, themes)
2. Install `sass` for SCSS compilation
3. Update [`vite.config.ts`](../booking_system_frontend/vite.config.ts) for SCSS support
4. Create `src/carbon-theme.scss` entry point
5. Update [`src/main.tsx`](../booking_system_frontend/src/main.tsx) to import Carbon styles
6. Create test component to verify installation

**Success Criteria**:
- Carbon packages installed without errors
- SCSS compilation working
- Test Carbon button renders correctly
- No console errors

### Phase 2: Theme Configuration (3-4 hours)
**Goal**: Configure Carbon theme to match space aesthetic

**Actions**:
1. Configure Gray 100 (dark) theme as base
2. Override Carbon tokens with space theme colors:
   - Background: `#030712` (space-dark)
   - Interactive: `#6366F1` (cosmic-purple)
   - Text: `#F9FAFB` (star-white)
   - Success: `#10B981` (alien-green)
3. Create `src/carbon-overrides.scss` for component-specific styles
4. Apply glass effect (backdrop-filter, rgba backgrounds)
5. Add cosmic gradient to buttons and brand
6. Configure IBM Plex typography

**Key Customizations**:
```scss
// Glass effect for cards/modals
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);

// Cosmic gradient for primary actions
background: linear-gradient(135deg, #6366F1, #EC4899);
```

**Success Criteria**:
- Dark theme applied correctly
- Space colors visible throughout
- Glass effects rendering
- Sufficient color contrast (≥4.5:1)

### Phase 3: Common Components Migration (5 hours)

#### 3.1 Button Component (1 hour)
- **Current**: [`src/components/common/Button.tsx`](../booking_system_frontend/src/components/common/Button.tsx)
- **Carbon**: `Button` from `@carbon/react`
- **Mapping**: `variant` → `kind`, preserve `isLoading` state
- **Custom**: Apply cosmic gradient via CSS override

#### 3.2 Card Component (1 hour)
- **Current**: [`src/components/common/Card.tsx`](../booking_system_frontend/src/components/common/Card.tsx)
- **Carbon**: `Tile` or `ClickableTile`
- **Custom**: Glass effect styling

#### 3.3 Input Component (1 hour)
- **Current**: [`src/components/common/Input.tsx`](../booking_system_frontend/src/components/common/Input.tsx)
- **Carbon**: `TextInput`
- **Mapping**: `error` → `invalid` + `invalidText`

#### 3.4 Modal Component (1.5 hours)
- **Current**: [`src/components/common/Modal.tsx`](../booking_system_frontend/src/components/common/Modal.tsx)
- **Carbon**: `Modal`
- **Mapping**: `isOpen` → `open`, `onClose` → `onRequestClose`
- **Update**: BookingModal, ModifyBookingModal

#### 3.5 LoadingSpinner (0.5 hours)
- **Current**: [`src/components/common/LoadingSpinner.tsx`](../booking_system_frontend/src/components/common/LoadingSpinner.tsx)
- **Carbon**: `Loading`

### Phase 4: Complex Components Migration (6 hours)

#### 4.1 FlightCard Component (3 hours)
- **Current**: [`src/components/flights/FlightCard.tsx`](../booking_system_frontend/src/components/flights/FlightCard.tsx)
- **Carbon**: `Tile` + `RadioButtonGroup` + `RadioButton`
- **Features**: Flight details, seat class selection, booking button
- **Critical**: Preserve booking flow functionality

#### 4.2 BookingCard Component (3 hours)
- **Current**: [`src/components/bookings/BookingCard.tsx`](../booking_system_frontend/src/components/bookings/BookingCard.tsx)
- **Carbon**: `Tile` + `Tag` + `Button`
- **Features**: Booking details, status tags, modify/cancel actions
- **Critical**: Preserve modify and cancel flows

### Phase 5: Layout Migration (4-6 hours)

#### 5.1 Header Component (3 hours)
- **Current**: [`src/components/layout/Header.tsx`](../booking_system_frontend/src/components/layout/Header.tsx)
- **Carbon**: UI Shell components:
  - `HeaderContainer`
  - `Header`
  - `HeaderName` (logo/brand)
  - `HeaderNavigation` + `HeaderMenuItem`
  - `HeaderGlobalBar` + `HeaderGlobalAction`
  - `HeaderPanel` (user info)
  - `SideNav` (mobile)
- **Features**: Navigation, user actions, responsive mobile menu
- **Custom**: Glass effect, cosmic gradient on logo

#### 5.2 Layout Component (1 hour)
- **Current**: [`src/components/layout/Layout.tsx`](../booking_system_frontend/src/components/layout/Layout.tsx)
- **Carbon**: `Content` wrapper
- **Update**: [`src/App.tsx`](../booking_system_frontend/src/App.tsx)

#### 5.3 Footer Component (0.5 hours)
- **Current**: [`src/components/layout/Footer.tsx`](../booking_system_frontend/src/components/layout/Footer.tsx)
- **Carbon**: Custom footer with Carbon styling

### Phase 6: Icon Migration (1 hour)
- **Replace**: Lucide React → Carbon Icons React
- **Mapping**:
  - `Rocket` → `Rocket`
  - `User` → `User`
  - `LogOut` → `Logout`
  - `Plane` → `Airplane`
  - `Clock` → `Time`
  - `Calendar` → `Calendar`

### Phase 7: Testing (6 hours)

#### 7.1 Functional Testing (2 hours)
- [ ] Navigation works across all pages
- [ ] User authentication flow (identify, logout)
- [ ] Flight booking flow (select, book, confirm)
- [ ] Booking management (view, modify, cancel)
- [ ] Error handling and loading states

#### 7.2 Visual Testing (1 hour)
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Theme consistency (space colors, glass effects)
- [ ] Hover and focus states

#### 7.3 Accessibility Testing (2 hours)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader compatibility (NVDA/VoiceOver)
- [ ] ARIA attributes present
- [ ] Color contrast ≥4.5:1
- [ ] Focus indicators visible
- [ ] Skip to content link

#### 7.4 Performance Testing (1 hour)
- [ ] Lighthouse audit (Performance ≥90, Accessibility ≥95)
- [ ] Bundle size check (target <500KB gzipped)
- [ ] Core Web Vitals (LCP <2.5s, FID <100ms, CLS <0.1)
- [ ] Compare with baseline metrics

### Phase 8: Bug Fixes and Refinement (4-8 hours)
- Fix critical and high-priority bugs
- Optimize performance bottlenecks
- Refine animations and transitions
- Polish responsive design
- Document medium/low priority issues for future

### Phase 9: Documentation and Cleanup (2-3 hours)
- Add JSDoc comments to new components
- Update README.md with Carbon setup instructions
- Update screenshots
- Remove unused imports and commented code
- Run linter and fix issues
- Create migration notes

## Key Considerations

### Preserve Functionality
- All existing features must work identically
- No breaking changes to user flows
- Maintain API integration
- Preserve localStorage user data

### Maintain Space Theme
- Dark background with cosmic colors
- Glass morphism effects (backdrop-filter)
- Cosmic gradient on interactive elements
- Smooth animations and transitions

### Accessibility First
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader optimization
- Sufficient color contrast

### Performance
- Bundle size monitoring
- Code splitting where beneficial
- Lazy loading for routes
- Optimize SCSS imports (selective vs full)

## Risk Mitigation

### Potential Issues
1. **Animation Conflicts**: Framer Motion vs Carbon animations
   - **Solution**: Keep Framer Motion for custom animations, use Carbon motion tokens for standard transitions

2. **Theme Customization Limits**: Carbon's design system constraints
   - **Solution**: Use CSS overrides for space-specific styling while respecting Carbon patterns

3. **Component Gaps**: Custom features not in Carbon
   - **Solution**: Create wrapper components that extend Carbon components

4. **Breaking Changes**: Significant UI changes
   - **Solution**: Gradual migration, test thoroughly, maintain feature parity

### Rollback Plan
- Keep old components until new ones verified
- Git branch for migration (`feature/carbon-migration`)
- Can revert specific components if issues arise
- Full rollback possible if critical issues found

## Timeline Estimate

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Setup | 2-3h | Critical |
| Phase 2: Theme | 3-4h | Critical |
| Phase 3: Common Components | 5h | High |
| Phase 4: Complex Components | 6h | High |
| Phase 5: Layout | 4-6h | High |
| Phase 6: Icons | 1h | Medium |
| Phase 7: Testing | 6h | Critical |
| Phase 8: Bug Fixes | 4-8h | High |
| Phase 9: Documentation | 2-3h | Medium |
| **Total** | **33-46 hours** | |

## Success Criteria

### Must Have ✅
- All existing functionality works
- No critical bugs
- WCAG 2.1 AA accessibility
- Performance maintained or improved
- Responsive design on all screen sizes

### Should Have ✅
- Improved visual consistency
- Better code maintainability
- Enhanced accessibility features
- Optimized bundle size
- Complete documentation

### Nice to Have ✅
- Improved animations
- Better error handling
- Enhanced user experience
- Reduced technical debt

## Next Steps

1. **Review this plan** with stakeholders
2. **Create git branch**: `feature/carbon-migration`
3. **Begin Phase 1**: Setup and dependencies
4. **Follow implementation checklist** sequentially
5. **Test after each phase** before proceeding
6. **Document learnings** throughout process

## References

- [Carbon Design System Documentation](https://carbondesignsystem.com/)
- [Carbon React Components](https://react.carbondesignsystem.com/)
- [IBM Plex Fonts](https://www.ibm.com/plex/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Status**: Ready for implementation
**Estimated Completion**: 33-46 hours
**Risk Level**: Medium (well-planned, incremental approach)