# Frontend Implementation Plan: Infant Booking Feature

## Overview
Add UI support for booking flights with lap infants (free, no seat consumed, one per adult).

## Type System Updates

### 1. Update TypeScript Interfaces
**File**: [`booking_system_frontend/src/types/index.ts`](../booking_system_frontend/src/types/index.ts:21)

#### Update Booking Interface
```typescript
export interface Booking {
  booking_id: number;
  user_id: number;
  flight_id: number;
  seat_class: SeatClass;
  status: 'booked' | 'cancelled' | 'completed';
  booking_time: string;
  has_infant: boolean;  // New field
}
```

#### Update BookingRequest Interface
```typescript
export interface BookingRequest {
  user_id: number;
  name: string;
  flight_id: number;
  seat_class: SeatClass;
  has_infant: boolean;  // New field
}
```

## API Service Updates

### 2. Update bookFlight Function
**File**: [`booking_system_frontend/src/services/api.ts`](../booking_system_frontend/src/services/api.ts)

Modify the `bookFlight` function to accept `has_infant`:

```typescript
export const bookFlight = async (
  request: BookingRequest
): Promise<Booking | ErrorResponse> => {
  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),  // Now includes has_infant
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return data as ErrorResponse;
    }
    
    return data as Booking;
  } catch (error) {
    return {
      success: false,
      error: 'Network error',
      error_code: 'NETWORK_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
```

## Component Updates

### 3. Update BookingModal Component
**File**: [`booking_system_frontend/src/components/bookings/BookingModal.tsx`](../booking_system_frontend/src/components/bookings/BookingModal.tsx:18)

Add infant selection UI and state management:

```typescript
import { useState } from 'react';
import type { Flight, SeatClass } from '../../types';
import { Modal, Button } from '../common';
import { Plane, Calendar, Clock, DollarSign, Baby } from 'lucide-react';  // Add Baby icon
import { formatCurrency, formatDate, calculateDuration } from '../../utils/formatters';
import { bookFlight, isErrorResponse } from '../../services/api';
import { useUser } from '../../hooks/useUser';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: Flight | null;
  seatClass: SeatClass | null;
  onSuccess: () => void;
}

export const BookingModal = ({ isOpen, onClose, flight, seatClass, onSuccess }: BookingModalProps) => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [hasInfant, setHasInfant] = useState(false);  // New state

  if (!flight || !seatClass) return null;

  // ... existing getSeatClassInfo and classInfo code ...

  const price =
    seatClass === 'economy'
      ? flight.economy_price
      : seatClass === 'business'
      ? flight.business_price
      : flight.galaxium_price;

  const handleConfirmBooking = async () => {
    if (!user) {
      toast.error('Please sign in to book a flight');
      return;
    }

    setIsLoading(true);

    try {
      const result = await bookFlight({
        user_id: user.user_id,
        name: user.name,
        flight_id: flight.flight_id,
        seat_class: seatClass,
        has_infant: hasInfant,  // Include infant flag
      });

      if (isErrorResponse(result)) {
        toast.error(result.details || result.error);
        return;
      }

      toast.success(
        hasInfant 
          ? 'Flight booked successfully with infant!' 
          : 'Flight booked successfully!'
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.details || error.error || 'Failed to book flight');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Your Booking"
      size="md"
    >
      <div className="space-y-6">
        {/* Flight Summary - existing code */}
        
        {/* Selected Seat Class - existing code */}

        {/* NEW: Infant Selection */}
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

        {/* Passenger Info - existing code */}

        {/* Total Price */}
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

        {/* Actions - existing code */}
        
        <p className="text-xs text-star-white/60 text-center">
          By confirming, you agree to our terms and conditions
        </p>
      </div>
    </Modal>
  );
};

// Made with Bob
```

### 4. Update BookingCard Component
**File**: [`booking_system_frontend/src/components/bookings/BookingCard.tsx`](../booking_system_frontend/src/components/bookings/BookingCard.tsx)

Display infant indicator on booking cards:

