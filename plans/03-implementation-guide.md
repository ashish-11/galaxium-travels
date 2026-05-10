# Implementation Guide: Infant Booking Feature

## Overview
This guide provides step-by-step instructions for implementing the infant booking feature across the full stack. Follow the order specified to ensure smooth integration.

## Prerequisites
- Backend server stopped
- Frontend development server stopped
- Git working directory clean (recommended)
- Database backup (if needed)

## Implementation Order

### Phase 1: Backend Implementation (60 minutes)

#### Step 1: Update Database Models (10 min)
**File**: [`booking_system_backend/models.py`](../booking_system_backend/models.py:25)

1. Add `has_infant` column to `Booking` model:
```python
has_infant = Column(Boolean, default=False, nullable=False)
```

2. Position: After `booking_time` column (line 32)

**Verification**: Run `python -c "from models import Booking; print(Booking.__table__.columns.keys())"` to verify column exists.

#### Step 2: Update Pydantic Schemas (10 min)
**File**: [`booking_system_backend/schemas.py`](../booking_system_backend/schemas.py)

1. Update `BookingRequest` (line 24):
```python
class BookingRequest(BaseModel):
    user_id: int
    name: str
    flight_id: int
    seat_class: str
    has_infant: bool = False  # Add this line
```

2. Update `BookingOut` (line 31):
```python
class BookingOut(BaseModel):
    booking_id: int
    user_id: int
    flight_id: int
    seat_class: str
    status: str
    booking_time: str
    has_infant: bool  # Add this line
```

**Verification**: Run `python -c "from schemas import BookingRequest, BookingOut; print(BookingRequest.model_fields.keys()); print(BookingOut.model_fields.keys())"`.

#### Step 3: Update Booking Service (15 min)
**File**: [`booking_system_backend/services/booking.py`](../booking_system_backend/services/booking.py:7)

1. Update function signature (line 7):
```python
def book_flight(
    db: Session, 
    user_id: int, 
    name: str, 
    flight_id: int, 
    seat_class: str,
    has_infant: bool = False  # Add this parameter
) -> BookingOut | ErrorResponse:
```

2. Update docstring (line 8):
```python
"""Book a seat on a specific flight for a user in a specific seat class.
    
Optionally include a lap infant (free, no seat consumed).
"""
```

3. Update booking creation (line 59):
```python
new_booking = Booking(
    user_id=user_id,
    flight_id=flight_id,
    seat_class=seat_class,
    status="booked",
    booking_time=datetime.utcnow().isoformat(),
    has_infant=has_infant  # Add this line
)
```

**Verification**: Check function signature matches expected parameters.

#### Step 4: Update API Endpoints (15 min)
**File**: [`booking_system_backend/server.py`](../booking_system_backend/server.py)

1. Update MCP tool (line 31):
```python
@mcp.tool()
def book_flight(
    user_id: int, 
    name: str, 
    flight_id: int, 
    seat_class: str,
    has_infant: bool = False  # Add this parameter
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
        result = booking.book_flight(
            db, user_id, name, flight_id, seat_class, has_infant  # Add parameter
        )
        if isinstance(result, ErrorResponse):
            raise Exception(result.details or result.error)
        return result
    finally:
        db.close()
```

2. Find REST endpoint (search for `@app.post("/bookings")`):
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
        request.has_infant  # Add this line
    )
    if isinstance(result, ErrorResponse):
        raise HTTPException(status_code=400, detail=result.model_dump())
    return result
```

**Verification**: Check both MCP and REST endpoints accept `has_infant` parameter.

#### Step 5: Recreate Database (5 min)

1. Stop backend server if running
2. Delete existing database:
```bash
cd booking_system_backend
rm -f booking_system.db  # or del booking_system.db on Windows
```

3. Start server to recreate database:
```bash
python server.py
```

4. Database will be automatically recreated with new schema and seeded with sample data

**Verification**: Check server logs for "Database initialized" and "Database seeded" messages.

#### Step 6: Test Backend (5 min)

Test via REST API:
```bash
# Test booking without infant
curl -X POST http://localhost:8080/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "Alice Johnson",
    "flight_id": 1,
    "seat_class": "economy",
    "has_infant": false
  }'

