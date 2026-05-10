# Frontend Implementation Plan: Seat Classes UI/UX

## Overview
Update the React frontend to support seat class selection with visual differentiation and pricing display for Economy, Business, and Galaxium classes.

---

## TypeScript Type Updates

### 1. Update Type Definitions
**File**: [`booking_system_frontend/src/types/index.ts`](../booking_system_frontend/src/types/index.ts)

**Update Flight interface**:
```typescript
export interface Flight {
  flight_id: number;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;  // Changed from 'price'
  economy_price: number;  // NEW
  business_price: number;  // NEW
  galaxium_price: number;  // NEW
  total_seats: number;  // Changed from 'seats_available'
  economy_seats_available: number;  // NEW
  business_seats_available: number;  // NEW
  galaxium_seats_available: number;  // NEW
}
```

**Update Booking interface**:
```typescript
export interface Booking {
  booking_id: number;
  user_id: number;
  flight_id: number;
  seat_class: 'economy' | 'business' | 'galaxium';  // NEW
  status: 'booked' | 'cancelled' | 'completed';
  booking_time: string;
}
```

**Update BookingRequest interface**:
```typescript
export interface BookingRequest {
  user_id: number;
  name: string;
  flight_id: number;
  seat_class: 'economy' | 'business' | 'galaxium';  // NEW
}
```

**Add new type for seat class selection**:
```typescript
export type SeatClass = 'economy' | 'business' | 'galaxium';

export interface SeatClassOption {
  value: SeatClass;
  label: string;
  description: string;
  priceMultiplier: number;
  icon: string;  // Emoji or icon identifier
}
```

---

## Component Updates

### 2. Update FlightCard Component
**File**: [`booking_system_frontend/src/components/flights/FlightCard.tsx`](../booking_system_frontend/src/components/flights/FlightCard.tsx)

**Changes Required**:
- Display all three seat classes with individual pricing
- Show availability for each class
- Visual indicators for class tiers (colors, icons)
- Update "Book Now" button to open seat class selector

