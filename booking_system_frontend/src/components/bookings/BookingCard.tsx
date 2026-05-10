import type { Booking, Flight, SeatClass } from '../../types';
import { Card, Button } from '../common';
import { Plane, Calendar, CheckCircle, XCircle, Clock, Baby } from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { motion } from 'framer-motion';

interface BookingCardProps {
  booking: Booking;
  flight?: Flight;
  onCancel: (bookingId: number) => void;
  isCancelling?: boolean;
}

export const BookingCard = ({ booking, flight, onCancel, isCancelling }: BookingCardProps) => {
  const getStatusIcon = () => {
    switch (booking.status) {
      case 'booked':
        return <CheckCircle className="text-alien-green" size={20} />;
      case 'cancelled':
        return <XCircle className="text-red-500" size={20} />;
      case 'completed':
        return <CheckCircle className="text-blue-500" size={20} />;
      default:
        return <Clock className="text-star-white/50" size={20} />;
    }
  };

  const getStatusColor = () => {
    switch (booking.status) {
      case 'booked':
        return 'text-alien-green';
      case 'cancelled':
        return 'text-red-500';
      case 'completed':
        return 'text-blue-500';
      default:
        return 'text-star-white/50';
    }
  };

  const getSeatClassBadge = (seatClass: SeatClass) => {
    const badges = {
      economy: { icon: '💺', label: 'Economy', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
      business: { icon: '🛋️', label: 'Business', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
      galaxium: { icon: '👑', label: 'Galaxium', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' },
    };

    const badge = badges[seatClass];
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${badge.color}`}>
        <span>{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  const getPrice = () => {
    if (!flight) return 0;
    switch (booking.seat_class) {
      case 'economy':
        return flight.economy_price;
      case 'business':
        return flight.business_price;
      case 'galaxium':
        return flight.galaxium_price;
      default:
        return flight.base_price;
    }
  };

  const canCancel = booking.status === 'booked';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        {/* Header */}
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cosmic-gradient">
              <Plane className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm text-star-white/60">Booking #{booking.booking_id}</p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon()}
                <span className={`text-sm font-semibold capitalize ${getStatusColor()}`}>
                  {booking.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Flight Details */}
        {flight ? (
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xl font-bold text-star-white mb-1">
                  {flight.origin} → {flight.destination}
                </h3>
                <p className="text-sm text-star-white/60">Flight #{flight.flight_id}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                {getSeatClassBadge(booking.seat_class)}
                {booking.has_infant && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-cosmic-purple/20 border border-cosmic-purple/30">
                    <Baby size={14} className="text-cosmic-purple" />
                    <span className="text-xs text-cosmic-purple font-medium">
                      + Infant
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-star-white/60 mb-1">Departure</p>
                <p className="text-sm text-star-white font-medium">
                  {formatDate(flight.departure_time)}
                </p>
              </div>
              <div>
                <p className="text-xs text-star-white/60 mb-1">Arrival</p>
                <p className="text-sm text-star-white font-medium">
                  {formatDate(flight.arrival_time)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-sm text-star-white/60">Price</span>
              <span className="text-lg font-bold text-star-white">
                {formatCurrency(getPrice())}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-sm text-star-white/60">Flight ID: {booking.flight_id}</p>
          </div>
        )}

        {/* Booking Time */}
        <div className="flex items-center gap-2 text-sm text-star-white/60 mb-4">
          <Calendar size={16} />
          <span>Booked on {formatDate(booking.booking_time)}</span>
        </div>

        {/* Cancel Button */}
        {canCancel && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onCancel(booking.booking_id)}
            isLoading={isCancelling}
            className="w-full"
          >
            Cancel Booking
          </Button>
        )}
      </Card>
    </motion.div>
  );
};

// Made with Bob
