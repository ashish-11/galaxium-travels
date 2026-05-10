# Implementation Guide: Modify Booking Feature

## Overview
This guide provides step-by-step instructions for implementing the booking modification feature across the full stack. Follow the order specified to ensure dependencies are met at each stage.

## Prerequisites
- Backend server running on port 8080
- Frontend development server on port 5173
- Database initialized with seed data
- All existing tests passing

## Phase 1: Backend Implementation

### Step 1: Update Schemas (15 minutes)

**File:** [`booking_system_backend/schemas.py`](booking_system_backend/schemas.py:1)

**Action:** Add new schema classes after line 63

```python
class ModifyBookingRequest(BaseModel):
    booking_id: int
    new_seat_class: str  # 'economy', 'business', or 'galaxium'
    has_infant: bool


class ModifyBookingResponse(BaseModel):
    booking: BookingOut
    price_difference: int  # Positive = additional charge, Negative = refund
    old_seat_class: str
    new_seat_class: str
    
    class Config:
        from_attributes = True
```

**Verification:**
```bash
cd booking_system_backend
python -c "from schemas import ModifyBookingRequest, ModifyBookingResponse; print('Schemas imported successfully')"
```

### Step 2: Implement Service Function (45 minutes)

**File:** [`booking_system_backend/services/booking.py`](booking_system_backend/services/booking.py:1)

**Action:** Add function after [`cancel_booking()`](booking_system_backend/services/booking.py:76) (after line 103)

```python
def modify_booking(db: Session, booking_id: int, new_seat_class: str, has_infant: bool) -> ModifyBookingResponse | ErrorResponse:
    """Modify an existing booking's seat class and/or infant status.
    
    Handles seat availability updates and calculates price differences.
    """
    from schemas import ModifyBookingResponse
    
    # Validate seat_class
    valid_classes = ['economy', 'business', 'galaxium']
    if new_seat_class not in valid_classes:
        return ErrorResponse(
            error="Invalid seat class",
            error_code="INVALID_SEAT_CLASS",
            details=f"Seat class must be one of: {', '.join(valid_classes)}. Received: '{new_seat_class}'"
        )
    
    # Check booking exists
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        return ErrorResponse(
            error="Booking not found",
            error_code="BOOKING_NOT_FOUND",
            details=f"Booking with ID {booking_id} not found. Please verify the booking_id."
        )
    
    # Check booking is modifiable
    if booking.status != "booked":
        return ErrorResponse(
            error="Booking cannot be modified",
            error_code="BOOKING_NOT_MODIFIABLE",
            details=f"Only active bookings can be modified. Current status: '{booking.status}'"
        )
    
    # Get flight
    flight = db.query(Flight).filter(Flight.flight_id == booking.flight_id).first()
    if not flight:
        return ErrorResponse(
            error="Flight not found",
            error_code="FLIGHT_NOT_FOUND",
            details=f"Associated flight {booking.flight_id} not found. Data integrity issue."
        )
    
    # Store old values for response
    old_seat_class = booking.seat_class
    
    # Calculate prices
    def get_price(seat_class: str) -> int:
        if seat_class == 'economy':
            return flight.base_price
        elif seat_class == 'business':
            return flight.base_price * 2
        elif seat_class == 'galaxium':
            return flight.base_price * 5
        return flight.base_price
    
    old_price = get_price(old_seat_class)
    new_price = get_price(new_seat_class)
    price_difference = new_price - old_price
    
    # Handle seat class change
    if new_seat_class != old_seat_class:
        # Check new class availability
        new_seats_field = f"{new_seat_class}_seats_available"
        available_seats = getattr(flight, new_seats_field)
        
        if available_seats < 1:
            return ErrorResponse(
                error=f"No {new_seat_class} seats available",
                error_code="NO_SEATS_AVAILABLE",
                details=f"All {new_seat_class} class seats are booked. Please choose a different class."
            )
        
        # Restore seat to old class
        old_seats_field = f"{old_seat_class}_seats_available"
        current_old_seats = getattr(flight, old_seats_field)
        setattr(flight, old_seats_field, current_old_seats + 1)
        
        # Consume seat from new class
        setattr(flight, new_seats_field, available_seats - 1)
        
        # Update booking
        booking.seat_class = new_seat_class
    
    # Update infant status (independent of seat class)
    booking.has_infant = has_infant
    
    # Commit changes
    db.commit()
    db.refresh(booking)
    
    # Build response
    response = ModifyBookingResponse(
        booking=BookingOut.model_validate(booking),
        price_difference=price_difference,
        old_seat_class=old_seat_class,
        new_seat_class=new_seat_class
    )
    
    return response
```