**New Structure**:
```typescript
export const FlightCard = ({ flight, onBook }: FlightCardProps) => {
  const [selectedClass, setSelectedClass] = useState<SeatClass | null>(null);
  
  const seatClasses = [
    {
      type: 'economy' as SeatClass,
      label: 'Economy',
      price: flight.economy_price,
      available: flight.economy_seats_available,
      icon: '💺',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      type: 'business' as SeatClass,
      label: 'Business',
      price: flight.business_price,
      available: flight.business_seats_available,
      icon: '🛋️',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      type: 'galaxium' as SeatClass,
      label: 'Galaxium',
      price: flight.galaxium_price,
      available: flight.galaxium_seats_available,
      icon: '👑',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    }
  ];
  
  const totalAvailable = flight.economy_seats_available + 
                         flight.business_seats_available + 
                         flight.galaxium_seats_available;
  
  return (
    <Card>
      {/* Route Header - unchanged */}
      
      {/* Flight Details - unchanged */}
      
      {/* NEW: Seat Class Selection */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-semibold text-star-white/80">
          Select Class
        </h4>
        {seatClasses.map((seatClass) => (
          <button
            key={seatClass.type}
            onClick={() => setSelectedClass(seatClass.type)}
            disabled={seatClass.available === 0}
            className={`w-full p-3 rounded-lg border-2 transition-all ${
              selectedClass === seatClass.type
                ? 'border-cosmic-purple bg-cosmic-purple/20'
                : 'border-white/10 hover:border-white/30'
            } ${seatClass.available === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{seatClass.icon}</span>
                <div className="text-left">
                  <p className={`font-semibold ${seatClass.color}`}>
                    {seatClass.label}
                  </p>
                  <p className="text-xs text-star-white/60">
                    {seatClass.available} seats available
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-star-white">
                  {formatCurrency(seatClass.price)}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {/* Book Button */}
      <Button
        onClick={() => selectedClass && onBook(flight, selectedClass)}
        disabled={!selectedClass || totalAvailable === 0}
        className="w-full"
      >
        {totalAvailable === 0 ? 'Sold Out' : 
         !selectedClass ? 'Select a Class' : 
         `Book ${selectedClass.charAt(0).toUpperCase() + selectedClass.slice(1)}`}
      </Button>
    </Card>
  );
};
```

### 3. Update BookingModal Component
**File**: [`booking_system_frontend/src/components/bookings/BookingModal.tsx`](../booking_system_frontend/src/components/bookings/BookingModal.tsx)

**Changes Required**:
- Accept `seatClass` parameter
- Display selected class in confirmation
- Show class-specific pricing
- Pass `seat_class` to API

**Updated Interface**:
```typescript
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: Flight | null;
  seatClass: SeatClass | null;  // NEW
  onConfirm: (flightId: number, seatClass: SeatClass) => void;  // Updated
}
```

**Modal Content Updates**:
```typescript
<div className="space-y-4">
  {/* Flight Details */}
  <div>
    <h3 className="text-xl font-bold">
      {flight.origin} → {flight.destination}
    </h3>
  </div>
  
  {/* NEW: Selected Class Display */}
  <div className="p-4 rounded-lg bg-cosmic-gradient/20 border border-white/10">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-star-white/60">Selected Class</p>
        <p className="text-lg font-bold text-cosmic-purple">
          {seatClass?.charAt(0).toUpperCase() + seatClass?.slice(1)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm text-star-white/60">Price</p>
        <p className="text-2xl font-bold text-alien-green">
          {formatCurrency(
            seatClass === 'economy' ? flight.economy_price :
            seatClass === 'business' ? flight.business_price :
            flight.galaxium_price
          )}
        </p>
      </div>
    </div>
  </div>
  
  {/* Departure/Arrival times - unchanged */}
  
  {/* Confirm Button */}
  <Button
    onClick={() => onConfirm(flight.flight_id, seatClass!)}
    className="w-full"
  >
    Confirm Booking
  </Button>
</div>
```

### 4. Update BookingCard Component
**File**: [`booking_system_frontend/src/components/bookings/BookingCard.tsx`](../booking_system_frontend/src/components/bookings/BookingCard.tsx)

**Changes Required**:
- Display seat class badge
- Show class-specific pricing
- Visual differentiation by class

**Add Class Badge**:
```typescript
const getClassBadge = (seatClass: SeatClass) => {
  const badges = {
    economy: { icon: '💺', label: 'Economy', color: 'bg-blue-500/20 text-blue-400' },
    business: { icon: '🛋️', label: 'Business', color: 'bg-purple-500/20 text-purple-400' },
    galaxium: { icon: '👑', label: 'Galaxium', color: 'bg-yellow-500/20 text-yellow-400' }
  };
  
  const badge = badges[seatClass];
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
      <span>{badge.icon}</span>
      {badge.label}
    </span>
  );
};

// In component render:
<div className="flex items-center justify-between mb-2">
  <h3 className="text-lg font-bold">
    {booking.flight?.origin} → {booking.flight?.destination}
  </h3>
  {getClassBadge(booking.seat_class)}
</div>
```

---

## Page Updates

### 5. Update Flights Page
**File**: [`booking_system_frontend/src/pages/Flights.tsx`](../booking_system_frontend/src/pages/Flights.tsx)

**Changes Required**:
- Update state to track selected seat class
- Pass seat class to booking modal
- Update booking API call

**State Updates**:
```typescript
const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
const [selectedSeatClass, setSelectedSeatClass] = useState<SeatClass | null>(null);  // NEW
const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

const handleBookClick = (flight: Flight, seatClass: SeatClass) => {
  setSelectedFlight(flight);
  setSelectedSeatClass(seatClass);  // NEW
  setIsBookingModalOpen(true);
};

const handleConfirmBooking = async (flightId: number, seatClass: SeatClass) => {
  if (!user) return;
  
  try {
    await api.post('/bookings', {
      user_id: user.user_id,
      name: user.name,
      flight_id: flightId,
      seat_class: seatClass  // NEW
    });
    
    // Refresh flights to update availability
    fetchFlights();
    setIsBookingModalOpen(false);
    // Show success message
  } catch (error) {
    // Handle error
  }
};
```

**Component Render**:
```typescript
<FlightCard
  key={flight.flight_id}
  flight={flight}
  onBook={handleBookClick}  // Now passes (flight, seatClass)
/>

<BookingModal
  isOpen={isBookingModalOpen}
  onClose={() => setIsBookingModalOpen(false)}
  flight={selectedFlight}
  seatClass={selectedSeatClass}  // NEW
  onConfirm={handleConfirmBooking}
