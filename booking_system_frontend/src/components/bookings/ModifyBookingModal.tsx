import { useState, useEffect } from 'react';
import type { Booking, Flight, SeatClass } from '../../types';
import { Modal, Button } from '../common';
import { modifyBooking, isErrorResponse } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { PedestrianChild, ArrowUp, ArrowDown, Subtract } from '@carbon/icons-react';
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
        <div className="flex items-center gap-2 text-star-white">
          <Subtract size={20} />
          <span>No price change</span>
        </div>
      );
    } else if (priceDifference > 0) {
      return (
        <div className="flex items-center gap-2 text-red-400">
          <ArrowUp size={20} />
          <span>Additional charge: {formatCurrency(priceDifference)}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-green-400">
          <ArrowDown size={20} />
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
              <span className="text-star-white">Current Class:</span>
              <span className="text-star-white font-semibold capitalize">{booking.seat_class}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-star-white">New Class:</span>
              <span className="text-star-white font-semibold capitalize">{selectedClass}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-star-white">Infant:</span>
              <span className="text-star-white font-semibold">
                {hasInfant ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="flex justify-between mb-2">
                <span className="text-star-white">Current Price:</span>
                <span className="text-star-white">{formatCurrency(oldPrice)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-star-white">New Price:</span>
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
          <h3 className="text-sm font-semibold text-star-white mb-2">Current Booking</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-star-white font-semibold">
                {flight.origin} → {flight.destination}
              </p>
              <p className="text-sm text-star-white">Booking #{booking.booking_id}</p>
            </div>
            <div className="text-right">
              <p className="text-star-white font-semibold capitalize">{booking.seat_class}</p>
              <p className="text-sm text-star-white">{formatCurrency(oldPrice)}</p>
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
                      : 'border-white/10 bg-white/20'
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
                  <p className="text-xs text-star-white mb-2">{option.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-star-white">
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
              <PedestrianChild className="text-cosmic-purple" size={24} />
              <div>
                <p className="text-star-white font-semibold">Traveling with lap infant</p>
                <p className="text-xs text-star-white">Free - no seat required</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={hasInfant}
              onChange={(e) => setHasInfant(e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-white/20 text-cosmic-purple focus:ring-cosmic-purple"
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
            <h3 className="text-sm font-semibold text-star-white mb-3">Price Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-star-white">Current Price:</span>
                <span className="text-star-white">{formatCurrency(oldPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-star-white">New Price:</span>
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