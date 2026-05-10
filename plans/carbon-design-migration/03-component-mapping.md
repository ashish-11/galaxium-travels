# Phase 3: Component Migration

## Overview
Detailed mapping of custom components to Carbon Design System components with implementation examples.

## Component Mapping Strategy

### Migration Approach
1. **Parallel Implementation**: Keep existing components while building Carbon versions
2. **Feature Parity**: Ensure Carbon components match current functionality
3. **Gradual Replacement**: Replace components one at a time
4. **Testing**: Validate each component before moving to the next

## Component Mapping Table

| Current Component | Carbon Component | Complexity | Priority |
|------------------|------------------|------------|----------|
| Button | Button | Low | High |
| Card | Tile | Low | High |
| Input | TextInput | Low | High |
| Modal | Modal | Medium | High |
| LoadingSpinner | Loading | Low | Medium |
| Header | HeaderContainer | High | High |
| Footer | (Custom) | Low | Low |
| FlightCard | Tile + Custom | High | High |
| BookingCard | Tile + Custom | High | High |
| UserIdentification | Form + TextInput | Medium | High |

## Detailed Component Migrations

### 1. Button Component

**Current Implementation**: [`booking_system_frontend/src/components/common/Button.tsx`](../../../booking_system_frontend/src/components/common/Button.tsx)

**Carbon Replacement**:
```typescript
// src/components/common/CarbonButton.tsx
import { Button as CarbonButton } from '@carbon/react';
import type { ButtonProps as CarbonButtonProps } from '@carbon/react';

interface ButtonProps extends Omit<CarbonButtonProps, 'kind'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'tertiary';
  isLoading?: boolean;
}

export const Button = ({ 
  variant = 'primary', 
  isLoading = false,
  children,
  disabled,
  ...props 
}: ButtonProps) => {
  const kindMap = {
    primary: 'primary',
    secondary: 'secondary',
    danger: 'danger',
    ghost: 'ghost',
    tertiary: 'tertiary'
  } as const;

  return (
    <CarbonButton
      kind={kindMap[variant]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </CarbonButton>
  );
};
```

**Migration Steps**:
1. Create new `CarbonButton.tsx` alongside existing `Button.tsx`
2. Update imports in one component at a time
3. Test functionality
4. Remove old `Button.tsx` when all references updated

**Props Mapping**:
- `variant="primary"` → `kind="primary"`
- `variant="secondary"` → `kind="secondary"`
- `variant="danger"` → `kind="danger"`
- `size="sm"` → `size="sm"`
- `size="md"` → `size="md"` (default)
- `size="lg"` → `size="lg"`

---

### 2. Card Component

**Current Implementation**: [`booking_system_frontend/src/components/common/Card.tsx`](../../../booking_system_frontend/src/components/common/Card.tsx)

**Carbon Replacement**:
```typescript
// src/components/common/CarbonCard.tsx
import { Tile, ClickableTile } from '@carbon/react';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card = ({ children, className, hover, onClick }: CardProps) => {
  if (onClick) {
    return (
      <ClickableTile className={className} onClick={onClick}>
        {children}
      </ClickableTile>
    );
  }
  
  return (
    <Tile className={className}>
      {children}
    </Tile>
  );
};
```

**Migration Steps**:
1. Replace `Card` with `Tile` or `ClickableTile`
2. Update styling to use Carbon classes
3. Test hover and click interactions
4. Verify glass-card effect with custom CSS

**Custom Styling**:
```scss
// src/carbon-overrides.scss
.cds--tile {
  background: var(--glass-effect);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-4px);
  }
}
```

---

### 3. Input Component

**Current Implementation**: [`booking_system_frontend/src/components/common/Input.tsx`](../../../booking_system_frontend/src/components/common/Input.tsx)

**Carbon Replacement**:
```typescript
// src/components/common/CarbonInput.tsx
import { TextInput } from '@carbon/react';
import type { TextInputProps } from '@carbon/react';

interface InputProps extends Omit<TextInputProps, 'id'> {
  label?: string;
  error?: string;
}

export const Input = ({ 
  label, 
  error, 
  className,
  ...props 
}: InputProps) => {
  return (
    <TextInput
      id={props.name || 'input'}
      labelText={label}
      invalid={!!error}
      invalidText={error}
      className={className}
      {...props}
    />
  );
};
```

**Migration Steps**:
1. Replace custom `Input` with `TextInput`
2. Update form components to use new props
3. Test validation and error states
4. Verify styling matches theme

**Props Mapping**:
- `placeholder` → `placeholder`
- `value` → `value`
- `onChange` → `onChange`
- `error` → `invalid={true}` + `invalidText`
- `label` → `labelText`

---

### 4. Modal Component

**Current Implementation**: [`booking_system_frontend/src/components/common/Modal.tsx`](../../../booking_system_frontend/src/components/common/Modal.tsx)

