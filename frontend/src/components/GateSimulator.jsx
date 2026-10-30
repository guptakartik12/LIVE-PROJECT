import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  QrCode,
  ArrowRight
} from 'lucide-react';
import { sound } from '../services/soundSynthesizer';
import { api } from '../services/api';

export const GateSimulator = ({
  booking,
  onSessionStatusChange,
  onOpenScanner
}) => {
  const [isArmOpen, setIsArmOpen] = useState(false);
  const [trafficLight, setTrafficLight] = useState('red'); // 'red' | 'green'
  const [message, setMessage] = useState('Barrier Closed • Scan Pass or Tap Below to Simulate');
  const [loading, setLoading] = useState(false);
  const [statusType, setStatusType] = useState('idle'); // 'idle' | 'success' | 'error'

  const handleSimulateEntry = async () => {
    if (!booking) {
      setMessage('Please select or specify a booking pass first.');
      setStatusType('error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.gateEntry(booking.bookingId, 'North Gate Barrier 01');

      // Trigger audio & visual animation
      sound.playGate();
      setTrafficLight('green');
      setIsArmOpen(true);
      setStatusType('success');
      setMessage(`Entry Authorized! Barrier Lifted for Plate: ${booking.vehiclePlate}. Proceed to Slot ${booking.slotId}.`);

      if (onSessionStatusChange) {
        onSessionStatusChange('active', res.booking);
      }

      // Automatically lower barrier after 5 seconds to simulate vehicle driving through
      setTimeout(() => {
        setIsArmOpen(false);
        setTrafficLight('red');
        setMessage(`Vehicle cleared. Barrier returned to closed position. Slot ${booking.slotId} is now Occupied.`);
      }, 5500);
    } catch (err) {
      setStatusType('error');
      setMessage(err.message || 'Access Denied: Invalid reservation or expired session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateExit = async () => {
    if (!booking) {
      setMessage('Please select or specify a booking pass first.');
      setStatusType('error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.gateExit(booking.bookingId, 'South Exit Barrier 02');

      sound.playGate();
      setTrafficLight('green');
      setIsArmOpen(true);
      setStatusType('success');

      const extraText = res.extraCharges > 0 ? ` (Overstay Fee: ₹${res.extraCharges})` : '';
      setMessage(`Exit Authorized! Barrier Lifted. Have a safe drive! Slot ${booking.slotId} is now Free for others.${extraText}`);

      if (onSessionStatusChange) {
        onSessionStatusChange('completed', res.booking);
      }

      setTimeout(() => {
        setIsArmOpen(false);
        setTrafficLight('red');
        setMessage('Vehicle departed. Barrier returned to closed position.');
      }, 5500);
    } catch (err) {
      setStatusType('error');
      setMessage(err.message || 'Exit Verification failed: No active parking session found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-6">
      {/* Header with simulation disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-border gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-primary">Interactive Boom Barrier Gate Simulator</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Digital Simulation
            </span>
          </div>
          <p className="text-xs text-surface-muted mt-0.5">
            Test the live RFID / QR boom barrier mechanism used at parking access gates.
          </p>
        </div>

        {onOpenScanner && (
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-primary text-xs font-semibold transition-colors"
          >
            <QrCode className="w-4 h-4 text-secondary" />
            <span>Scan Camera Pass</span>
          </button>
        )}
      </div>

      {/* Simulated Barrier Stage */}
      <div className="relative h-56 bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl overflow-hidden border border-slate-700 flex flex-col justify-end p-6 select-none shadow-inner">
        {/* Overhead Camera & Banner */}
        <div className="absolute top-4 left-6 flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Smart Optical Gate Barrier #01</span>
          </div>
          {booking && (
            <div className="hidden sm:flex items-center gap-1.5 bg-secondary/80 text-white px-2.5 py-0.5 rounded-full text-[11px] font-mono">
              Pass #{booking.bookingId} · {booking.vehiclePlate}
            </div>
          )}
        </div>

        {/* Traffic Light Assembly */}
        <div className="absolute top-4 right-6 flex flex-col gap-1.5 bg-slate-950 p-2 rounded-lg border border-slate-700 shadow-md">
          <div
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              trafficLight === 'red'
                ? 'bg-red-500 shadow-[0_0_12px_#ef4444]'
                : 'bg-red-950 opacity-40'
            }`}
          />
          <div
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              trafficLight === 'green'
                ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
                : 'bg-emerald-950 opacity-40'
            }`}
          />
        </div>

        {/* Physical Boom Barrier Graphic */}
        <div className="relative z-10 flex items-end">
          {/* Barrier Pivot Pillar */}
          <div className="relative w-10 h-28 bg-gradient-to-r from-amber-500 to-amber-600 rounded-t-md border-t-2 border-r border-amber-300 flex items-center justify-center shadow-lg">
            {/* Pivot Axis Hub */}
            <div className="w-5 h-5 rounded-full bg-slate-900 border-2 border-white shadow-inner flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
            </div>

            {/* Rotatable Barrier Arm */}
            <div
              className={`absolute left-7 top-7 h-3.5 w-64 sm:w-80 rounded-r-md gate-arm-animated flex items-center overflow-hidden border border-white/40 shadow-md ${
                isArmOpen ? 'gate-arm-open' : 'gate-arm-closed'
              }`}
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #ef4444, #ef4444 14px, #ffffff 14px, #ffffff 28px)'
              }}
            >
              <div className="w-full text-center text-[9px] font-extrabold text-slate-900 opacity-60 tracking-widest uppercase">
                {isArmOpen ? 'OPEN' : 'STOP'}
              </div>
            </div>
          </div>
        </div>

        {/* Road Surface and Markings */}
        <div className="w-full h-8 bg-slate-950 -mx-6 -mb-6 border-t-2 border-dashed border-amber-400/50 flex items-center justify-around px-8">
          <span className="text-[10px] text-slate-500 font-mono tracking-widest">
            ENTRY LANE ➔ ➔ ➔
          </span>
          <span className="text-[10px] text-slate-500 font-mono tracking-widest hidden sm:inline">
            KEEP CLEAR
          </span>
        </div>
      </div>

      {/* Barrier Status Text Banner */}
      <div
        className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 transition-colors ${
          statusType === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : statusType === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-slate-50 text-slate-700 border-slate-200'
        }`}
      >
        {statusType === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        ) : statusType === 'error' ? (
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-secondary flex-shrink-0" />
        )}
        <span>{message}</span>
      </div>

      {/* Simulator Control Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleSimulateEntry}
          disabled={loading}
          className="py-3 px-4 rounded-xl bg-success hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Simulate Entry Gate (Authorize & Check In)</span>
        </button>

        <button
          onClick={handleSimulateExit}
          disabled={loading}
          className="py-3 px-4 rounded-xl bg-primary hover:bg-primary-light text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Simulate Exit Gate (Release Bay & Complete)</span>
        </button>
      </div>

      <div className="text-[11px] text-surface-muted bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
        <b>Hardware Simulation Note:</b> ParkEase integrates with physical boom barriers, ANPR cameras, and LED display boards via cloud MQTT/WebSocket controllers. This UI simulates gate barrier actions and automatically synchronizes slot occupancy in the live MongoDB database.
      </div>
    </div>
  );
};