**Verification:**
```bash
cd booking_system_backend
python -c "from services.booking import modify_booking; print('Service function imported successfully')"
```

### Step 3: Add REST Endpoint (15 minutes)

**File:** [`booking_system_backend/server.py`](booking_system_backend/server.py:1)

**Action:** Add endpoint after line 165 (after cancel endpoint)

```python
@app.put("/modify/{booking_id}")
async def modify_booking_endpoint(
    booking_id: int,
    request: ModifyBookingRequest,
    db: Session = Depends(get_db)
) -> Union[ModifyBookingResponse, ErrorResponse]:
    """Modify an existing booking's seat class and infant status."""
    result = booking.modify_booking(
        db, 
        booking_id, 
        request.new_seat_class, 
        request.has_infant
    )
    return result
```

**Import Update:** Add to imports at top of file (line 10):
```python
from schemas import FlightOut, BookingOut, UserOut, ErrorResponse, BookingRequest, UserRegistration, ModifyBookingRequest, ModifyBookingResponse
```

**Verification:**
```bash
# Server should restart automatically
# Check logs for "Application startup complete"
curl http://localhost:8080/
```

### Step 4: Add MCP Tool (15 minutes)

**File:** [`booking_system_backend/server.py`](booking_system_backend/server.py:1)

**Action:** Add tool after line 77 (after cancel_booking tool)

```python
@mcp.tool()
def modify_booking(booking_id: int, new_seat_class: str, has_infant: bool) -> ModifyBookingResponse:
    """Modify an existing booking's seat class and/or infant status.
    
    Args:
        booking_id: The booking ID to modify
        new_seat_class: New seat class - 'economy', 'business', or 'galaxium'
        has_infant: Whether booking includes a lap infant (free, no seat)
    
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

**Verification:**
```bash
# Check MCP server logs for tool registration
# Look for "modify_booking" in tool list
```

### Step 5: Write Unit Tests (45 minutes)

**File:** [`booking_system_backend/tests/test_services.py`](booking_system_backend/tests/test_services.py:1)

**Action:** Add tests at end of file

```python
def test_modify_booking_upgrade_class(db_session):
    """Test upgrading from economy to business class."""
    # Create test booking
    result = booking.book_flight(db_session, 1, "Alice Johnson", 1, "economy", False)
    assert isinstance(result, BookingOut)
    booking_id = result.booking_id
    
    # Modify to business
    modify_result = booking.modify_booking(db_session, booking_id, "business", False)
    assert not isinstance(modify_result, ErrorResponse)
    assert modify_result.booking.seat_class == "business"
    assert modify_result.old_seat_class == "economy"
    assert modify_result.new_seat_class == "business"
    assert modify_result.price_difference > 0  # Should cost more


def test_modify_booking_downgrade_class(db_session):
    """Test downgrading from galaxium to economy class."""
    result = booking.book_flight(db_session, 1, "Alice Johnson", 1, "galaxium", False)
    assert isinstance(result, BookingOut)
    booking_id = result.booking_id
    
    modify_result = booking.modify_booking(db_session, booking_id, "economy", False)
    assert not isinstance(modify_result, ErrorResponse)
    assert modify_result.booking.seat_class == "economy"
    assert modify_result.price_difference < 0  # Should get refund


