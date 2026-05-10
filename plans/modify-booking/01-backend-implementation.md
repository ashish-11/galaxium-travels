# Backend Implementation Plan: Modify Booking Feature

## Overview
Implement a comprehensive booking modification system that allows users to change their seat class and infant status for existing bookings. The system must handle seat availability validation, price adjustments, and maintain data integrity.

## Architecture Changes

### 1. Database Schema (No Changes Required)
Current [`Booking`](booking_system_backend/models.py:25) model already supports all required fields:
- `booking_id` - Primary key
- `seat_class` - Can be updated
- `has_infant` - Can be updated
- `status` - Must be 'booked' to allow modifications

### 2. New Schema Definitions

#### ModifyBookingRequest Schema
Create in [`schemas.py`](booking_system_backend/schemas.py:1):

```python
class ModifyBookingRequest(BaseModel):
    booking_id: int
    new_seat_class: str  # 'economy', 'business', or 'galaxium'
    has_infant: bool
```

#### ModifyBookingResponse Schema
```python
class ModifyBookingResponse(BaseModel):
    booking: BookingOut
    price_difference: int  # Positive = additional charge, Negative = refund
    old_seat_class: str
    new_seat_class: str
    
    class Config:
        from_attributes = True
```

### 3. Service Layer Implementation

#### New Service Function: `modify_booking()`
Location: [`booking_system_backend/services/booking.py`](booking_system_backend/services/booking.py:1)

**Function Signature:**
```python
def modify_booking(
    db: Session, 
    booking_id: int, 
    new_seat_class: str, 
    has_infant: bool
) -> ModifyBookingResponse | ErrorResponse
```

**Business Logic Flow:**

1. **Validation Phase**
   - Verify booking exists
   - Check booking status is 'booked' (not 'cancelled' or 'completed')
   - Validate new_seat_class is in ['economy', 'business', 'galaxium']
   - Retrieve associated flight

2. **Seat Class Change Logic**
   - If `new_seat_class == current_seat_class`:
     - Only update `has_infant` flag
     - No seat availability changes needed
   - If `new_seat_class != current_seat_class`:
     - Check new class has available seats
     - Restore 1 seat to old class: `old_class_seats_available += 1`
     - Consume 1 seat from new class: `new_class_seats_available -= 1`
     - Update booking's `seat_class`

3. **Infant Status Update**
   - Update `has_infant` field (no seat impact - lap infant)

4. **Price Calculation**
   - Calculate old price based on old seat class
   - Calculate new price based on new seat class
   - Return `price_difference = new_price - old_price`

5. **Database Commit**
   - Update booking record
   - Update flight seat availability
   - Commit transaction

**Error Scenarios:**
- `BOOKING_NOT_FOUND` - booking_id doesn't exist
- `BOOKING_NOT_MODIFIABLE` - status is 'cancelled' or 'completed'
- `INVALID_SEAT_CLASS` - new_seat_class not in valid options
- `NO_SEATS_AVAILABLE` - target class fully booked
- `FLIGHT_NOT_FOUND` - associated flight missing (data integrity issue)

### 4. API Endpoints

#### REST Endpoint
Location: [`server.py`](booking_system_backend/server.py:1) (after line 120)

```python
@app.put("/modify/{booking_id}")
async def modify_booking_endpoint(
    booking_id: int,
    request: ModifyBookingRequest,
    db: Session = Depends(get_db)
) -> ModifyBookingResponse | ErrorResponse:
    """Modify an existing booking's seat class and infant status."""
    result = booking.modify_booking(
        db, 
        booking_id, 
        request.new_seat_class, 
        request.has_infant
    )
    return result
```

#### MCP Tool
Location: [`server.py`](booking_system_backend/server.py:1) (after line 77)

```python
@mcp.tool()
def modify_booking(
    booking_id: int, 
    new_seat_class: str, 
    has_infant: bool
) -> ModifyBookingResponse:
    """Modify an existing booking's seat class and/or infant status.
    
    Args:
        booking_id: The booking ID to modify
        new_seat_class: New seat class - 'economy', 'business', or 'galaxium'
        has_infant: Whether booking includes a lap infant
    
    Returns booking details with price difference information.
    Raises error if booking cannot be modified."""
    db = SessionLocal()
    try:
        result = booking.modify_booking(db, booking_id, new_seat_class, has_infant)
        if isinstance(result, ErrorResponse):
            raise Exception(result.details or result.error)
        return result
    finally:
        db.close()
```

### 5. Testing Requirements

#### Unit Tests
Location: [`booking_system_backend/tests/test_services.py`](booking_system_backend/tests/test_services.py:1)

**Test Cases:**
1. `test_modify_booking_upgrade_class` - Economy → Business
2. `test_modify_booking_downgrade_class` - Galaxium → Economy
3. `test_modify_booking_same_class_add_infant` - Add infant without class change
4. `test_modify_booking_same_class_remove_infant` - Remove infant
5. `test_modify_booking_not_found` - Invalid booking_id
6. `test_modify_booking_already_cancelled` - Cancelled booking
7. `test_modify_booking_no_seats_available` - Target class full
8. `test_modify_booking_invalid_seat_class` - Invalid class name
9. `test_modify_booking_price_calculation` - Verify price differences

#### Integration Tests
Location: [`booking_system_backend/tests/test_rest.py`](booking_system_backend/tests/test_rest.py:1)

**Test Cases:**
1. `test_modify_booking_endpoint_success` - Full flow via REST
2. `test_modify_booking_endpoint_validation` - Schema validation
3. `test_modify_booking_endpoint_error_handling` - Error responses

## Implementation Order

1. Add schemas to [`schemas.py`](booking_system_backend/schemas.py:1)
2. Implement [`modify_booking()`](booking_system_backend/services/booking.py:1) service function
3. Add REST endpoint to [`server.py`](booking_system_backend/server.py:1)
4. Add MCP tool to [`server.py`](booking_system_backend/server.py:1)
5. Write unit tests in [`test_services.py`](booking_system_backend/tests/test_services.py:1)
6. Write integration tests in [`test_rest.py`](booking_system_backend/tests/test_rest.py:1)
7. Update API documentation

## Key Considerations

**Atomicity**: All database operations must be in a single transaction. If seat availability update fails, booking update must rollback.

**Seat Availability**: When changing classes, the operation is atomic:
- Old class: +1 seat
- New class: -1 seat
- If new class has 0 seats, entire operation fails

**Price Transparency**: Return price difference to frontend for user confirmation before payment processing.

**Infant Logic**: Infant status can be toggled independently of seat class changes. Infants never consume seats.

**Status Validation**: Only 'booked' status bookings can be modified. This prevents modifying historical or cancelled bookings.