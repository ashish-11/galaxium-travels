from models import Base, User, Flight, Booking
from db import engine, SessionLocal
from datetime import datetime, timedelta
import random

def calculate_seat_distribution(total_seats: int) -> tuple[int, int, int]:
    """Calculate 60/30/10 split for economy/business/galaxium."""
    economy = int(total_seats * 0.6)
    business = int(total_seats * 0.3)
    galaxium = max(1, total_seats - economy - business)  # Ensure at least 1
    return economy, business, galaxium


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Clear existing data
    db.query(Booking).delete()
    db.query(User).delete()
    db.query(Flight).delete()
    db.commit()
    # Add demo users
    users = [
        User(name="Alice", email="alice@example.com"),
        User(name="Bob", email="bob@example.com"),
        User(name="Charlie", email="charlie@galaxium.com"),
        User(name="Diana", email="diana@moonmail.com"),
        User(name="Eve", email="eve@marsmail.com"),
        User(name="Frank", email="frank@venusmail.com"),
        User(name="Grace", email="grace@jupiter.com"),
        User(name="Heidi", email="heidi@europa.com"),
        User(name="Ivan", email="ivan@asteroidbelt.com"),
        User(name="Judy", email="judy@pluto.com"),
    ]
    db.add_all(users)
    db.commit()
    # Add demo flights with seat class distribution
    flight_data = [
        ("Earth", "Mars", "2099-01-01T09:00:00Z", "2099-01-01T17:00:00Z", 1000000, 10),
        ("Earth", "Moon", "2099-01-02T10:00:00Z", "2099-01-02T14:00:00Z", 500000, 10),
        ("Mars", "Earth", "2099-01-03T12:00:00Z", "2099-01-03T20:00:00Z", 950000, 10),
        ("Venus", "Earth", "2099-01-04T08:00:00Z", "2099-01-04T18:00:00Z", 1200000, 10),
        ("Jupiter", "Europa", "2099-01-05T15:00:00Z", "2099-01-05T19:00:00Z", 2000000, 10),
        ("Earth", "Venus", "2099-01-06T07:00:00Z", "2099-01-06T15:00:00Z", 1100000, 10),
        ("Moon", "Mars", "2099-01-07T11:00:00Z", "2099-01-07T19:00:00Z", 800000, 10),
        ("Mars", "Jupiter", "2099-01-08T13:00:00Z", "2099-01-08T23:00:00Z", 2500000, 10),
        ("Europa", "Earth", "2099-01-09T09:00:00Z", "2099-01-09T21:00:00Z", 3000000, 10),
        ("Earth", "Pluto", "2099-01-10T06:00:00Z", "2099-01-11T06:00:00Z", 5000000, 10),
    ]
    
    flights = []
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
    db.add_all(flights)
    db.commit()
    # Add demo bookings with seat classes
    user_ids = [user.user_id for user in db.query(User).all()]
    flight_ids = [flight.flight_id for flight in db.query(Flight).all()]
    statuses = ["booked", "cancelled", "completed"]
    seat_classes = ['economy', 'business', 'galaxium']
    bookings = []
    now = datetime.utcnow()
    for i in range(20):
        user_id = random.choice(user_ids)
        flight_id = random.choice(flight_ids)
        status = random.choice(statuses)
        seat_class = random.choice(seat_classes)
        booking_time = (now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))).isoformat() + "Z"
        bookings.append(Booking(
            user_id=user_id,
            flight_id=flight_id,
            seat_class=seat_class,
            status=status,
            booking_time=booking_time,
            has_infant=False
        ))
    db.add_all(bookings)
    db.commit()
    db.close()
    print("Database seeded with elaborate demo data!")

if __name__ == "__main__":
    seed() 