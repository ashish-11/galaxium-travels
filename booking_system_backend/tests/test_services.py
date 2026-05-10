import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from models import User, Flight, Booking
from schemas import ErrorResponse
from services import flight, user, booking


class TestFlightService:
    """Test flight service functions."""

    def test_list_flights_empty(self, db_session):
        """Test listing flights when database is empty."""
        result = flight.list_flights(db_session)
        assert result == []

    def test_list_flights_with_data(self, db_session):
        """Test listing flights with data in database."""
        db_session.add(Flight(
            origin="Earth",
            destination="Mars",
            departure_time="2099-01-01T09:00:00Z",
            arrival_time="2099-01-01T17:00:00Z",
            base_price=1000000,
            total_seats=10,
            economy_seats_available=5,
            business_seats_available=3,
            galaxium_seats_available=2
        ))
        db_session.commit()

        result = flight.list_flights(db_session)
        assert len(result) == 1
        assert result[0].origin == "Earth"
        assert result[0].destination == "Mars"


class TestUserService:
    """Test user service functions."""

    def test_register_user_success(self, db_session):
        """Test successful user registration."""
        result = user.register_user(db_session, "Test User", "test@example.com")
        assert result.name == "Test User"
        assert result.email == "test@example.com"
        assert result.user_id > 0

    def test_register_user_duplicate_email(self, db_session):
        """Test registration with duplicate email."""
        user.register_user(db_session, "User 1", "test@example.com")
        result = user.register_user(db_session, "User 2", "test@example.com")

        assert isinstance(result, ErrorResponse)
        assert result.error_code == "EMAIL_EXISTS"

    def test_get_user_success(self, db_session):
        """Test successful user retrieval."""
        db_session.add(User(name="Test User", email="test@example.com"))
        db_session.commit()

        result = user.get_user(db_session, "Test User", "test@example.com")
        assert result.name == "Test User"
        assert result.email == "test@example.com"

    def test_get_user_not_found(self, db_session):
        """Test user retrieval when not found."""
        result = user.get_user(db_session, "NonExistent", "none@example.com")
        assert isinstance(result, ErrorResponse)
        assert result.error_code == "USER_NOT_FOUND"


