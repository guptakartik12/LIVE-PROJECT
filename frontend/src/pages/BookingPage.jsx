import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Car,
  MapPin,
  CreditCard,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { RazorpayModal } from '../components/RazorpayModal';

export const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isMember } = useAuth();
  const { showToast } = useNotification();

  const bookingState = location.state;

  const [plate, setPlate] = useState(user?.plate || 'DL 01 AB 1001');
  const [vehicleModel, setVehicleModel] = useState('');
  const [driverName, setDriverName] = useState(user?.name || 'Driver');
  const [driverPhone, setDriverPhone] = useState(user?.phone || '9811223344');
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!bookingState || !bookingState.slot) {
      navigate('/find-parking');
    }
  }, [bookingState, navigate]);

  if (!bookingState || !bookingState.slot) {
    return null;
  }

  const { slot, floor, location: locName, dateStr, startHour, durationHours } = bookingState;

  // Price calculations
  const hourlyRate = floor?.hourlyRate || slot?.pricePerHour || 40;
  const subtotal = hourlyRate * durationHours;
  const discountAmount = isMember ? Math.round(subtotal * 0.20) : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const startFormatted = `${startHour}:00`;
  const endFormatted = `${startHour + durationHours}:00`;

  const handleOpenPayment = (e) => {
    e.preventDefault();
    if (!plate.trim()) {
      setErrorMessage('Please provide your vehicle registration plate number.');
      return;
    }
    setErrorMessage('');
    setIsRazorpayOpen(true);
  };

  const handlePaymentSuccess = async (paymentResult) => {
    setIsRazorpayOpen(false);
    setSubmitting(true);

    try {
      const payload = {
        slotId: slot.slotId,
        floorKey: slot.floorKey,
        location: locName,
        vehiclePlate: plate.trim().toUpperCase(),
        vehicleType: slot.vehicleType,
        dateStr,
        startHour,
        durationHours,
        paymentMethod: paymentResult.method || 'Razorpay UPI'
      };

      const res = await api.createBooking(payload);
      showToast('Reservation confirmed and pass generated!', 'success');
      navigate(`/booking-confirmed/${res.booking.bookingId}`, {
        state: { booking: res.booking }
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to complete booking reservation.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to={`/find-parking?loc=${encodeURIComponent(locName)}&fl=${slot.floorKey}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to 2D Floor Layout</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-surface-border gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">
            Review & Complete Reservation
          </h1>
          <p className="text-xs text-surface-muted mt-1">
            Review your allocated bay details, express entry credentials, and secure payment.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
          Step 9 of 11: Final Review
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Driver and Vehicle Details */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleOpenPayment} className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-primary flex items-center gap-2">
              <Car className="w-5 h-5 text-secondary" /> Vehicle & Driver Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Vehicle Registration Plate *</span>
                <input
                  type="text"
                  required
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="e.g. DL 01 AB 1001"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm font-mono uppercase font-bold focus:outline-none focus:border-secondary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Vehicle Make / Model (Optional)</span>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="e.g. Honda City / Tata Nexon"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:border-secondary"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Driver Name</span>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:border-secondary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Contact Phone</span>
                <input
                  type="tel"
                  required
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm font-mono focus:outline-none focus:border-secondary"
                />
              </label>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50"
            >
              {submitting ? (
                <span>Generating Digital Pass...</span>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Proceed to Payment (₹{totalAmount})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Membership savings info card */}
          {!isMember ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <b className="text-xs text-amber-900 block flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Save 20% on this booking & pre-book 7 days ahead!
                </b>
                <p className="text-[11px] text-amber-800">
                  Upgrade to ParkEase Premium today to unlock automatic discounts on every garage bay.
                </p>
              </div>
              <Link
                to="/membership"
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-bold whitespace-nowrap transition-colors"
              >
                Join VIP
              </Link>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><b>Premium Privilege Applied:</b> You are saving 20% on this reservation (₹{discountAmount} off).</span>
            </div>
          )}
        </div>

        {/* Right: Booking Summary Breakdown */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-primary pb-3 border-b border-surface-border">
              Reservation Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-surface-muted">Facility</span>
                <b className="text-primary">{locName}</b>
              </div>

              <div className="flex justify-between">
                <span className="text-surface-muted">Assigned Bay</span>
                <b className="text-secondary font-extrabold text-sm">{slot.slotId} ({floor.name})</b>
              </div>

              <div className="flex justify-between">
                <span className="text-surface-muted">Date</span>
                <b className="text-primary">{dateStr}</b>
              </div>

              <div className="flex justify-between">
                <span className="text-surface-muted">Time Window</span>
                <b className="text-primary">{startFormatted} – {endFormatted} ({durationHours} hr)</b>
              </div>

              <div className="flex justify-between">
                <span className="text-surface-muted">Bay Landmark</span>
                <b className="text-primary">{slot.landmark}</b>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base Rate (₹{hourlyRate} × {durationHours} hr)</span>
                <span>₹{subtotal}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Premium Member Privilege (20%)</span>
                  <span>−₹{discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-primary pt-2 border-t border-slate-100">
                <span>Total Amount</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-surface-muted pt-2 border-t border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Free cancellation up to 1 hr before arrival</span>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Test Modal */}
      {isRazorpayOpen && (
        <RazorpayModal
          amount={totalAmount}
          bookingDetails={{
            slotId: slot.slotId,
            durationHours
          }}
          onSuccess={handlePaymentSuccess}
          onClose={() => setIsRazorpayOpen(false)}
        />
      )}
    </div>
  );
};
