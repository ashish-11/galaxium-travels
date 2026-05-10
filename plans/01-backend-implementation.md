# Backend Implementation Plan: Infant Booking Feature

## Overview
Add support for infant bookings (lap infants under 2 years) with the following requirements:
- **Pricing**: Free (0% of adult fare)
- **Seat Consumption**: No seat consumed (lap infant)
- **Limit**: One infant per adult booking

## Database Schema Changes

### 1. Update Booking Model
**File**: [`booking_system_backend/models.py`](../booking_system_backend/models.py:25)

Add new column to `Booking` table:
```python
has_infant = Column(Boolean, default=False, nullable=False)
```

**Migration Strategy**: Since using SQLite with `init_db()`, the table will be recreated. For production with migrations:
- Add column with default `False`
- Existing bookings automatically get `has_infant=False`

## Schema Updates

### 2. Update BookingRequest Schema
**File**: [`booking_system_backend/schemas.py`](../booking_system_backend/schemas.py:24)

Modify `BookingRequest` to include infant flag:
```python
class BookingRequest(BaseModel):
    user_id: int
    name: str
    flight_id: int
    seat_class: str  # 'economy', 'business', or 'galaxium'
    has_infant: bool = False  # Optional, defaults to False
```

### 3. Update BookingOut Schema
**File**: [`booking_system_backend/schemas.py`](../booking_system_backend/schemas.py:31)

Add infant field to response:
```python
class BookingOut(BaseModel):
    booking_id: int
    user_id: int
    flight_id: int
    seat_class: str
    status: str
    booking_time: str
    has_infant: bool  # New field
```

## Service Layer Changes

### 4. Update book_flight Service
**File**: [`booking_system_backend/services/booking.py`](../booking_system_backend/services/booking.py:7)

Modify function signature and logic:

```python
def book_flight(
    db: Session, 
    user_id: int, 
    name: str, 
    flight_id: int, 
    seat_class: str,
    has_infant: bool = False
) -> BookingOut | ErrorResponse:
    """Book a seat on a specific flight for a user in a specific seat class.
    
    Optionally include a lap infant (free, no seat consumed).
    """
    # Existing validation logic remains unchanged
    # ... (seat_class validation, flight check, user check)
    
    # Decrement seat count (unchanged - infant doesn't consume seat)
    setattr(flight, seats_field, available_seats - 1)
    
    # Create booking with infant flag
    new_booking = Booking(
        user_id=user_id,
        flight_id=flight_id,
        seat_class=seat_class,
        status="booked",
        booking_time=datetime.utcnow().isoformat(),
        has_infant=has_infant  # New field
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return BookingOut.model_validate(new_booking)
```

**Key Points**:
- No seat availability check for infant
- No seat decrement for infant
- Infant flag stored in booking record

## API Endpoint Updates

### 5. Update MCP Tool
**File**: [`booking_system_backend/server.py`](../booking_system_backend/server.py:31)

Update MCP tool signature:
```python
@mcp.tool()
def book_flight(
    user_id: int, 
    name: str, 
    flight_id: int, 
    seat_class: str,
    has_infant: bool = False
) -> BookingOut:
    """Book a seat on a specific flight for a user in a specific seat class.
    
    Args:
        user_id: The user's ID
        name: The user's name (must match registered name)
        flight_id: The flight ID to book
        seat_class: Seat class - 'economy', 'business', or 'galaxium'
        has_infant: Whether booking includes a lap infant (free, no seat)
    
    Decrements available seats for the specified class if successful.
    Infant does not consume a seat.
    Returns booking details or raises an error if booking is not possible.
    """
    db = SessionLocal()
    try:
        result = booking.book_flight(db, user_id, name, flight_id, seat_class, has_infant)
        if isinstance(result, ErrorResponse):
            raise Exception(result.details or result.error)
        return result
    finally:
        db.close()
```

