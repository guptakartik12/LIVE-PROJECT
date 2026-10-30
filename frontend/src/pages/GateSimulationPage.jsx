import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  QrCode,
  Camera,
  Play,
  RotateCcw,
  Sparkles,
  Car,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { GateSimulator } from '../components/GateSimulator';
import { QRScannerModal } from '../components/QRScannerModal';
import { useNotification } from '../context/NotificationContext';

export const GateSimulationPage = () => {
  const [searchParams] = useSearchParams();
  const urlPassId = searchParams.get('id');

  const [booking, setBooking] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [selectedPassId, setSelectedPassId] = useState(urlPassId || '');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useNotification();

  const loadPasses = async () => {
    try {
      // Load user bookings or admin recent bookings
      const myRes = await api.getMyBookings().catch(() => ({ bookings: [] }));
      if (myRes.bookings && myRes.bookings.length > 0) {
        setRecentBookings(myRes.bookings);
        if (!selectedPassId) {
          setSelectedPassId(myRes.bookings[0].bookingId);
          setBooking(myRes.bookings[0]);
        }
      }
    } catch (err) {
      console.warn('Pass list error:', err);
    }
  };

  useEffect(() => {
    loadPasses();
  }, []);

  useEffect(() => {
    if (selectedPassId) {
      api.getBookingById(selectedPassId)
        .then((res) => setBooking(res.booking))
        .catch(() => {});
    }
  }, [selectedPassId]);

  const handleScanSuccess = async (scannedText) => {
    setIsScannerOpen(false);
    setLoading(true);
    try {
      const res = await api.verifyQR(scannedText);
      setBooking(res.booking);
      setSelectedPassId(res.booking.bookingId);
      showToast(`Pass verified: #${res.booking.bookingId} (${res.booking.slotId})`, 'success');
    } catch (err) {
      showToast(err.message || 'Invalid or unrecognized QR pass', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-border gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary flex items-center gap-2">
            <QrCode className="w-7 h-7 text-secondary" />
            Parking Entry & Exit Gate Barrier Simulator
          </h1>
          <p className="text-xs text-surface-muted mt-1">
            Simulate optical QR validation, ANPR barrier lift, sound chimes, and automatic slot release.
          </p>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
        >
          <Camera className="w-4 h-4" />
          <span>Open Camera Scanner</span>
        </button>
      </div>

      {/* Quick Pass Selector Bar */}
      <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-card space-y-3">
        <label className="block text-xs font-bold text-slate-700">
          Select Digital Pass for Testing Barrier Mechanism
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={selectedPassId}
            onChange={(e) => setSelectedPassId(e.target.value.toUpperCase())}
            placeholder="Enter Booking ID (e.g. PK-1001)"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-surface-border text-sm font-mono font-bold uppercase focus:outline-none focus:border-secondary"
          />
          <button
            onClick={() => {
              if (!selectedPassId.trim()) return;
              api.getBookingById(selectedPassId.trim())
                .then((r) => {
                  setBooking(r.booking);
                  showToast('Pass loaded successfully!', 'success');
                })
                .catch((e) => showToast(e.message || 'Pass not found', 'error'));
            }}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-bold transition-colors"
          >
            Load Pass
          </button>
        </div>

        {/* Demo Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-surface-muted font-medium">Quick Demo Passes:</span>
          {['PK-1001', 'PK-1002', 'PK-1003'].map((code) => (
            <button
              key={code}
              onClick={() => setSelectedPassId(code)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-bold transition-colors"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Active Pass Card Details */}
      {booking && (
        <div className="bg-blue-50/70 rounded-2xl border border-blue-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-bold text-primary text-sm flex items-center gap-2">
              <span>Pass #{booking.bookingId}</span>
              <span className="text-[10px] bg-secondary text-white font-bold px-2 py-0.5 rounded-full uppercase">
                {booking.bookingStatus}
              </span>
            </div>
            <div className="text-slate-600 mt-1">
              Driver: <b>{booking.userName}</b> · Plate: <code className="font-mono font-bold text-primary">{booking.vehiclePlate}</code> · Bay: <b>{booking.slotId}</b> ({booking.floorName})
            </div>
          </div>
          <div className="text-right text-surface-muted">
            <div>Scheduled: {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="font-semibold text-primary">Paid: ₹{booking.totalAmount}</div>
          </div>
        </div>
      )}

      {/* Gate Simulator Stage */}
      <GateSimulator
        booking={booking}
        onSessionStatusChange={(newStatus, updatedBooking) => {
          if (updatedBooking) setBooking(updatedBooking);
        }}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Optical QR Camera Scanner Modal */}
      {isScannerOpen && (
        <QRScannerModal
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
};
