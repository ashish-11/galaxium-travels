import { useState } from 'react';
import type { Flight, SeatClass } from '../../types';
import { Card, Button } from '../common';
import { Plane, Clock } from 'lucide-react';
import { formatCurrency, formatDate, formatTime, calculateDuration } from '../../utils/formatters';
import { motion } from 'framer-motion';

interface FlightCardProps {
  flight: Flight;
  onBook: (flight: Flight, seatClass: SeatClass) => void;
}

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
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      hoverBorder: 'hover:border-blue-500/50',
    },
    {
      type: 'business' as SeatClass,
      label: 'Business',
      price: flight.business_price,
      available: flight.business_seats_available,
      icon: '🛋️',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      hoverBorder: 'hover:border-purple-500/50',
    },
    {
      type: 'galaxium' as SeatClass,
      label: 'Galaxium',
      price: flight.galaxium_price,
      available: flight.galaxium_seats_available,
      icon: '👑',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      hoverBorder: 'hover:border-yellow-500/50',
    },
  ];

  const totalAvailable =
    flight.economy_seats_available +
    flight.business_seats_available +
    flight.galaxium_seats_available;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col">
        {/* Route Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cosmic-gradient">
              <Plane className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-star-white">
                {flight.origin} → {flight.destination}
              </h3>
              <p className="text-sm text-star-white/60">
                Flight #{flight.flight_id}
              </p>
            </div>
          </div>
        </div>

        {/* Flight Details */}
        <div className="space-y-3 mb-4">
          {/* Departure & Arrival */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-star-white/60 mb-1">Departure</p>
              <p className="text-sm font-medium text-star-white">
                {formatDate(flight.departure_time, 'MMM dd, yyyy')}
              </p>
              <p className="text-lg font-bold text-cosmic-purple">
                {formatTime(flight.departure_time)}
              </p>
            </div>
            <div>
              <p className="text-xs text-star-white/60 mb-1">Arrival</p>
              <p className="text-sm font-medium text-star-white">
                {formatDate(flight.arrival_time, 'MMM dd, yyyy')}
              </p>
              <p className="text-lg font-bold text-cosmic-purple">
                {formatTime(flight.arrival_time)}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-star-white/70">
            <Clock size={16} />
            <span className="text-sm">
              Duration: {calculateDuration(flight.departure_time, flight.arrival_time)}
            </span>
          </div>
        </div>

        {/* Seat Class Selection */}
        <div className="space-y-2 mb-4 flex-1">
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
                  : `${seatClass.borderColor} ${seatClass.hoverBorder}`
              } ${
                seatClass.available === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{seatClass.icon}</span>
                  <div className="text-left">
                    <p className={`font-semibold ${seatClass.color}`}>
                      {seatClass.label}
                    </p>
                    <p className="text-xs text-star-white/60">
                      {seatClass.available === 0
                        ? 'Sold out'
                        : `${seatClass.available} seat${seatClass.available !== 1 ? 's' : ''} available`}
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
          {totalAvailable === 0
            ? 'Sold Out'
            : !selectedClass
            ? 'Select a Class'
            : `Book ${selectedClass.charAt(0).toUpperCase() + selectedClass.slice(1)}`}
        </Button>
      </Card>
    </motion.div>
  );
};

// Made with Bob
