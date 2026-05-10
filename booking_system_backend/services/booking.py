from sqlalchemy.orm import Session
from datetime import datetime
from models import User, Flight, Booking
from schemas import BookingOut, ErrorResponse


def book_flight(db: Session, user_id: int, name: str, flight_id: int, seat_class: str, has_infant: bool = False) -> BookingOut | ErrorResponse:
    """Book a seat on a specific flight for a user in a specific seat class.
    
    Optionally include a lap infant (free, no seat consumed).
    """
    # Validate seat_class
    valid_classes = ['economy', 'business', 'galaxium']
    if seat_class not in valid_classes:
        return ErrorResponse(
            error="Invalid seat class",
            error_code="INVALID_SEAT_CLASS",
            details=f"Seat class must be one of: {', '.join(valid_classes)}. Received: '{seat_class}'"
        )
    
    # Check flight exists
    flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
    if not flight:
        return ErrorResponse(
            error="Flight not found",
            error_code="FLIGHT_NOT_FOUND",
            details=f"The specified flight_id {flight_id} does not exist in our system. Please check the flight_id or use list_flights to see available flights."
        )

    # Check seats available for specific class
    seats_field = f"{seat_class}_seats_available"
    available_seats = getattr(flight, seats_field)
    
    if available_seats < 1:
        return ErrorResponse(
            error=f"No {seat_class} seats available",
            error_code="NO_SEATS_AVAILABLE",
            details=f"All {seat_class} class seats are booked for this flight. Please try a different class or another flight."
        )

    # Check user exists and name matches
    user = db.query(User).filter(User.user_id == user_id, User.name == name).first()
    if not user:
        existing_user = db.query(User).filter(User.user_id == user_id).first()
        if existing_user:
            return ErrorResponse(
                error="Name mismatch",
                error_code="NAME_MISMATCH",
                details=f"User ID {user_id} exists but the name '{name}' does not match the registered name '{existing_user.name}'. Please verify the user's name or use the correct name for this user ID."
            )
        else:
            return ErrorResponse(
                error="User not found",
                error_code="USER_NOT_FOUND",
                details=f"User with ID {user_id} is not registered in our system. The user might need to register first, or you may need to check if the user_id is correct."
            )

    # Decrement appropriate seat count
    setattr(flight, seats_field, available_seats - 1)
    
    # Create booking with seat_class
    new_booking = Booking(
        user_id=user_id,
        flight_id=flight_id,
        seat_class=seat_class,
        status="booked",
        booking_time=datetime.utcnow().isoformat(),
        has_infant=has_infant
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return BookingOut.model_validate(new_booking)


def cancel_booking(db: Session, booking_id: int) -> BookingOut | ErrorResponse:
    """Cancel an existing booking by its booking_id."""
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        return ErrorResponse(
            error="Booking not found",
            error_code="BOOKING_NOT_FOUND",
            details=f"Booking with ID {booking_id} not found. The booking may have been deleted or the booking_id may be incorrect. Please verify the booking_id or check if the booking exists."
        )

    if booking.status == "cancelled":
        return ErrorResponse(
            error="Booking already cancelled",
            error_code="ALREADY_CANCELLED",
            details=f"Booking {booking_id} is already cancelled and cannot be cancelled again. The booking status is currently '{booking.status}'. If you need to make changes, please contact support."
        )

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


def get_bookings(db: Session, user_id: int) -> list[BookingOut]:
    """Retrieve all bookings for a specific user."""
    bookings = db.query(Booking).filter(Booking.user_id == user_id).all()
    return [BookingOut.model_validate(b) for b in bookings]


def modify_booking(db: Session, booking_id: int, new_seat_class: str, has_infant: bool) -> "ModifyBookingResponse | ErrorResponse":
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