def test_modify_booking_add_infant(db_session):
    """Test adding infant without changing class."""
    result = booking.book_flight(db_session, 1, "Alice Johnson", 1, "economy", False)
    assert isinstance(result, BookingOut)
    booking_id = result.booking_id
    
    modify_result = booking.modify_booking(db_session, booking_id, "economy", True)
    assert not isinstance(modify_result, ErrorResponse)
    assert modify_result.booking.has_infant is True
    assert modify_result.price_difference == 0  # No price change


def test_modify_booking_not_found(db_session):
    """Test modifying non-existent booking."""
    result = booking.modify_booking(db_session, 99999, "business", False)
    assert isinstance(result, ErrorResponse)
    assert result.error_code == "BOOKING_NOT_FOUND"


def test_modify_booking_already_cancelled(db_session):
    """Test modifying cancelled booking."""
    result = booking.book_flight(db_session, 1, "Alice Johnson", 1, "economy", False)
    assert isinstance(result, BookingOut)
    booking_id = result.booking_id
    
    # Cancel it
    booking.cancel_booking(db_session, booking_id)
    
    # Try to modify
    modify_result = booking.modify_booking(db_session, booking_id, "business", False)
    assert isinstance(modify_result, ErrorResponse)
    assert modify_result.error_code == "BOOKING_NOT_MODIFIABLE"


def test_modify_booking_no_seats_available(db_session):
    """Test modifying when target class is full."""
    # Book all business seats (assume 2 available)
    booking.book_flight(db_session, 1, "Alice Johnson", 1, "business", False)
    booking.book_flight(db_session, 2, "Bob Smith", 1, "business", False)
    
    # Try to upgrade economy to business
    result = booking.book_flight(db_session, 1, "Alice Johnson", 2, "economy", False)
    assert isinstance(result, BookingOut)
    
    modify_result = booking.modify_booking(db_session, result.booking_id, "business", False)
    assert isinstance(modify_result, ErrorResponse)
    assert modify_result.error_code == "NO_SEATS_AVAILABLE"


def test_modify_booking_invalid_seat_class(db_session):
    """Test modifying with invalid seat class."""
    result = booking.book_flight(db_session, 1, "Alice Johnson", 1, "economy", False)
    assert isinstance(result, BookingOut)
    
    modify_result = booking.modify_booking(db_session, result.booking_id, "first_class", False)
    assert isinstance(modify_result, ErrorResponse)
    assert modify_result.error_code == "INVALID_SEAT_CLASS"
```

**Run Tests:**
```bash
cd booking_system_backend
pytest tests/test_services.py::test_modify_booking_upgrade_class -v
pytest tests/test_services.py::test_modify_booking_downgrade_class -v
pytest tests/test_services.py::test_modify_booking_add_infant -v
pytest tests/test_services.py::test_modify_booking_not_found -v
pytest tests/test_services.py::test_modify_booking_already_cancelled -v
pytest tests/test_services.py::test_modify_booking_no_seats_available -v
pytest tests/test_services.py::test_modify_booking_invalid_seat_class -v
```

**Expected:** All tests pass ✓

## Phase 2: Frontend Implementation

### Step 6: Update Type Definitions (10 minutes)

**File:** [`booking_system_frontend/src/types/index.ts`](booking_system_frontend/src/types/index.ts:1)

**Action:** Add interfaces before the "Made with Bob" comment (line 87)

```typescript
export interface ModifyBookingRequest {
  booking_id: number;
  new_seat_class: SeatClass;
  has_infant: boolean;
}

