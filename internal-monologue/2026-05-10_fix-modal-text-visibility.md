# Fix Modal Text Visibility Issue After Carbon Migration

## Issue
After Carbon Design migration, text in multiple modals was nearly invisible due to low contrast between the text color and the modal's glass-effect background.

## Root Cause
- Modal content used `text-star-white/60` or `text-star-white/70` (60-70% opacity white text)
- Carbon Modal has glass-effect background: `rgba(255, 255, 255, 0.05)` with backdrop blur
- Low opacity text on semi-transparent background created insufficient contrast

## Solution
Increased text opacity from 60% to 80% (`text-star-white/80`) for better readability in modals:

1. **Cancel Booking Modal** - Changed from `/70` to full opacity in [`MyBookings.tsx:208`](booking_system_frontend/src/pages/MyBookings.tsx:208)
2. **Booking Modal** - Changed all `/60` labels to `/80` in [`BookingModal.tsx`](booking_system_frontend/src/components/bookings/BookingModal.tsx)
3. **Modify Booking Modal** - Changed all `/60` labels to `/80` in [`ModifyBookingModal.tsx`](booking_system_frontend/src/components/bookings/ModifyBookingModal.tsx)

## Files Modified
- `booking_system_frontend/src/pages/MyBookings.tsx` - Cancel modal text
- `booking_system_frontend/src/components/bookings/BookingModal.tsx` - All label text (9 instances)
- `booking_system_frontend/src/components/bookings/ModifyBookingModal.tsx` - All label text (15 instances)

## Testing
User should verify all modals now display text clearly and legibly with proper contrast.