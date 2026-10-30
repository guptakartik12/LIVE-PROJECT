import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Compass, Car, ArrowLeft, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { FindMyCarMap } from '../components/FindMyCarMap';

export const FindMyCarPage = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTargetBooking = async () => {
      setLoading(true);
      try {
        if (id) {
          const res = await api.getBookingById(id);
          setBooking(res.booking);
        } else {
          // Fetch user's active or recent booking
          const myRes = await api.getMyBookings();
          const active = myRes.bookings?.find((b) => b.isActive || b.bookingStatus === 'active') || myRes.bookings?.[0];
          setBooking(active || null);
        }
      } catch (err) {
        console.warn('Failed to load target booking for Find My Car:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTargetBooking();
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          to="/my-bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Bookings</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-border gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary flex items-center gap-2">
            <Compass className="w-7 h-7 text-secondary" />
            Find My Car — Indoor Pedestrian Guide
          </h1>
          <p className="text-xs text-surface-muted mt-1">
            Turn-by-turn walking directions, landmark markers, and vehicle locator synthesizer.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-surface-muted font-semibold">Locating parked vehicle bay...</p>
        </div>
      ) : (
        <FindMyCarMap booking={booking} />
      )}
    </div>
  );
};