/>
```

### 6. Update MyBookings Page
**File**: [`booking_system_frontend/src/pages/MyBookings.tsx`](../booking_system_frontend/src/pages/MyBookings.tsx)

**Changes Required**:
- Display seat class in booking cards
- Filter by seat class (optional enhancement)
- Show class-specific details

**Optional Filter Addition**:
```typescript
const [classFilter, setClassFilter] = useState<SeatClass | 'all'>('all');

const filteredBookings = bookings.filter(booking => 
  classFilter === 'all' || booking.seat_class === classFilter
);

// Filter UI
<div className="flex gap-2 mb-4">
  <Button onClick={() => setClassFilter('all')}>All</Button>
  <Button onClick={() => setClassFilter('economy')}>Economy</Button>
  <Button onClick={() => setClassFilter('business')}>Business</Button>
  <Button onClick={() => setClassFilter('galaxium')}>Galaxium</Button>
</div>
```

---

## API Service Updates

### 7. Update API Service
**File**: [`booking_system_frontend/src/services/api.ts`](../booking_system_frontend/src/services/api.ts)

**No changes required** - The API service uses generic axios calls, so it will automatically handle the new `seat_class` field in requests and responses.

---

## Styling Enhancements

### 8. Add Class-Specific Styling
**File**: [`booking_system_frontend/src/index.css`](../booking_system_frontend/src/index.css) or component styles

**Add custom colors for seat classes**:
```css
/* Seat Class Colors */
.seat-economy {
  @apply bg-blue-500/10 border-blue-500/30 text-blue-400;
}

.seat-business {
  @apply bg-purple-500/10 border-purple-500/30 text-purple-400;
}

.seat-galaxium {
  @apply bg-yellow-500/10 border-yellow-500/30 text-yellow-400;
}

/* Class badges */
.badge-economy {
  @apply bg-blue-500/20 text-blue-400 border border-blue-500/40;
}

.badge-business {
  @apply bg-purple-500/20 text-purple-400 border border-purple-500/40;
}

.badge-galaxium {
  @apply bg-yellow-500/20 text-yellow-400 border border-yellow-500/40;
}
```

---

## Visual Design Guidelines

### Class Differentiation
- **Economy** 💺: Blue theme, standard icon
- **Business** 🛋️: Purple theme, premium icon
- **Galaxium** 👑: Gold/Yellow theme, luxury icon

### UI Patterns
1. **Flight Cards**: Show all three classes with availability
2. **Selection State**: Clear visual feedback for selected class
3. **Pricing Display**: Prominent, easy to compare
4. **Availability Indicators**: Color-coded (green = available, orange = low, red = sold out)
5. **Booking Confirmation**: Large, clear display of selected class and price

### Responsive Design
- Mobile: Stack seat class options vertically
- Tablet/Desktop: Display in grid or horizontal layout
- Ensure touch targets are adequate (min 44px)

---

## Implementation Order

1. **Types** - Update [`types/index.ts`](../booking_system_frontend/src/types/index.ts)
2. **FlightCard** - Update [`FlightCard.tsx`](../booking_system_frontend/src/components/flights/FlightCard.tsx)
3. **BookingModal** - Update [`BookingModal.tsx`](../booking_system_frontend/src/components/bookings/BookingModal.tsx)
4. **BookingCard** - Update [`BookingCard.tsx`](../booking_system_frontend/src/components/bookings/BookingCard.tsx)
5. **Flights Page** - Update [`Flights.tsx`](../booking_system_frontend/src/pages/Flights.tsx)
6. **MyBookings Page** - Update [`MyBookings.tsx`](../booking_system_frontend/src/pages/MyBookings.tsx)
7. **Styling** - Add custom CSS if needed

---

## Testing Checklist

- [ ] All three seat classes display correctly
- [ ] Prices calculate correctly (1x, 2x, 5x)
- [ ] Seat availability updates after booking
- [ ] Cannot book sold-out classes
- [ ] Selected class persists through booking flow
- [ ] Booking confirmation shows correct class and price
- [ ] My Bookings displays seat class badges
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Error handling for invalid seat class
- [ ] Visual feedback for selection states

---

## Accessibility Considerations

- Use semantic HTML for seat class selection
- Ensure color is not the only indicator (use icons + text)
- Keyboard navigation for seat class selection
- Screen reader announcements for availability changes
- ARIA labels for interactive elements
- Focus management in modal dialogs

// Made with Bob