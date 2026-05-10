# Booking Modal Text Visibility Issue - Carbon Migration

## Problem
After migrating to Carbon Design System, the booking modal text is completely invisible (dark text on dark background).

## Root Cause
Carbon's Modal components (`CarbonModal`, `ModalHeader`, `ModalBody`) apply their own CSS styles with very high specificity that override:
- Tailwind utility classes (e.g., `text-star-white`, `text-cosmic-purple`)
- Custom CSS with `!important` flags
- Inline styles on wrapper elements

## Attempted Solutions (All Failed)
1. **CSS overrides in carbon-theme.scss** - Added `!important` rules targeting `.cds--modal-body *` but Carbon's styles still won
2. **Inline styles on container div** - Added `style={{ color: '#F9FAFB' }}` to BookingModal container, but child elements didn't inherit
3. **Inline styles on Modal component** - Added inline styles to `CarbonModal`, `ModalHeader`, and `ModalBody` components, but they don't pass through to rendered DOM
4. **Wildcard selectors with !important** - Used `.cds--modal-container * { color: white !important; }` but still overridden

## Why CSS Fixes Don't Work
Carbon components render their own internal DOM structure. The inline styles and CSS classes we apply to the React components don't reach the actual text elements inside Carbon's rendered output. Carbon's internal stylesheets have higher specificity than our overrides.

## Recommended Solution
**Revert the Carbon migration for modals** and use the original custom Modal component. The Carbon Design System is incompatible with the existing dark space theme without extensive customization.

Alternative: Create a completely custom modal that doesn't use Carbon's Modal components, only using Carbon for other UI elements like buttons and inputs.

## Files Affected
- `booking_system_frontend/src/components/common/Modal.tsx` - Wrapped Carbon Modal
- `booking_system_frontend/src/components/bookings/BookingModal.tsx` - Uses Modal component
- `booking_system_frontend/src/carbon-theme.scss` - Theme configuration with failed overrides

## Current State
- Modal opens but all text is invisible
- User cannot see flight details, pricing, or booking options
- Feature is completely broken