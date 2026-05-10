# Backend Implementation Plan: Seat Classes

## Overview
Implement three seat classes (Economy, Business, Galaxium) with proportional allocation and price multipliers.

## Pricing Strategy
- **Economy**: Base price (1x multiplier)
- **Business**: 2x Economy price
- **Galaxium**: 5x Economy price

## Seat Allocation Strategy
- **Economy**: 60% of total seats
- **Business**: 30% of total seats
- **Galaxium**: 10% of total seats

Example: 10 total seats = 6 Economy, 3 Business, 1 Galaxium

---

## Database Schema Changes

### 1. Update Flight Model
**File**: [`booking_system_backend/models.py`](../booking_system_backend/models.py)

**Current Structure**:
```python
class Flight(Base):
    flight_id = Column(Integer, primary_key=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    departure_time = Column(String, nullable=False)
    arrival_time = Column(String, nullable=False)
    price = Column(Integer, nullable=False)  # Single price
    seats_available = Column(Integer, nullable=False)  # Total seats
```

**New Structure**:
```python
class Flight(Base):
    flight_id = Column(Integer, primary_key=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    departure_time = Column(String, nullable=False)
    arrival_time = Column(String, nullable=False)
    base_price = Column(Integer, nullable=False)  # Economy price
    total_seats = Column(Integer, nullable=False)  # Total capacity
    economy_seats_available = Column(Integer, nullable=False)
    business_seats_available = Column(Integer, nullable=False)
    galaxium_seats_available = Column(Integer, nullable=False)
```

**Migration Notes**:
- Rename `price` → `base_price`
- Rename `seats_available` → `total_seats`
- Add three new columns for seat class availability
- Calculate initial values: 60% economy, 30% business, 10% galaxium

### 2. Update Booking Model
**File**: [`booking_system_backend/models.py`](../booking_system_backend/models.py)

**Add seat_class field**:
```python
class Booking(Base):
    booking_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    flight_id = Column(Integer, ForeignKey('flights.flight_id'))
    seat_class = Column(String, nullable=False)  # NEW: 'economy', 'business', 'galaxium'
    status = Column(String, nullable=False)
    booking_time = Column(String, nullable=False)
```

---

## Schema Updates

### 3. Update Pydantic Schemas
**File**: [`booking_system_backend/schemas.py`](../booking_system_backend/schemas.py)

**FlightOut Schema**:
```python
class FlightOut(BaseModel):
    flight_id: int
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    base_price: int  # Economy price
    economy_price: int  # Computed: base_price * 1
    business_price: int  # Computed: base_price * 2
    galaxium_price: int  # Computed: base_price * 5
    total_seats: int
    economy_seats_available: int
    business_seats_available: int
    galaxium_seats_available: int
```

**BookingRequest Schema**:
```python
class BookingRequest(BaseModel):
    user_id: int
    name: str
    flight_id: int
    seat_class: str  # NEW: 'economy', 'business', or 'galaxium'
```

**BookingOut Schema**:
```python
class BookingOut(BaseModel):
    booking_id: int
    user_id: int
    flight_id: int
    seat_class: str  # NEW
    status: str
    booking_time: str
```

---

## Service Layer Changes

### 4. Update Flight Service
**File**: [`booking_system_backend/services/flight.py`](../booking_system_backend/services/flight.py)

**Enhance list_flights**:
```python
def list_flights(db: Session) -> list[FlightOut]:
    flights = db.query(Flight).all()
    result = []
    for f in flights:
        flight_dict = {
            "flight_id": f.flight_id,
            "origin": f.origin,
            "destination": f.destination,
            "departure_time": f.departure_time,
            "arrival_time": f.arrival_time,
            "base_price": f.base_price,
            "economy_price": f.base_price,
            "business_price": f.base_price * 2,
            "galaxium_price": f.base_price * 5,
            "total_seats": f.total_seats,
            "economy_seats_available": f.economy_seats_available,
            "business_seats_available": f.business_seats_available,
            "galaxium_seats_available": f.galaxium_seats_available
        }
        result.append(FlightOut(**flight_dict))
    return result
```

### 5. Update Booking Service
**File**: [`booking_system_backend/services/booking.py`](../booking_system_backend/services/booking.py)

**Update book_flight function**:
```python
def book_flight(db: Session, user_id: int, name: str, flight_id: int, seat_class: str) -> BookingOut | ErrorResponse:
    # Validate seat_class
    valid_classes = ['economy', 'business', 'galaxium']
    if seat_class not in valid_classes:
        return ErrorResponse(
            error="Invalid seat class",
            error_code="INVALID_SEAT_CLASS",
            details=f"Seat class must be one of: {', '.join(valid_classes)}"
        )
    
    # Check flight exists
    flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
    if not flight:
        return ErrorResponse(...)
    
    # Check seats available for specific class
    seats_field = f"{seat_class}_seats_available"
    available_seats = getattr(flight, seats_field)
    
    if available_seats < 1:
        return ErrorResponse(
            error=f"No {seat_class} seats available",
            error_code="NO_SEATS_AVAILABLE",
            details=f"All {seat_class} class seats are booked."
        )
    
    # Validate user (existing logic)
    user = db.query(User).filter(User.user_id == user_id, User.name == name).first()
    if not user:
        return ErrorResponse(...)
    
    # Decrement appropriate seat count
    setattr(flight, seats_field, available_seats - 1)
    
    # Create booking with seat_class
    new_booking = Booking(
        user_id=user_id,
        flight_id=flight_id,
        seat_class=seat_class,
        status="booked",
        booking_time=datetime.utcnow().isoformat()
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return BookingOut.model_validate(new_booking)
```