class TestBookingService:
    """Test booking service functions."""

    def test_book_flight_success(self, db_session):
        """Test successful flight booking."""
        db_session.add(User(name="Test User", email="test@example.com"))
        db_session.add(Flight(
            origin="Earth",
            destination="Mars",
            departure_time="2099-01-01T09:00:00Z",
            arrival_time="2099-01-01T17:00:00Z",
            base_price=1000000,
            total_seats=10,
            economy_seats_available=5,
            business_seats_available=3,
            galaxium_seats_available=2
        ))
        db_session.commit()

        user_obj = db_session.query(User).first()
        flight_obj = db_session.query(Flight).first()

        result = booking.book_flight(db_session, user_obj.user_id, "Test User", flight_obj.flight_id, "economy")
        assert result.status == "booked"
        assert result.user_id == user_obj.user_id
        assert result.flight_id == flight_obj.flight_id

        # Verify seat was decremented
        db_session.refresh(flight_obj)
        assert flight_obj.economy_seats_available == 4

    def test_book_flight_not_found(self, db_session):
        """Test booking non-existent flight."""
        db_session.add(User(name="Test User", email="test@example.com"))
        db_session.commit()
        user_obj = db_session.query(User).first()

        result = booking.book_flight(db_session, user_obj.user_id, "Test User", 999, "economy")
        assert isinstance(result, ErrorResponse)
        assert result.error_code == "FLIGHT_NOT_FOUND"

    def test_book_flight_no_seats(self, db_session):
        """Test booking when no seats available."""
        db_session.add(User(name="Test User", email="test@example.com"))
        db_session.add(Flight(
            origin="Earth",
            destination="Mars",
            departure_time="2099-01-01T09:00:00Z",
            arrival_time="2099-01-01T17:00:00Z",
            base_price=1000000,
            total_seats=10,
            economy_seats_available=0,
            business_seats_available=0,
            galaxium_seats_available=0
        ))
        db_session.commit()

        user_obj = db_session.query(User).first()
        flight_obj = db_session.query(Flight).first()

        result = booking.book_flight(db_session, user_obj.user_id, "Test User", flight_obj.flight_id, "economy")
        assert isinstance(result, ErrorResponse)
        assert result.error_code == "NO_SEATS_AVAILABLE"

    def test_book_flight_user_not_found(self, db_session):
        """Test booking with non-existent user."""
        db_session.add(Flight(
            origin="Earth",
            destination="Mars",
            departure_time="2099-01-01T09:00:00Z",
            arrival_time="2099-01-01T17:00:00Z",
            base_price=1000000,
            total_seats=10,
            economy_seats_available=5,
            business_seats_available=3,
            galaxium_seats_available=2
        ))
        db_session.commit()
        flight_obj = db_session.query(Flight).first()

        result = booking.book_flight(db_session, 999, "Fake User", flight_obj.flight_id, "economy")
        assert isinstance(result, ErrorResponse)
        assert result.error_code == "USER_NOT_FOUND"

    def test_book_flight_name_mismatch(self, db_session):
        """Test booking with wrong name for user ID."""
        db_session.add(User(name="Real Name", email="test@example.com"))
        db_session.add(Flight(
            origin="Earth",
            destination="Mars",
            departure_time="2099-01-01T09:00:00Z",
            arrival_time="2099-01-01T17:00:00Z",
            base_price=1000000,
            total_seats=10,
            economy_seats_available=5,
            business_seats_available=3,
            galaxium_seats_available=2
        ))
        db_session.commit()

        user_obj = db_session.query(User).first()
        flight_obj = db_session.query(Flight).first()

        result = booking.book_flight(db_session, user_obj.user_id, "Wrong Name", flight_obj.flight_id, "economy")
        assert isinstance(result, ErrorResponse)
        assert result.error_code == "NAME_MISMATCH"

    def test_cancel_booking_success(self, db_session):
        """Test successful booking cancellation."""
        db_session.add(User(name="Test User", email="test@example.com"))
        db_session.add(Flight(
            origin="Earth",
            destination="Mars",
            departure_time="2099-01-01T09:00:00Z",
            arrival_time="2099-01-01T17:00:00Z",
            base_price=1000000,
            total_seats=10,
            economy_seats_available=4,
            business_seats_available=3,
            galaxium_seats_available=2
        ))
        db_session.commit()

        user_obj = db_session.query(User).first()
        flight_obj = db_session.query(Flight).first()

        db_session.add(Booking(
            user_id=user_obj.user_id,
            flight_id=flight_obj.flight_id,
            seat_class="economy",
            status="booked",
            booking_time="2099-01-01T10:00:00Z"
        ))
        db_session.commit()

        booking_obj = db_session.query(Booking).first()
        result = booking.cancel_booking(db_session, booking_obj.booking_id)

        assert result.status == "cancelled"

        # Verify seat was restored
        db_session.refresh(flight_obj)
        assert flight_obj.economy_seats_available == 5

    def test_cancel_booking_not_found(self, db_session):
        """Test cancelling non-existent booking."""
        result = booking.cancel_booking(db_session, 999)
        assert isinstance(result, ErrorResponse)
        assert result.error_code == "BOOKING_NOT_FOUND"

    def test_cancel_booking_already_cancelled(self, db_session):
        """Test cancelling already cancelled booking."""
        db_session.add(User(name="Test User", email="test@example.com"))
        db_session.add(Flight(
            origin="Earth",
            destination="Mars",
            departure_time="2099-01-01T09:00:00Z",
            arrival_time="2099-01-01T17:00:00Z",
            base_price=1000000,
            total_seats=10,
            economy_seats_available=5,
            business_seats_available=3,
            galaxium_seats_available=2
        ))
        db_session.commit()

        user_obj = db_session.query(User).first()
        flight_obj = db_session.query(Flight).first()

        db_session.add(Booking(
            user_id=user_obj.user_id,
            flight_id=flight_obj.flight_id,
            seat_class="economy",
            status="cancelled",
            booking_time="2099-01-01T10:00:00Z"
        ))
        db_session.commit()

        booking_obj = db_session.query(Booking).first()
        result = booking.cancel_booking(db_session, booking_obj.booking_id)

        assert isinstance(result, ErrorResponse)
        assert result.error_code == "ALREADY_CANCELLED"

    def test_get_bookings_success(self, db_session):
        """Test getting user bookings."""
        db_session.add(User(name="Test User", email="test@example.com"))
        db_session.add(Flight(
            origin="Earth",
            destination="Mars",
            departure_time="2099-01-01T09:00:00Z",
            arrival_time="2099-01-01T17:00:00Z",
            base_price=1000000,
            total_seats=10,
            economy_seats_available=5,
            business_seats_available=3,
            galaxium_seats_available=2
        ))
        db_session.commit()

        user_obj = db_session.query(User).first()
        flight_obj = db_session.query(Flight).first()

        db_session.add(Booking(
            user_id=user_obj.user_id,
            flight_id=flight_obj.flight_id,
            seat_class="economy",
            status="booked",
            booking_time="2099-01-01T10:00:00Z"
        ))
        db_session.commit()

        result = booking.get_bookings(db_session, user_obj.user_id)
        assert len(result) == 1
        assert result[0].status == "booked"

    def test_get_bookings_empty(self, db_session):
        """Test getting bookings when user has none."""
        result = booking.get_bookings(db_session, 999)
        assert result == []

    def test_book_flight_with_infant(self, db_session, sample_user, sample_flight):
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
        
        assert result.has_infant is True
        assert result.status == "booked"
        
        # Verify only one seat consumed (adult), not two
        db_session.refresh(sample_flight)
        assert sample_flight.economy_seats_available == initial_seats - 1

    def test_book_flight_without_infant(self, db_session, sample_user, sample_flight):
        """Test booking without infant works as before."""
        result = booking.book_flight(
            db_session,
            sample_user.user_id,
            sample_user.name,
            sample_flight.flight_id,
            "economy",
            has_infant=False
        )
        
        assert result.has_infant is False
        assert result.status == "booked"

    def test_book_flight_infant_default_false(self, db_session, sample_user, sample_flight):
        """Test booking defaults to no infant when parameter not provided."""
        result = booking.book_flight(
            db_session,
            sample_user.user_id,
            sample_user.name,
            sample_flight.flight_id,
            "economy"
        )
        
        assert result.has_infant is False

    def test_modify_booking_upgrade_class(self, db_session, sample_user, sample_flight):
        """Test upgrading from economy to business class."""
        # Create test booking
        result = booking.book_flight(db_session, sample_user.user_id, sample_user.name, sample_flight.flight_id, "economy", False)
        from schemas import BookingOut
        assert isinstance(result, BookingOut)
        booking_id = result.booking_id
        
        # Modify to business
        modify_result = booking.modify_booking(db_session, booking_id, "business", False)
        assert not isinstance(modify_result, ErrorResponse)
        assert modify_result.booking.seat_class == "business"
        assert modify_result.old_seat_class == "economy"
        assert modify_result.new_seat_class == "business"
        assert modify_result.price_difference > 0  # Should cost more

    def test_modify_booking_downgrade_class(self, db_session, sample_user, sample_flight):
        """Test downgrading from galaxium to economy class."""
        from schemas import BookingOut
        result = booking.book_flight(db_session, sample_user.user_id, sample_user.name, sample_flight.flight_id, "galaxium", False)
        assert isinstance(result, BookingOut)
        booking_id = result.booking_id
        
        modify_result = booking.modify_booking(db_session, booking_id, "economy", False)
        assert not isinstance(modify_result, ErrorResponse)
        assert modify_result.booking.seat_class == "economy"
        assert modify_result.price_difference < 0  # Should get refund

    def test_modify_booking_add_infant(self, db_session, sample_user, sample_flight):
        """Test adding infant without changing class."""
        from schemas import BookingOut
        result = booking.book_flight(db_session, sample_user.user_id, sample_user.name, sample_flight.flight_id, "economy", False)
        assert isinstance(result, BookingOut)
        booking_id = result.booking_id
        
        modify_result = booking.modify_booking(db_session, booking_id, "economy", True)
        assert not isinstance(modify_result, ErrorResponse)
        assert modify_result.booking.has_infant is True
        assert modify_result.price_difference == 0  # No price change

    def test_modify_booking_not_found(self, db_session):
        """Test modifying non-existent booking."""
        result = booking.modify_booking(db_session, 99999, "business", False)
        assert isinstance(result, ErrorResponse)
        assert result.error_code == "BOOKING_NOT_FOUND"

    def test_modify_booking_already_cancelled(self, db_session, sample_user, sample_flight):
        """Test modifying cancelled booking."""
        from schemas import BookingOut
        result = booking.book_flight(db_session, sample_user.user_id, sample_user.name, sample_flight.flight_id, "economy", False)
        assert isinstance(result, BookingOut)
        booking_id = result.booking_id
        
        # Cancel it
        booking.cancel_booking(db_session, booking_id)
        
        # Try to modify
        modify_result = booking.modify_booking(db_session, booking_id, "business", False)
        assert isinstance(modify_result, ErrorResponse)
        assert modify_result.error_code == "BOOKING_NOT_MODIFIABLE"

    def test_modify_booking_no_seats_available(self, db_session, sample_user, sample_flight):
        """Test modifying when target class is full."""
        from schemas import BookingOut
        # Book all business seats (3 available in sample_flight)
        booking.book_flight(db_session, sample_user.user_id, sample_user.name, sample_flight.flight_id, "business", False)
        
        # Add more users for additional bookings
        db_session.add(User(name="Bob Smith", email="bob@example.com"))
        db_session.add(User(name="Charlie Brown", email="charlie@example.com"))
        db_session.commit()
        user2 = db_session.query(User).filter(User.email == "bob@example.com").first()
        user3 = db_session.query(User).filter(User.email == "charlie@example.com").first()
        
        booking.book_flight(db_session, user2.user_id, user2.name, sample_flight.flight_id, "business", False)
        booking.book_flight(db_session, user3.user_id, user3.name, sample_flight.flight_id, "business", False)
        
        # Try to upgrade economy to business (all business seats are now taken)
        result = booking.book_flight(db_session, sample_user.user_id, sample_user.name, sample_flight.flight_id, "economy", False)
        assert isinstance(result, BookingOut)
        
        modify_result = booking.modify_booking(db_session, result.booking_id, "business", False)
        assert isinstance(modify_result, ErrorResponse)
        assert modify_result.error_code == "NO_SEATS_AVAILABLE"

    def test_modify_booking_invalid_seat_class(self, db_session, sample_user, sample_flight):
        """Test modifying with invalid seat class."""
        from schemas import BookingOut
        result = booking.book_flight(db_session, sample_user.user_id, sample_user.name, sample_flight.flight_id, "economy", False)
        assert isinstance(result, BookingOut)
        
        modify_result = booking.modify_booking(db_session, result.booking_id, "first_class", False)
        assert isinstance(modify_result, ErrorResponse)
        assert modify_result.error_code == "INVALID_SEAT_CLASS"
        assert result.status == "booked"
