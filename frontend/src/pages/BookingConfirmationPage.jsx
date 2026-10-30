import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  QrCode,
  Compass,
  ArrowRight,
  Printer,
  Download,
  Clock,
  Car,
  MapPin,
  Play
} from 'lucide-react';
import { api } from '../services/api';
import { GateSimulator } from '../components/GateSimulator';

export const BookingConfirmationPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!booking);

  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    const fetchBooking = async () => {
      try {
        const res = await api.getBookingById(id);
        setBooking(res.booking);
      } catch (err) {
        console.warn('Failed to load confirmed booking pass:', err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!booking) {
      fetchBooking();
    }
  }, [id, booking]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-primary">Pass Not Found</h2>
        <p className="text-xs text-surface-muted">We could not locate this digital pass.</p>
        <Link to="/find-parking" className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold inline-block">
          Find Parking
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Success Hero Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-bounce">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">
          Reservation Confirmed!
        </h1>
        <p className="text-xs sm:text-sm text-surface-muted max-w-lg mx-auto">
          Your digital gate pass is active. Show the QR code to the barrier gate scanner or use the interactive boom barrier simulator below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Digital Parking Pass Card */}
        <div className="bg-white rounded-3xl border-2 border-primary/20 p-6 sm:p-8 shadow-elevated text-center relative overflow-hidden space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <span className="font-extrabold text-sm text-primary tracking-tight">
              Park<span className="text-secondary">Ease</span> Digital Pass
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Valid & Paid
            </span>
          </div>

          {/* QR Code Container */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner mx-auto">
            {booking.qrCodeData ? (
              <img
                src={booking.qrCodeData}
                alt="Parking Pass QR Code"
                className="w-48 h-48 object-contain mx-auto"
              />
            ) : (
              <div className="w-48 h-48 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-mono">
                {booking.bookingId}
              </div>
            )}
            <div className="mt-2 text-[10px] font-mono text-slate-500 tracking-wider uppercase">
              Dynamic Optical Pass #{booking.bookingId}
            </div>
          </div>

          {/* Pass Details Table */}
          <div className="divide-y divide-slate-100 text-left text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-surface-muted">Assigned Bay</span>
              <b className="text-secondary text-sm font-extrabold">{booking.slotId} ({booking.floorName})</b>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-surface-muted">Facility</span>
              <b className="text-primary">{booking.location}</b>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-surface-muted">Vehicle Plate</span>
              <b className="font-mono bg-slate-100 px-2 py-0.5 rounded text-primary">{booking.vehiclePlate}</b>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-surface-muted">Scheduled Window</span>
              <b className="text-primary">
                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </b>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-surface-muted">Amount Paid</span>
              <b className="text-primary font-bold">₹{booking.totalAmount}</b>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Pass / Receipt</span>
            </button>
            <Link
              to={`/find-car/${booking.bookingId}`}
              className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary-dark text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Find My Car</span>
            </Link>
          </div>
        </div>

        {/* Right: Integrated Gate Barrier Simulator */}
        <div className="space-y-6">
          <GateSimulator
            booking={booking}
            onSessionStatusChange={(newStatus, updatedBooking) => {
              if (updatedBooking) setBooking(updatedBooking);
            }}
          />

          <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-card flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-bold text-xs text-primary">Need indoor guidance?</div>
              <div className="text-[11px] text-surface-muted">
                View turn-by-turn walking steps and honk car horn.
              </div>
            </div>
            <Link
              to={`/find-car/${booking.bookingId}`}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-bold transition-colors flex items-center gap-1"
            >
              <span>Open Guide</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