**Update cancel_booking function**:
```python
def cancel_booking(db: Session, booking_id: int) -> BookingOut | ErrorResponse:
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        return ErrorResponse(...)
    
    if booking.status == "cancelled":
        return ErrorResponse(...)
    
    # Restore seat to appropriate class
    flight = db.query(Flight).filter(Flight.flight_id == booking.flight_id).first()
    if flight:
        seats_field = f"{booking.seat_class}_seats_available"
        current_seats = getattr(flight, seats_field)
        setattr(flight, seats_field, current_seats + 1)
    
    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)
    return BookingOut.model_validate(booking)
```

---

## API Endpoint Changes

### 6. Update REST Endpoints
**File**: [`booking_system_backend/server.py`](../booking_system_backend/server.py)

**Update POST /bookings endpoint**:
```python
@app.post("/bookings", response_model=BookingOut)
async def create_booking(request: BookingRequest, db: Session = Depends(get_db)):
    result = booking_service.book_flight(
        db, 
        request.user_id, 
        request.name, 
        request.flight_id,
        request.seat_class  # NEW parameter
    )
    if isinstance(result, ErrorResponse):
        raise HTTPException(status_code=400, detail=result.model_dump())
    return result
```

### 7. Update MCP Tools
**File**: [`booking_system_backend/server.py`](../booking_system_backend/server.py)

**Update book_flight MCP tool**:
```python
@mcp.tool()
def book_flight(user_id: int, name: str, flight_id: int, seat_class: str) -> str:
    """Book a seat on a flight for a user.
    
    Args:
        user_id: The user's ID
        name: The user's name (must match registered name)
        flight_id: The flight ID to book
        seat_class: Seat class - 'economy', 'business', or 'galaxium'
    """
    db = SessionLocal()
    try:
        result = booking_service.book_flight(db, user_id, name, flight_id, seat_class)
        if isinstance(result, ErrorResponse):
            raise ValueError(f"{result.error}: {result.details}")
        return f"Booking successful! Booking ID: {result.booking_id}, Class: {seat_class}"
    finally:
        db.close()
```

---

## Seed Data Updates

### 8. Update Seed Script
**File**: [`booking_system_backend/seed.py`](../booking_system_backend/seed.py)

**Update flight creation**:
```python
def calculate_seat_distribution(total_seats: int) -> tuple[int, int, int]:
    """Calculate 60/30/10 split for economy/business/galaxium."""
    economy = int(total_seats * 0.6)
    business = int(total_seats * 0.3)
    galaxium = max(1, total_seats - economy - business)  # Ensure at least 1
    return economy, business, galaxium

flights = []
flight_data = [
    ("Earth", "Mars", "2099-01-01T09:00:00Z", "2099-01-01T17:00:00Z", 1000000, 10),
    ("Earth", "Moon", "2099-01-02T10:00:00Z", "2099-01-02T14:00:00Z", 500000, 10),
    # ... more flights
]

for origin, dest, dep, arr, base_price, total_seats in flight_data:
    economy, business, galaxium = calculate_seat_distribution(total_seats)
    flights.append(Flight(
        origin=origin,
        destination=dest,
        departure_time=dep,
        arrival_time=arr,
        base_price=base_price,
        total_seats=total_seats,
        economy_seats_available=economy,
        business_seats_available=business,
        galaxium_seats_available=galaxium
    ))
```

**Update booking creation**:
```python
seat_classes = ['economy', 'business', 'galaxium']
for i in range(20):
    bookings.append(Booking(
        user_id=random.choice(user_ids),
        flight_id=random.choice(flight_ids),
        seat_class=random.choice(seat_classes),  # NEW
        status=random.choice(statuses),
        booking_time=booking_time
    ))
```

---

## Testing Updates

### 9. Update Test Suite
**File**: [`booking_system_backend/tests/test_services.py`](../booking_system_backend/tests/test_services.py)

**Add new test cases**:
- Test booking each seat class
- Test seat class validation
- Test seat availability per class
- Test cancellation restores correct class
- Test price calculation for each class

**Example test**:
```python
def test_book_flight_with_seat_class(db_session):
    # Create test flight with seat classes
    flight = Flight(
        origin="Earth",
        destination="Mars",
        departure_time="2099-01-01T09:00:00Z",
        arrival_time="2099-01-01T17:00:00Z",
        base_price=1000000,
        total_seats=10,
        economy_seats_available=6,
        business_seats_available=3,
        galaxium_seats_available=1
    )
    db_session.add(flight)
    db_session.commit()
    
    # Test booking economy
    result = book_flight(db_session, user.user_id, user.name, flight.flight_id, "economy")
    assert isinstance(result, BookingOut)
    assert result.seat_class == "economy"
    
    # Verify seat count decreased
    db_session.refresh(flight)
    assert flight.economy_seats_available == 5
```

---

## Implementation Order

1. **Database Models** - Update [`models.py`](../booking_system_backend/models.py)
2. **Schemas** - Update [`schemas.py`](../booking_system_backend/schemas.py)
3. **Services** - Update [`flight.py`](../booking_system_backend/services/flight.py) and [`booking.py`](../booking_system_backend/services/booking.py)
4. **API Endpoints** - Update [`server.py`](../booking_system_backend/server.py)
5. **Seed Data** - Update [`seed.py`](../booking_system_backend/seed.py)
6. **Tests** - Update [`test_services.py`](../booking_system_backend/tests/test_services.py)
7. **Database Migration** - Drop and recreate with `python seed.py`

---

## Backward Compatibility Notes

⚠️ **Breaking Changes**:
- Database schema changes require recreation
- API contracts change (new `seat_class` parameter required)
- Existing bookings will need migration or recreation

**Migration Strategy**:
- For demo/development: Drop and recreate database with seed script
- For production: Would need proper migration script to preserve data