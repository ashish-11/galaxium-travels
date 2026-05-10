# Infant Booking Feature Planning Session

**Date**: 2026-05-10
**Task**: Add infant booking feature to Galaxium Travels booking system

## Requirements Gathered
- **Pricing**: Free (0% of adult fare) - lap infants under 2 years
- **Seat Consumption**: No seat consumed (one infant per adult booking)
- **Implementation**: Full-stack feature across backend and frontend

## Analysis Completed
Reviewed existing architecture:
- Backend: FastAPI + FastMCP with SQLAlchemy ORM
- Frontend: React + TypeScript with Vite
- Database: SQLite with manual schema recreation
- Service layer pattern with ErrorResponse unions

## Plans Created

### 1. Backend Implementation Plan
- Database schema: Add `has_infant` boolean column to Booking model
- Schemas: Update BookingRequest and BookingOut with infant field
- Service: Modify book_flight to accept and store infant flag
- API: Update both MCP tool and REST endpoint
- Testing: Add unit tests for infant booking scenarios
- Key insight: Infant doesn't consume seat, no price impact

### 2. Frontend Implementation Plan
- Types: Update Booking and BookingRequest interfaces
- BookingModal: Add infant toggle UI with Baby icon
- BookingCard: Display infant badge on bookings
- Design: Use cosmic-purple theme, show "FREE" prominently
- UX: Simple toggle button, clear visual feedback

### 3. Implementation Guide
- Step-by-step instructions for both backend and frontend
- Database recreation strategy (delete and recreate)
- Testing procedures and verification steps
- Rollback plan and common issues
- Estimated time: 2.5 hours total

## Key Design Decisions
1. **No seat validation**: Backend doesn't enforce one-infant-per-booking; frontend controls via UI
2. **Free pricing**: Always 0%, no calculation needed
3. **Backward compatible**: Optional parameter with default false
4. **Simple state**: Single boolean, no complex validation

## Files to Modify
Backend: models.py, schemas.py, services/booking.py, server.py, tests/
Frontend: types/index.ts, BookingModal.tsx, BookingCard.tsx

## Next Steps
User review and approval before switching to code mode for implementation.