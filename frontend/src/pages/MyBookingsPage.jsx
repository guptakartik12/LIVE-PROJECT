import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Car,
  QrCode,
  Compass,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { useNotification } from '../context/NotificationContext';

export const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'upcoming' | 'completed'
  const [extendModalBooking, setExtendModalBooking] = useState(null);
  const [extraHours, setExtraHours] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useNotification();

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await api.getMyBookings();
      setBookings(res.bookings || []);
    } catch (err) {
      console.warn('Failed to load bookings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${bookingId}? A full refund will be processed.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await api.cancelBooking(bookingId);
      showToast('Booking cancelled and refund initiated!', 'info');
      await loadBookings();
    } catch (err) {
      showToast(err.message || 'Failed to cancel booking', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtend = async () => {
    if (!extendModalBooking) return;
    setActionLoading(true);
    try {
      await api.extendBooking(extendModalBooking.bookingId, extraHours);
      showToast(`Booking extended by ${extraHours} hour(s)!`, 'success');
      setExtendModalBooking(null);
      await loadBookings();
    } catch (err) {
      showToast(err.message || 'Cannot extend booking at this time', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'active') return b.isActive;
    if (filter === 'upcoming') return b.isUpcoming && b.bookingStatus === 'confirmed';
    if (filter === 'completed') return b.isExpired || b.bookingStatus === 'completed';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-border gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">
            My Parking Reservations
          </h1>
          <p className="text-xs text-surface-muted mt-1">
            Access your active digital passes, boom barrier tokens, and past parking invoices.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {['all', 'active', 'upcoming', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === tab
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-surface-muted hover:text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-surface-muted font-semibold">Loading reservations...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-border p-12 text-center space-y-4 shadow-card">
          <Car className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-primary">No Reservations Found</h3>
          <p className="text-xs text-surface-muted max-w-sm mx-auto">
            You don't have any parking reservations in this tab. Find an open bay at your destination now.
          </p>
          <Link
            to="/find-parking"
            className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-semibold text-xs inline-block transition-colors"
          >
            Find Parking Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isConfirmed = b.bookingStatus === 'confirmed';
            const isActive = b.bookingStatus === 'active';
            const isCancelled = b.bookingStatus === 'cancelled';
            const isCompleted = b.bookingStatus === 'completed';

            return (
              <div
                key={b.bookingId}
                className="bg-white rounded-2xl border border-surface-border p-5 sm:p-6 shadow-card hover:shadow-elevated transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left: Slot & Facility info */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary text-white font-extrabold text-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    {b.slotId}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-primary">
                        {b.floorName} ({b.slotId})
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Parked & Active Now
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                          Upcoming Reservation
                        </span>
                      )}
                      {isCancelled && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                          Cancelled (Refunded)
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                          Session Completed
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-surface-muted flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Facility: <b className="text-primary">{b.location}</b></span>
                      <span>Plate: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-bold text-primary">{b.vehiclePlate}</code></span>
                      <span>Pass ID: <b className="font-mono">{b.bookingId}</b></span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                      <Clock className="w-3.5 h-3.5 text-secondary" />
                      <span>
                        {new Date(b.startTime).toLocaleDateString([], { day: 'numeric', month: 'short' })}:{' '}
                        <b>{new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b> to{' '}
                        <b>{new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b> ({b.durationHours} hr)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <Link
                    to={`/booking-confirmed/${b.bookingId}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5 text-secondary" />
                    <span>Pass & Gate</span>
                  </Link>

                  <Link
                    to={`/find-car/${b.bookingId}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 text-secondary" />
                    <span>Find Car</span>
                  </Link>

                  {!isCancelled && !isCompleted && (
                    <button
                      onClick={() => setExtendModalBooking(b)}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-secondary text-xs font-semibold transition-colors"
                    >
                      Extend
                    </button>
                  )}

                  {isConfirmed && !isActive && (
                    <button
                      onClick={() => handleCancel(b.bookingId)}
                      disabled={actionLoading}
                      className="px-3 py-2 rounded-xl text-danger hover:bg-rose-50 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Extend Duration Modal */}
      {extendModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-elevated border border-surface-border space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="font-bold text-sm text-primary">Extend Parking Reservation</h3>
              <button
                onClick={() => setExtendModalBooking(null)}
                className="text-surface-muted hover:text-primary font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-surface-muted">
              Extend duration for Bay <b className="text-primary">{extendModalBooking.slotId}</b> ({extendModalBooking.location}).
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Additional Hours to Add
              </label>
              <div className="flex items-center border border-surface-border rounded-xl overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setExtraHours((h) => Math.max(1, h - 1))}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-primary font-bold text-sm"
                >
                  −
                </button>
                <div className="flex-1 text-center text-xs font-bold text-primary">
                  +{extraHours} Hour{extraHours > 1 ? 's' : ''}
                </div>
                <button
                  type="button"
                  onClick={() => setExtraHours((h) => Math.min(12, h + 1))}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-primary font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-surface-muted">
                <span>Rate per hour</span>
                <b>₹{extendModalBooking.hourlyRate}</b>
              </div>
              <div className="flex justify-between font-bold text-primary">
                <span>Additional Total</span>
                <span>₹{extendModalBooking.hourlyRate * extraHours}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setExtendModalBooking(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExtend}
                disabled={actionLoading}
                className="w-1/2 py-2.5 rounded-xl bg-secondary hover:bg-secondary-dark text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                Confirm Extension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