export interface ModifyBookingResponse {
  booking: Booking;
  price_difference: number;
  old_seat_class: SeatClass;
  new_seat_class: SeatClass;
}
```

**Verification:**
```bash
cd booking_system_frontend
npm run build
# Should compile without errors
```

### Step 7: Add API Function (10 minutes)

**File:** [`booking_system_frontend/src/services/api.ts`](booking_system_frontend/src/services/api.ts:1)

**Action:** Add function after [`cancelBooking()`](booking_system_frontend/src/services/api.ts:95) (line 102)

```typescript
/**
 * Modify an existing booking
 */
export const modifyBooking = async (
  bookingId: number,
  data: Omit<ModifyBookingRequest, 'booking_id'>
): Promise<ModifyBookingResponse | ErrorResponse> => {
  const response = await api.put<ModifyBookingResponse | ErrorResponse>(
    `/modify/${bookingId}`,
    {
      booking_id: bookingId,
      ...data
    }
  );
  return response.data;
};
```

**Import Update:** Add to imports (line 2):
```typescript
import type {
  Flight,
  Booking,
  User,
  BookingRequest,
  UserRegistration,
  ErrorResponse,
  ModifyBookingRequest,
  ModifyBookingResponse,
} from '../types';
```

**Verification:**
```bash
npm run build
# Should compile without errors
```

### Step 8: Create ModifyBookingModal Component (90 minutes)

**File:** `booking_system_frontend/src/components/bookings/ModifyBookingModal.tsx` (NEW)

**Action:** Create new file with full component implementation

```typescript
import { useState, useEffect } from 'react';
import type { Booking, Flight, SeatClass, ModifyBookingResponse } from '../../types';
import { Modal, Button } from '../common';
import { modifyBooking, isErrorResponse } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Baby, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface ModifyBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  flight: Flight;
  onModifySuccess: () => void;
}