**Carbon Replacement**:
```typescript
// src/components/common/CarbonModal.tsx
import { Modal as CarbonModal } from '@carbon/react';
import type { ModalProps as CarbonModalProps } from '@carbon/react';

interface ModalProps extends Omit<CarbonModalProps, 'open'> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  ...props 
}: ModalProps) => {
  return (
    <CarbonModal
      open={isOpen}
      onRequestClose={onClose}
      modalHeading={title}
      primaryButtonText="Confirm"
      secondaryButtonText="Cancel"
      {...props}
    >
      {children}
    </CarbonModal>
  );
};
```

**Migration Steps**:
1. Replace custom `Modal` with Carbon `Modal`
2. Update modal usage in booking components
3. Test open/close functionality
4. Verify backdrop and animations

**Props Mapping**:
- `isOpen` → `open`
- `onClose` → `onRequestClose`
- `title` → `modalHeading`

---

### 5. LoadingSpinner Component

**Current Implementation**: [`booking_system_frontend/src/components/common/LoadingSpinner.tsx`](../../../booking_system_frontend/src/components/common/LoadingSpinner.tsx)

**Carbon Replacement**:
```typescript
// src/components/common/CarbonLoading.tsx
import { Loading } from '@carbon/react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  description?: string;
}

export const LoadingSpinner = ({ 
  size = 'md', 
  description = 'Loading...' 
}: LoadingSpinnerProps) => {
  return (
    <Loading
      description={description}
      withOverlay={false}
      small={size === 'sm'}
    />
  );
};
```

**Migration Steps**:
1. Replace custom spinner with Carbon `Loading`
2. Update loading states in pages
3. Test visibility and positioning

---

### 6. Header Component (UI Shell)

**Current Implementation**: [`booking_system_frontend/src/components/layout/Header.tsx`](../../../booking_system_frontend/src/components/layout/Header.tsx)

**Carbon Replacement**:
```typescript
// src/components/layout/CarbonHeader.tsx
import {
  Header,
  HeaderContainer,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent
} from '@carbon/react';
import { User, Logout } from '@carbon/icons-react';
import { useUser } from '../../hooks/useUser';
import { useNavigate } from 'react-router-dom';

export const AppHeader = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  return (
    <HeaderContainer
      render={() => (
        <>
          <Header aria-label="Galaxium Travels">
            <SkipToContent />
            <HeaderName href="/" prefix="">
              🚀 Galaxium Travels
            </HeaderName>
            <HeaderNavigation aria-label="Main Navigation">
              <HeaderMenuItem href="/">Home</HeaderMenuItem>
              <HeaderMenuItem href="/flights">Flights</HeaderMenuItem>
              {user && (
                <HeaderMenuItem href="/bookings">
                  My Bookings
                </HeaderMenuItem>
              )}
            </HeaderNavigation>
            <HeaderGlobalBar>
              {user && (
                <>
                  <HeaderGlobalAction
                    aria-label="User Profile"
                    tooltipAlignment="end"
                  >
                    <User size={20} />
                  </HeaderGlobalAction>
                  <HeaderGlobalAction
                    aria-label="Logout"
                    onClick={logout}
                    tooltipAlignment="end"
                  >
                    <Logout size={20} />
                  </HeaderGlobalAction>
                </>
              )}
            </HeaderGlobalBar>
          </Header>
        </>
      )}
    />
  );
};
```

**Migration Steps**:
1. Create new header using Carbon UI Shell
2. Migrate navigation logic
3. Update routing integration
4. Test responsive behavior
5. Apply custom styling for space theme

**Custom Styling**:
```scss
.cds--header {
  background: var(--glass-effect);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--glass-border);
}

.cds--header__name {
  font-size: 1.25rem;
  font-weight: 700;
  background: var(--cosmic-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

### 7. FlightCard Component

**Current Implementation**: [`booking_system_frontend/src/components/flights/FlightCard.tsx`](../../../booking_system_frontend/src/components/flights/FlightCard.tsx)

**Carbon Replacement**:
```typescript
// src/components/flights/CarbonFlightCard.tsx
import { Tile, Button, RadioButtonGroup, RadioButton } from '@carbon/react';
import { Airplane, Time } from '@carbon/icons-react';
import type { Flight, SeatClass } from '../../types';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';

interface FlightCardProps {
  flight: Flight;
  onBook: (flight: Flight, seatClass: SeatClass) => void;
}

