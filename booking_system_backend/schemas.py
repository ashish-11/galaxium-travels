from pydantic import BaseModel, EmailStr
from typing import Optional


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

    class Config:
        from_attributes = True


class BookingRequest(BaseModel):
    user_id: int
    name: str
    flight_id: int
    seat_class: str  # 'economy', 'business', or 'galaxium'
    has_infant: bool = False


class BookingOut(BaseModel):
    booking_id: int
    user_id: int
    flight_id: int
    seat_class: str
    status: str
    booking_time: str
    has_infant: bool

    class Config:
        from_attributes = True


class UserRegistration(BaseModel):
    name: str
    email: EmailStr


class UserOut(BaseModel):
    user_id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    error_code: str
    details: Optional[str] = None