export const ModifyBookingModal = ({
  isOpen,
  onClose,
  booking,
  flight,
  onModifySuccess,
}: ModifyBookingModalProps) => {
  const [selectedClass, setSelectedClass] = useState<SeatClass>(booking.seat_class);
  const [hasInfant, setHasInfant] = useState<boolean>(booking.has_infant);
  const [isModifying, setIsModifying] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedClass(booking.seat_class);
      setHasInfant(booking.has_infant);
      setShowConfirmation(false);
    }
  }, [isOpen, booking]);

  const getPrice = (seatClass: SeatClass): number => {
    switch (seatClass) {
      case 'economy':
        return flight.economy_price;
      case 'business':
        return flight.business_price;
      case 'galaxium':
        return flight.galaxium_price;
    }
  };

  const getSeatsAvailable = (seatClass: SeatClass): number => {
    switch (seatClass) {
      case 'economy':
        return flight.economy_seats_available;
      case 'business':
        return flight.business_seats_available;
      case 'galaxium':
        return flight.galaxium_seats_available;
    }
  };

  const oldPrice = getPrice(booking.seat_class);
  const newPrice = getPrice(selectedClass);
  const priceDifference = newPrice - oldPrice;

  const hasChanges = selectedClass !== booking.seat_class || hasInfant !== booking.has_infant;

  const seatClassOptions = [
    {
      value: 'economy' as SeatClass,
      label: 'Economy',
      icon: '💺',
      color: 'blue',
      description: 'Standard comfort',
    },
    {
      value: 'business' as SeatClass,
      label: 'Business',
      icon: '🛋️',
      color: 'purple',
      description: 'Premium experience',
    },
    {
      value: 'galaxium' as SeatClass,
      label: 'Galaxium',
      icon: '👑',
      color: 'yellow',
      description: 'Ultimate luxury',
    },
  ];

  const handlePreview = () => {
    if (!hasChanges) {
      toast.error('No changes to preview');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setIsModifying(true);

    try {
      const result = await modifyBooking(booking.booking_id, {
        new_seat_class: selectedClass,
        has_infant: hasInfant,
      });

      if (isErrorResponse(result)) {
        toast.error(result.details || result.error);
        return;
      }

      toast.success('Booking modified successfully!');
      onModifySuccess();
    } catch (error: any) {
      toast.error(error.details || error.error || 'Failed to modify booking');
    } finally {
      setIsModifying(false);
    }
  };

  const getPriceDifferenceDisplay = () => {
    if (priceDifference === 0) {
      return (
        <div className="flex items-center gap-2 text-star-white/60">
          <Minus size={20} />
          <span>No price change</span>
        </div>
      );
    } else if (priceDifference > 0) {
      return (
        <div className="flex items-center gap-2 text-red-400">
          <TrendingUp size={20} />
          <span>Additional charge: {formatCurrency(priceDifference)}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-green-400">
          <TrendingDown size={20} />
          <span>Refund: {formatCurrency(Math.abs(priceDifference))}</span>
        </div>
      );
    }
  };

  if (showConfirmation) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Confirm Modification" size="md">
        <div className="space-y-6">
          <div className="glass-card p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-star-white/60">Current Class:</span>
              <span className="text-star-white font-semibold capitalize">{booking.seat_class}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-star-white/60">New Class:</span>
              <span className="text-star-white font-semibold capitalize">{selectedClass}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-star-white/60">Infant:</span>
              <span className="text-star-white font-semibold">
                {hasInfant ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="flex justify-between mb-2">
                <span className="text-star-white/60">Current Price:</span>
                <span className="text-star-white">{formatCurrency(oldPrice)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-star-white/60">New Price:</span>
                <span className="text-star-white">{formatCurrency(newPrice)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                {getPriceDifferenceDisplay()}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmation(false)}
              className="flex-1"
              disabled={isModifying}
            >
              Back
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1"
              isLoading={isModifying}
            >
              Confirm Changes
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modify Booking" size="lg">
      <div className="space-y-6">
        {/* Current Booking Info */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-star-white/60 mb-2">Current Booking</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-star-white font-semibold">
                {flight.origin} → {flight.destination}
              </p>
              <p className="text-sm text-star-white/60">Booking #{booking.booking_id}</p>
            </div>
            <div className="text-right">
              <p className="text-star-white font-semibold capitalize">{booking.seat_class}</p>
              <p className="text-sm text-star-white/60">{formatCurrency(oldPrice)}</p>
            </div>
          </div>
        </div>

        {/* Seat Class Selection */}
        <div>
          <h3 className="text-sm font-semibold text-star-white mb-3">Select New Class</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {seatClassOptions.map((option) => {
              const available = getSeatsAvailable(option.value);
              const isDisabled = available === 0 && option.value !== booking.seat_class;
              const isSelected = selectedClass === option.value;

              return (
                <motion.button
                  key={option.value}
                  whileHover={!isDisabled ? { scale: 1.02 } : {}}
                  whileTap={!isDisabled ? { scale: 0.98 } : {}}
                  onClick={() => !isDisabled && setSelectedClass(option.value)}
                  disabled={isDisabled}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${isSelected
                      ? `border-${option.color}-500 bg-${option.color}-500/10`
                      : 'border-white/10 bg-white/5'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/30'}
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{option.icon}</span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-cosmic-gradient flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <h4 className="text-star-white font-semibold mb-1">{option.label}</h4>
                  <p className="text-xs text-star-white/60 mb-2">{option.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-star-white/60">
                      {available} seat{available !== 1 ? 's' : ''} left
                    </span>
                    <span className="text-star-white font-semibold">
                      {formatCurrency(getPrice(option.value))}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Infant Toggle */}
        <div className="glass-card p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Baby className="text-cosmic-purple" size={24} />
              <div>
                <p className="text-star-white font-semibold">Traveling with lap infant</p>
                <p className="text-xs text-star-white/60">Free - no seat required</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={hasInfant}
              onChange={(e) => setHasInfant(e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-cosmic-purple focus:ring-cosmic-purple"
            />
          </label>
        </div>

        {/* Price Summary */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <h3 className="text-sm font-semibold text-star-white/60 mb-3">Price Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-star-white/60">Current Price:</span>
                <span className="text-star-white">{formatCurrency(oldPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-star-white/60">New Price:</span>
                <span className="text-star-white">{formatCurrency(newPrice)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2">
                {getPriceDifferenceDisplay()}
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handlePreview}
            className="flex-1"
            disabled={!hasChanges}
          >
            Preview Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Made with Bob
```

**Verification:**
```bash
npm run build
# Should compile without errors
```

### Step 9: Update BookingCard Component (15 minutes)

**File:** [`booking_system_frontend/src/components/bookings/BookingCard.tsx`](booking_system_frontend/src/components/bookings/BookingCard.tsx:1)

**Action 1:** Update props interface (line 7)

```typescript
interface BookingCardProps {
  booking: Booking;
  flight?: Flight;
  onCancel: (bookingId: number) => void;
  onModify?: (bookingId: number) => void;  // ADD THIS LINE
  isCancelling?: boolean;
}
```

**Action 2:** Update component signature (line 14)

```typescript
export const BookingCard = ({ booking, flight, onCancel, onModify, isCancelling }: BookingCardProps) => {
```

**Action 3:** Add modify button before cancel button (line 157)

```typescript
        {/* Modify Button */}
        {canCancel && onModify && flight && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onModify(booking.booking_id)}
            className="w-full mb-2"
          >
            Modify Booking
          </Button>
        )}

        {/* Cancel Button */}
        {canCancel && (
```

**Verification:**
```bash
npm run build
# Should compile without errors
```

### Step 10: Update MyBookings Page (30 minutes)

**File:** [`booking_system_frontend/src/pages/MyBookings.tsx`](booking_system_frontend/src/pages/MyBookings.tsx:1)

**Action 1:** Add import (line 5)

```typescript
import { ModifyBookingModal } from '../components/bookings/ModifyBookingModal';
```

**Action 2:** Add state variables (after line 20)

```typescript
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [bookingToModify, setBookingToModify] = useState<Booking | null>(null);
  const [flightToModify, setFlightToModify] = useState<Flight | null>(null);
```

**Action 3:** Add handler functions (after line 76)

```typescript
  const handleModifyClick = (bookingId: number) => {
    const booking = bookings.find((b) => b.booking_id === bookingId);
    const flight = booking ? getFlightForBooking(booking) : null;

    if (booking && flight) {
      setBookingToModify(booking);
      setFlightToModify(flight);
      setShowModifyModal(true);
    } else {
      toast.error('Unable to modify booking - flight information not available');
    }
  };

  const handleModifySuccess = () => {
    setShowModifyModal(false);
    setBookingToModify(null);
    setFlightToModify(null);
    loadData();
  };
```

**Action 4:** Update BookingCard components (lines 138 and 162)

```typescript
                  <BookingCard
                    key={booking.booking_id}
                    booking={booking}
                    flight={getFlightForBooking(booking)}
                    onCancel={handleCancelClick}
                    onModify={handleModifyClick}  // ADD THIS
                    isCancelling={cancellingId === booking.booking_id}
                  />
```

**Action 5:** Add modal before closing div (before line 204)

```typescript
      {/* Modify Booking Modal */}
      {showModifyModal && bookingToModify && flightToModify && (
        <ModifyBookingModal
          isOpen={showModifyModal}
          onClose={() => setShowModifyModal(false)}
          booking={bookingToModify}
          flight={flightToModify}
          onModifySuccess={handleModifySuccess}
        />
      )}
```

**Verification:**
```bash
npm run dev
# Open http://localhost:5173 in browser
# Navigate to My Bookings
# Should see "Modify Booking" button on active bookings
```

## Phase 3: Testing & Validation

### Step 11: Manual Testing Checklist

**Test Scenario 1: Upgrade Seat Class**
1. Navigate to My Bookings
2. Click "Modify Booking" on an economy booking
3. Select Business class
4. Click "Preview Changes"
5. Verify price difference shows additional charge
6. Click "Confirm Changes"
7. Verify success toast appears
8. Verify booking card updates to show Business class

**Test Scenario 2: Downgrade Seat Class**
1. Click "Modify Booking" on a business booking
2. Select Economy class
3. Verify price difference shows refund
4. Confirm changes
5. Verify booking updates

**Test Scenario 3: Add Infant**
1. Click "Modify Booking"
2. Toggle infant checkbox ON
3. Keep same seat class
4. Verify price difference is 0
5. Confirm changes
6. Verify infant badge appears on booking card

**Test Scenario 4: No Seats Available**
1. Book all seats in a class (use multiple users)
2. Try to modify to that class
3. Verify class option is disabled
4. Verify cannot select disabled option

**Test Scenario 5: Cancel During Modification**
1. Open modify modal
2. Make changes
3. Click "Cancel" button
4. Verify modal closes
5. Verify no changes applied

### Step 12: Backend Test Execution

```bash
cd booking_system_backend
pytest tests/test_services.py -v
# All tests should pass including new modify_booking tests
```

### Step 13: Integration Testing

**Test API Endpoint:**
```bash
# Get a booking ID first
curl http://localhost:8080/bookings/1

# Modify the booking
curl -X PUT http://localhost:8080/modify/1 \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "new_seat_class": "business",
    "has_infant": true
  }'
```

**Expected Response:**
```json
{
  "booking": {
    "booking_id": 1,
    "user_id": 1,
    "flight_id": 1,
    "seat_class": "business",
    "status": "booked",
    "booking_time": "...",
    "has_infant": true
  },
  "price_difference": 500,
  "old_seat_class": "economy",
  "new_seat_class": "business"
}
```

## Phase 4: Documentation & Deployment

### Step 14: Update README

Add to project README:

```markdown
## Modify Booking Feature

Users can modify their active bookings to:
- Change seat class (Economy ↔ Business ↔ Galaxium)
- Add or remove lap infant
- View price differences before confirming

### API Endpoint
PUT `/modify/{booking_id}`

Request body:
{
  "booking_id": number,
  "new_seat_class": "economy" | "business" | "galaxium",
  "has_infant": boolean
}

### MCP Tool
`modify_booking(booking_id, new_seat_class, has_infant)`
```

### Step 15: Create Internal Monologue

**File:** `internal-monologue/2026-05-10_modify-booking-feature-planning.md`

Document the planning process and key decisions made.

## Troubleshooting

### Common Issues

**Issue:** "No seats available" error when seats should be available
- **Solution:** Check if seat restoration logic is working correctly in service function
- **Debug:** Add logging to track seat count changes

**Issue:** Price difference calculation incorrect
- **Solution:** Verify price multipliers match between frontend and backend
- **Debug:** Log old_price and new_price in service function

**Issue:** Modal doesn't close after successful modification
- **Solution:** Ensure `onModifySuccess()` callback is called
- **Debug:** Check browser console for errors

**Issue:** Tests failing with database errors
- **Solution:** Ensure test database is properly seeded
- **Debug:** Run `pytest tests/test_services.py::test_modify_booking_upgrade_class -v -s`

## Success Criteria

✅ All backend tests pass
✅ API endpoint returns correct responses
✅ Frontend compiles without errors
✅ Modal opens and displays correctly
✅ Seat class changes update database
✅ Price calculations are accurate
✅ Infant toggle works independently
✅ Error handling displays appropriate messages
✅ Success toast appears after modification
✅ Booking list refreshes with updated data

## Estimated Time

- Backend Implementation: 2-3 hours
- Frontend Implementation: 3-4 hours
- Testing & Validation: 1-2 hours
- **Total: 6-9 hours**

## Next Steps

After successful implementation:
1. Add analytics tracking for modifications
2. Implement email notifications for booking changes
3. Add modification history tracking
4. Consider payment processing integration for price differences
5. Add admin dashboard for monitoring modifications