### 6. Update REST Endpoint
**File**: [`booking_system_backend/server.py`](../booking_system_backend/server.py) (REST section)

Update POST `/bookings` endpoint to accept `has_infant`:
```python
@app.post("/bookings", response_model=BookingOut)
async def create_booking(request: BookingRequest, db: Session = Depends(get_db)):
    """Create a new booking with optional infant."""
    result = booking.book_flight(
        db, 
        request.user_id, 
        request.name, 
        request.flight_id, 
        request.seat_class,
        request.has_infant  # Pass infant flag
    )
    if isinstance(result, ErrorResponse):
        raise HTTPException(status_code=400, detail=result.model_dump())
    return result
```

## Testing Updates

### 7. Update Test Suite
**File**: [`booking_system_backend/tests/test_services.py`](../booking_system_backend/tests/test_services.py)

Add new test cases:

```python
def test_book_flight_with_infant(db_session, sample_user, sample_flight):
    """Test booking with infant doesn't consume extra seat."""
    initial_seats = sample_flight.economy_seats_available
    
    result = booking.book_flight(
        db_session,
        sample_user.user_id,
        sample_user.name,
        sample_flight.flight_id,
        "economy",
        has_infant=True
    )
    
    assert isinstance(result, BookingOut)
    assert result.has_infant is True
    
    # Verify only one seat consumed (adult), not two
    db_session.refresh(sample_flight)
    assert sample_flight.economy_seats_available == initial_seats - 1

def test_book_flight_without_infant(db_session, sample_user, sample_flight):
    """Test booking without infant works as before."""
    result = booking.book_flight(
        db_session,
        sample_user.user_id,
        sample_user.name,
        sample_flight.flight_id,
        "economy",
        has_infant=False
    )
    
    assert isinstance(result, BookingOut)
    assert result.has_infant is False
```

**File**: [`booking_system_backend/tests/test_rest.py`](../booking_system_backend/tests/test_rest.py)

Add REST endpoint tests:
```python
def test_create_booking_with_infant(client, sample_user, sample_flight):
    """Test POST /bookings with infant flag."""
    response = client.post("/bookings", json={
        "user_id": sample_user.user_id,
        "name": sample_user.name,
        "flight_id": sample_flight.flight_id,
        "seat_class": "economy",
        "has_infant": True
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["has_infant"] is True
```

## Database Seeding

### 8. Update Seed Data (Optional)
**File**: [`booking_system_backend/seed.py`](../booking_system_backend/seed.py)

Optionally add sample bookings with infants for testing:
```python
# Add sample booking with infant
booking_with_infant = Booking(
    user_id=1,
    flight_id=1,
    seat_class="economy",
    status="booked",
    booking_time=datetime.utcnow().isoformat(),
    has_infant=True
)
db.add(booking_with_infant)
```

## Implementation Checklist

- [ ] Update `Booking` model with `has_infant` column
- [ ] Update `BookingRequest` schema with `has_infant` field
- [ ] Update `BookingOut` schema with `has_infant` field
- [ ] Modify `book_flight` service to accept and store `has_infant`
- [ ] Update MCP tool signature and documentation
- [ ] Update REST endpoint to handle `has_infant`
- [ ] Add test cases for infant bookings
- [ ] Update seed data (optional)
- [ ] Test database migration/recreation
- [ ] Verify backward compatibility (existing bookings default to `has_infant=False`)

## Backward Compatibility

**Existing Bookings**: When database is recreated, all existing bookings will have `has_infant=False` by default.

**API Compatibility**: The `has_infant` parameter is optional with default `False`, so existing API calls continue to work without modification.

## Notes

- **No seat consumption**: Infants are lap infants and don't consume a seat from availability
- **No pricing impact**: Infant bookings are free (0% of adult fare)
- **One infant per booking**: Business logic doesn't enforce this at booking time, but frontend will control this
- **Cancellation**: When booking with infant is cancelled, only the adult seat is restored (infant didn't consume one)