export const FlightCard = ({ flight, onBook }: FlightCardProps) => {
  const [selectedClass, setSelectedClass] = useState<SeatClass | null>(null);

  return (
    <Tile className="flight-card">
      {/* Header */}
      <div className="flight-card__header">
        <Airplane size={24} />
        <div>
          <h3>{flight.origin} → {flight.destination}</h3>
          <p>Flight #{flight.flight_id}</p>
        </div>
      </div>

      {/* Flight Details */}
      <div className="flight-card__details">
        <div>
          <label>Departure</label>
          <p>{formatDate(flight.departure_time)}</p>
          <strong>{formatTime(flight.departure_time)}</strong>
        </div>
        <div>
          <label>Arrival</label>
          <p>{formatDate(flight.arrival_time)}</p>
          <strong>{formatTime(flight.arrival_time)}</strong>
        </div>
      </div>

      {/* Seat Class Selection */}
      <RadioButtonGroup
        legendText="Select Class"
        name="seat-class"
        onChange={(value) => setSelectedClass(value as SeatClass)}
      >
        <RadioButton
          labelText={`Economy - ${formatCurrency(flight.economy_price)}`}
          value="economy"
          disabled={flight.economy_seats_available === 0}
        />
        <RadioButton
          labelText={`Business - ${formatCurrency(flight.business_price)}`}
          value="business"
          disabled={flight.business_seats_available === 0}
        />
        <RadioButton
          labelText={`Galaxium - ${formatCurrency(flight.galaxium_price)}`}
          value="galaxium"
          disabled={flight.galaxium_seats_available === 0}
        />
      </RadioButtonGroup>

      {/* Book Button */}
      <Button
        onClick={() => selectedClass && onBook(flight, selectedClass)}
        disabled={!selectedClass}
        kind="primary"
      >
        Book Flight
      </Button>
    </Tile>
  );
};
```

**Migration Steps**:
1. Replace custom card with Carbon `Tile`
2. Use `RadioButtonGroup` for seat selection
3. Update styling to match design
4. Test booking flow
5. Verify responsive layout

---

### 8. BookingCard Component

**Current Implementation**: [`booking_system_frontend/src/components/bookings/BookingCard.tsx`](../../../booking_system_frontend/src/components/bookings/BookingCard.tsx)

**Carbon Replacement**:
```typescript
// src/components/bookings/CarbonBookingCard.tsx
import { Tile, Button, Tag } from '@carbon/react';
import { Airplane, Calendar, User } from '@carbon/icons-react';
import type { Booking } from '../../types';

interface BookingCardProps {
  booking: Booking;
  onModify: (booking: Booking) => void;
  onCancel: (bookingId: number) => void;
}

export const BookingCard = ({ booking, onModify, onCancel }: BookingCardProps) => {
  const statusColors = {
    confirmed: 'green',
    cancelled: 'red',
    pending: 'yellow'
  };

  return (
    <Tile className="booking-card">
      <div className="booking-card__header">
        <div>
          <h3>{booking.flight.origin} → {booking.flight.destination}</h3>
          <Tag type={statusColors[booking.status]}>
            {booking.status}
          </Tag>
        </div>
      </div>

      <div className="booking-card__details">
        <div className="detail-item">
          <Calendar size={16} />
          <span>{formatDate(booking.flight.departure_time)}</span>
        </div>
        <div className="detail-item">
          <User size={16} />
          <span>{booking.passenger_count} passenger(s)</span>
        </div>
        <div className="detail-item">
          <Airplane size={16} />
          <span>{booking.seat_class}</span>
        </div>
      </div>

      <div className="booking-card__actions">
        <Button kind="secondary" size="sm" onClick={() => onModify(booking)}>
          Modify
        </Button>
        <Button kind="danger" size="sm" onClick={() => onCancel(booking.booking_id)}>
          Cancel
        </Button>
      </div>
    </Tile>
  );
};
```

---

## Icon Migration

### Current: Lucide React
```typescript
import { Rocket, User, LogOut } from 'lucide-react';
```

### Carbon Icons
```typescript
import { Rocket, User, Logout } from '@carbon/icons-react';
```

**Icon Mapping**:
- `Rocket` → `Rocket`
- `User` → `User`
- `LogOut` → `Logout`
- `Plane` → `Airplane`
- `Clock` → `Time`
- `Calendar` → `Calendar`

---

## Animation Strategy

### Current: Framer Motion
Keep Framer Motion for custom animations not provided by Carbon.

### Carbon Motion
Use Carbon's motion tokens for standard animations:
```scss
@use '@carbon/react/scss/motion' as *;

.animated-element {
  transition: all $duration-moderate-01 motion(standard, productive);
}
```

---

## Testing Checklist

For each migrated component:
- [ ] Visual appearance matches design
- [ ] All props work correctly
- [ ] Event handlers function properly
- [ ] Accessibility features work (keyboard nav, screen readers)
- [ ] Responsive design maintained
- [ ] No console errors
- [ ] Performance is acceptable

---

## Estimated Time per Component

| Component | Estimated Time |
|-----------|---------------|
| Button | 1 hour |
| Card | 1 hour |
| Input | 1 hour |
| Modal | 2 hours |
| LoadingSpinner | 30 minutes |
| Header | 4 hours |
| FlightCard | 3 hours |
| BookingCard | 3 hours |
| **Total** | **15.5 hours** |

---

**Status**: Ready for implementation  
**Dependencies**: Phase 2 (Theme Configuration)  
**Blocks**: Phase 4 (Layout Migration)