# Fix Booking Modal Text Visibility Issue

## Problem
After Carbon Design migration, booking modal content was completely invisible - text appeared dark against dark blue background.

## Root Cause
Tailwind utility classes (like `text-star-white`, `text-cosmic-purple`) have higher specificity than SCSS overrides. The classes were being applied to elements but Carbon's modal styles were overriding them.

## Solution
Applied nuclear option in [`carbon-overrides.scss`](../booking_system_frontend/src/carbon-overrides.scss:68):
- Used wildcard selector `* { color: var(--star-white) !important; }` within `.cds--modal-body`
- This forces ALL elements inside modal body to be white, overriding any Tailwind classes
- Added double-down on specific elements for extra insurance

## Files Modified
- `booking_system_frontend/src/carbon-overrides.scss` - Added aggressive color overrides for modal body

## Testing Required
- Open booking modal and verify all text is visible
- Check that icons, prices, dates, and all content displays properly
- Verify infant selection toggle is readable
- Confirm buttons are visible and functional