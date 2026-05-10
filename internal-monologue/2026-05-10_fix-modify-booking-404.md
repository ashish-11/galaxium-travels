# Fix Modify Booking 404 Error

## Issue
Frontend was receiving 404 errors when attempting to modify bookings via PUT `/modify/{booking_id}`.

## Root Cause
Schema mismatch between frontend and backend:
- `ModifyBookingRequest` schema included `booking_id` field
- Backend endpoint takes `booking_id` from URL path parameter
- Frontend was sending `booking_id` in both URL and request body
- This caused a validation error resulting in 404

## Solution
1. Removed `booking_id` field from `ModifyBookingRequest` schema (backend)
2. Updated TypeScript `ModifyBookingRequest` interface to match (frontend)
3. Updated `modifyBooking` API function to use correct type signature

## Files Modified
- `booking_system_backend/schemas.py` - Removed `booking_id` from ModifyBookingRequest
- `booking_system_frontend/src/types/index.ts` - Removed `booking_id` from interface
- `booking_system_frontend/src/services/api.ts` - Updated function signature

## Next Steps
Backend server needs restart to pick up schema changes.