# Test booking with infant
curl -X POST http://localhost:8080/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "Alice Johnson",
    "flight_id": 2,
    "seat_class": "economy",
    "has_infant": true
  }'
```

**Expected**: Both requests return booking objects with `has_infant` field.

### Phase 2: Frontend Implementation (45 minutes)

#### Step 7: Update TypeScript Types (5 min)
**File**: [`booking_system_frontend/src/types/index.ts`](../booking_system_frontend/src/types/index.ts)

1. Update `Booking` interface (line 21):
```typescript
export interface Booking {
  booking_id: number;
  user_id: number;
  flight_id: number;
  seat_class: SeatClass;
  status: 'booked' | 'cancelled' | 'completed';
  booking_time: string;
  has_infant: boolean;  // Add this line
}
```

2. Update `BookingRequest` interface (line 37):
```typescript
export interface BookingRequest {
  user_id: number;
  name: string;
  flight_id: number;
  seat_class: SeatClass;
  has_infant: boolean;  // Add this line
}
```

**Verification**: Run `npm run build` to check for TypeScript errors.

#### Step 8: Update BookingModal Component (25 min)
**File**: [`booking_system_frontend/src/components/bookings/BookingModal.tsx`](../booking_system_frontend/src/components/bookings/BookingModal.tsx)

1. Add `Baby` icon import (line 4):
```typescript
import { Plane, Calendar, Clock, DollarSign, Baby } from 'lucide-react';
```

2. Add state for infant selection (after line 20):
```typescript
const [hasInfant, setHasInfant] = useState(false);
```

3. Update `handleConfirmBooking` to include `has_infant` (line 50):
```typescript
const result = await bookFlight({
  user_id: user.user_id,
  name: user.name,
  flight_id: flight.flight_id,
  seat_class: seatClass,
  has_infant: hasInfant,  // Add this line
});
```

4. Update success message (line 62):
```typescript
toast.success(
  hasInfant 
    ? 'Flight booked successfully with infant!' 
    : 'Flight booked successfully!'
);
```

5. Add infant selection UI (after seat class section, before passenger info):
```typescript
{/* Infant Selection */}
<div className="glass-card p-4 bg-white/5">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Baby className="text-cosmic-purple" size={20} />
      <h4 className="text-sm font-semibold text-star-white">
        Traveling with Infant?
      </h4>
    </div>
  </div>
  
  <p className="text-xs text-star-white/60 mb-3">
    Lap infant under 2 years (free, no seat required)
  </p>
  
  <button
    onClick={() => setHasInfant(!hasInfant)}
    className={`w-full p-3 rounded-lg border transition-all ${
      hasInfant
        ? 'border-cosmic-purple bg-cosmic-purple/20 text-star-white'
        : 'border-white/10 bg-white/5 text-star-white/60 hover:border-white/20'
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">
        {hasInfant ? '✓ Infant included' : 'Add infant to booking'}
      </span>
      <span className="text-xs text-alien-green font-semibold">
        FREE
      </span>
    </div>
  </button>
</div>
```

6. Update total price section to show infant info (line 165):
```typescript
<div className="flex items-center justify-between p-4 glass-card bg-cosmic-gradient">
  <div className="flex items-center gap-2">
    <DollarSign className="text-white" size={24} />
    <div>
      <span className="text-white font-semibold">Total Price</span>
      {hasInfant && (
        <p className="text-xs text-white/80">+ 1 infant (free)</p>
      )}
    </div>
  </div>
  <span className="text-2xl font-bold text-white">
    {formatCurrency(price)}
  </span>
</div>
```

**Verification**: Component should compile without errors.

#### Step 9: Update BookingCard Component (15 min)
**File**: [`booking_system_frontend/src/components/bookings/BookingCard.tsx`](../booking_system_frontend/src/components/bookings/BookingCard.tsx)

1. Add `Baby` icon import:
```typescript
import { Baby } from 'lucide-react';
```

2. Add infant badge in badges row (after seat class badge):
```typescript
{/* Infant badge */}
{booking.has_infant && (
  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-cosmic-purple/20 border border-cosmic-purple/30">
    <Baby size={14} className="text-cosmic-purple" />
    <span className="text-xs text-cosmic-purple font-medium">
      + Infant
    </span>
  </div>
)}
```

**Verification**: Component should compile without errors.

#### Step 10: Test Frontend (5 min)

1. Start frontend development server:
```bash
cd booking_system_frontend
npm run dev
```

2. Open browser to `http://localhost:5173`

3. Test booking flow:
   - Navigate to Flights page
   - Select a flight and seat class
   - Toggle infant selection on/off
   - Confirm booking
   - Navigate to My Bookings
   - Verify infant badge appears on booking card

**Expected**: Infant toggle works, booking succeeds, badge displays correctly.

### Phase 3: Testing & Verification (30 minutes)

#### Step 11: Backend Unit Tests (15 min)
**File**: [`booking_system_backend/tests/test_services.py`](../booking_system_backend/tests/test_services.py)

Add test cases:
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

Run tests:
```bash
cd booking_system_backend
pytest tests/test_services.py -v
```

**Expected**: All tests pass.

#### Step 12: Integration Testing (15 min)

Test complete user flow:

1. **Book flight without infant**:
   - Select flight
   - Choose seat class
   - Leave infant toggle off
   - Confirm booking
   - Verify booking appears without infant badge

2. **Book flight with infant**:
   - Select different flight
   - Choose seat class
   - Toggle infant on
   - Verify "FREE" indicator shows
   - Confirm booking
   - Verify success message mentions infant
   - Verify booking appears with infant badge

3. **Cancel booking with infant**:
   - Cancel the infant booking
   - Verify cancellation works normally
   - Verify seat is restored

4. **Edge cases**:
   - Try booking with infant when no seats available (should fail)
   - Verify infant doesn't affect seat availability count

**Expected**: All flows work correctly, infant flag persists through booking lifecycle.

## Rollback Plan

If issues occur:

1. **Backend rollback**:
   - Restore database backup
   - Revert code changes in git
   - Restart server

2. **Frontend rollback**:
   - Revert code changes in git
   - Clear browser cache
   - Restart dev server

## Post-Implementation

### Documentation Updates
- [ ] Update API documentation with `has_infant` parameter
- [ ] Update user guide with infant booking instructions
- [ ] Document pricing policy for infants

### Monitoring
- [ ] Monitor booking success rates
- [ ] Track infant booking usage
- [ ] Watch for any error patterns

### Future Enhancements
- Add infant age validation (under 2 years)
- Support multiple infants per booking
- Add infant meal preferences
- Generate infant-specific boarding passes

## Common Issues & Solutions

### Issue: Database schema mismatch
**Solution**: Delete database file and restart server to recreate with new schema.

### Issue: TypeScript compilation errors
**Solution**: Ensure all interfaces are updated consistently. Run `npm run build` to identify issues.

### Issue: Infant badge not showing
**Solution**: Check that backend returns `has_infant` field. Verify frontend types match backend schema.

### Issue: Booking fails with infant
**Solution**: Check backend logs for errors. Verify `has_infant` parameter is being passed correctly.

## Success Criteria

- ✅ Backend accepts `has_infant` parameter
- ✅ Database stores infant flag correctly
- ✅ Frontend displays infant selection UI
- ✅ Infant bookings are free (no price change)
- ✅ Infants don't consume seats
- ✅ Infant badge displays on booking cards
- ✅ All tests pass
- ✅ No breaking changes to existing functionality

## Estimated Time
- **Backend**: 60 minutes
- **Frontend**: 45 minutes
- **Testing**: 30 minutes
- **Total**: ~2.5 hours

## Support
For issues during implementation, refer to:
- Backend plan: [`plans/01-backend-implementation.md`](./01-backend-implementation.md)
- Frontend plan: [`plans/02-frontend-implementation.md`](./02-frontend-implementation.md)
- Project architecture: [`AGENTS.md`](../AGENTS.md)