```typescript
import { Baby } from 'lucide-react';  // Add Baby icon import

// Inside the BookingCard component, add infant indicator:

{/* Add after seat class badge */}
{booking.has_infant && (
  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-cosmic-purple/20 border border-cosmic-purple/30">
    <Baby size={14} className="text-cosmic-purple" />
    <span className="text-xs text-cosmic-purple font-medium">
      + Infant
    </span>
  </div>
)}
```

Full updated component structure:
```typescript
export const BookingCard = ({ booking, flight, onCancel }: BookingCardProps) => {
  // ... existing code ...

  return (
    <Card className="hover:scale-[1.02] transition-transform">
      <div className="space-y-4">
        {/* Header with flight info */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Plane className="text-cosmic-purple" size={20} />
              <h3 className="text-lg font-bold text-star-white">
                {flight?.origin} → {flight?.destination}
              </h3>
            </div>
            
            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              {/* Seat class badge */}
              <div className={`px-3 py-1 rounded-full ${classInfo.bgColor} border border-white/10`}>
                <span className={`text-sm font-medium ${classInfo.color}`}>
                  {classInfo.icon} {classInfo.label}
                </span>
              </div>
              
              {/* NEW: Infant badge */}
              {booking.has_infant && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-cosmic-purple/20 border border-cosmic-purple/30">
                  <Baby size={14} className="text-cosmic-purple" />
                  <span className="text-xs text-cosmic-purple font-medium">
                    + Infant
                  </span>
                </div>
              )}
              
              {/* Status badge */}
              <div className={`px-3 py-1 rounded-full ${statusInfo.bgColor} border border-white/10`}>
                <span className={`text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of existing component code */}
      </div>
    </Card>
  );
};

// Made with Bob
```

## Visual Design Considerations

### Color Scheme
- **Infant indicator**: Use cosmic-purple theme to match existing design
- **Free badge**: Use alien-green to highlight the free benefit
- **Icon**: Baby/infant icon from lucide-react

### UI/UX Guidelines

1. **Booking Modal**:
   - Place infant selection after seat class selection
   - Use toggle button for clear on/off state
   - Show "FREE" prominently to encourage usage
   - Display infant count in total price section

2. **Booking Card**:
   - Show infant badge alongside seat class badge
   - Use compact design to avoid cluttering
   - Make it visually distinct but not overwhelming

3. **Accessibility**:
   - Ensure toggle button has clear focus states
   - Use semantic HTML for screen readers
   - Provide clear labels and descriptions

## Implementation Checklist

- [ ] Update `Booking` interface with `has_infant` field
- [ ] Update `BookingRequest` interface with `has_infant` field
- [ ] Modify `bookFlight` API function (no changes needed, just passes through)
- [ ] Add infant selection UI to `BookingModal`
- [ ] Add infant state management to `BookingModal`
- [ ] Update booking confirmation logic to include `has_infant`
- [ ] Add infant indicator to `BookingCard`
- [ ] Import `Baby` icon from lucide-react
- [ ] Test infant booking flow end-to-end
- [ ] Verify infant indicator displays correctly on booking cards
- [ ] Test with and without infant selections

## Testing Scenarios

1. **Book flight without infant**: Verify existing flow works unchanged
2. **Book flight with infant**: Verify infant flag is sent and stored
3. **View booking with infant**: Verify infant badge displays on card
4. **Cancel booking with infant**: Verify cancellation works normally
5. **Toggle infant selection**: Verify UI updates correctly
6. **Price display**: Verify total shows same price with/without infant

## Backward Compatibility

**Existing Bookings**: Bookings without `has_infant` field will default to `false` in TypeScript, displaying no infant badge.

**API Compatibility**: The frontend sends `has_infant: false` by default, maintaining compatibility with backend.

## Notes

- **No validation needed**: Backend doesn't enforce one-infant-per-booking rule; frontend controls this through UI
- **No price calculation**: Infant is always free, so no price logic changes needed
- **Simple toggle**: Single boolean state, no complex form validation required
- **Visual consistency**: Use existing design system colors and components