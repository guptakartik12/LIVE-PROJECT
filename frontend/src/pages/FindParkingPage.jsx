import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Car,
  Bike,
  Zap,
  Calendar,
  Clock,
  Sparkles,
  Lock,
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { FloorPlan2D } from '../components/FloorPlan2D';
import { RecommendationCard } from '../components/RecommendationCard';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotification } from '../context/NotificationContext';

export const FindParkingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isMember } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useNotification();

  const initialLoc = searchParams.get('loc') || 'City Center Mall';
  const initialFloor = searchParams.get('fl') || 'b';
  const initialDate = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const initialHour = searchParams.get('hour') ? parseInt(searchParams.get('hour'), 10) : 10;

  const [locationName, setLocationName] = useState(initialLoc);
  const [activeFloorKey, setActiveFloorKey] = useState(initialFloor);
  const [dateStr, setDateStr] = useState(initialDate);
  const [startHour, setStartHour] = useState(initialHour);
  const [duration, setDuration] = useState(2);
  const [locations, setLocations] = useState([]);
  const [floors, setFloors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generate date offset options (up to 7 days, locked if not member)
  const getDateOptions = () => {
    const options = [];
    const maxDays = isMember ? 7 : 1;
    for (let i = 0; i < 8; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const isLocked = i > maxDays;
      options.push({ offset: i, dateStr: iso, dayName, fullDate, isLocked });
    }
    return options;
  };

  const loadFloorAndSlots = useCallback(async () => {
    setLoading(true);
    try {
      const floorsPromise = api.getFloors({ location: locationName, dateStr, startHour }).catch(() => ({ floors: [] }));
      const slotsPromise = api.getFloorSlots(activeFloorKey, { location: locationName, dateStr, startHour, duration }).catch(() => ({ slots: [] }));
      const recPromise = api.getRecommendations({
        location: locationName,
        vehicleType: activeFloorKey === 'b' ? 'Car' : activeFloorKey === 'f' ? 'Bike' : 'EV',
        dateStr,
        startHour,
        duration
      }).catch(() => ({ recommendations: [] }));

      const [floorsRes, slotsRes, recRes] = await Promise.all([floorsPromise, slotsPromise, recPromise]);

      if (floorsRes?.floors?.length > 0) {
        setFloors(floorsRes.floors);
      }
      if (slotsRes?.slots?.length > 0) {
        setSlots(slotsRes.slots);
      }
      if (recRes?.recommendations && recRes.recommendations.length > 0) {
        setRecommendation(recRes.recommendations[0]);
      } else {
        setRecommendation(null);
      }
    } catch (err) {
      console.warn('Error loading floor slots:', err.message);
    } finally {
      setLoading(false);
    }
  }, [activeFloorKey, locationName, dateStr, startHour, duration]);

  useEffect(() => {
    api.getLocations().then((res) => setLocations(res.locations || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadFloorAndSlots();
  }, [loadFloorAndSlots]);

  // Real-time slot status update listener
  useEffect(() => {
    if (!socket) return;

    const handleSlotUpdate = (data) => {
      if (data.location === locationName && data.floorKey === activeFloorKey) {
        showToast(`Live update: Bay ${data.slotId} is now ${data.status.toUpperCase()}`, 'info');
        loadFloorAndSlots();
      }
    };

    socket.on('slot_updated', handleSlotUpdate);
    return () => {
      socket.off('slot_updated', handleSlotUpdate);
    };
  }, [socket, locationName, activeFloorKey, loadFloorAndSlots, showToast]);

  const currentFloor = floors.find((f) => f.key === activeFloorKey) || {
    name: activeFloorKey === 'b' ? 'Basement Level' : activeFloorKey === 'f' ? 'First Floor' : 'Second Floor',
    hourlyRate: activeFloorKey === 'b' ? 40 : activeFloorKey === 'f' ? 15 : 35,
    vehicleType: activeFloorKey === 'b' ? 'Car' : activeFloorKey === 'f' ? 'Bike' : 'EV'
  };

  const handleProceedBooking = () => {
    if (!selectedSlot) return;
    navigate('/booking', {
      state: {
        slot: selectedSlot,
        floor: currentFloor,
        location: locationName,
        dateStr,
        startHour,
        durationHours: duration
      }
    });
  };

  const hourOptions = [];
  for (let h = 8; h <= 22; h++) {
    const dummy = new Date();
    dummy.setHours(h, 0, 0, 0);
    hourOptions.push({
      h,
      label: dummy.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner and Controls */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-surface-border gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">
              Reserve Parking Bay — {locationName}
            </h1>
            <p className="text-xs text-surface-muted mt-1">
              Select date, duration, and floor to view real-time availability and live bay positions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Location:</label>
            <select
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-surface-border text-xs font-bold text-primary bg-slate-50 focus:outline-none"
            >
              {locations.map((l) => (
                <option key={l.name} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. Date Selector Strip with Membership Rules */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-secondary" /> Step 1: Select Reservation Date
            </span>
            <span className="text-[11px] font-semibold text-surface-muted">
              {isMember ? '⭐ VIP: 7-Day Advance Access' : 'Normal Tier: 1-Day Advance (Upgrade for 7 days)'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {getDateOptions().map((opt) => (
              <button
                key={opt.dateStr}
                disabled={opt.isLocked}
                onClick={() => setDateStr(opt.dateStr)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl border text-center transition-all ${
                  dateStr === opt.dateStr
                    ? 'border-2 border-secondary bg-primary text-white shadow-sm'
                    : opt.isLocked
                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                    : 'border-surface-border bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-[10px] font-medium flex items-center justify-center gap-1">
                  {opt.isLocked && <Lock className="w-2.5 h-2.5 text-amber-500" />}
                  <span>{opt.dayName}</span>
                </div>
                <div className="text-xs font-extrabold mt-0.5">{opt.fullDate}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Time Window & Duration Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-secondary" /> Entry Time
            </label>
            <select
              value={startHour}
              onChange={(e) => setStartHour(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs font-semibold bg-slate-50 focus:outline-none focus:border-secondary"
            >
              {hourOptions.map((opt) => (
                <option key={opt.h} value={opt.h}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Parking Duration
            </label>
            <div className="flex items-center border border-surface-border rounded-xl overflow-hidden bg-slate-50">
              <button
                type="button"
                onClick={() => setDuration((d) => Math.max(1, d - 1))}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-primary font-bold text-sm"
              >
                −
              </button>
              <div className="flex-1 text-center text-xs font-bold text-primary">
                {duration} Hour{duration > 1 ? 's' : ''}
              </div>
              <button
                type="button"
                onClick={() => setDuration((d) => Math.min(24, d + 1))}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-primary font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <div className="text-[11px] text-surface-muted bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              Reserved Window: <b className="text-primary">{startHour}:00 to {startHour + duration}:00</b> ({duration} hr)
            </div>
          </div>
        </div>
      </div>

      {/* Floor Level Switcher Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <button
          onClick={() => {
            setActiveFloorKey('b');
            setSelectedSlot(null);
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm ${
            activeFloorKey === 'b'
              ? 'bg-primary text-white'
              : 'bg-white text-surface-muted border border-surface-border hover:bg-slate-50'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Basement (36 Car Bays)</span>
          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
            ₹40/hr
          </span>
        </button>

        <button
          onClick={() => {
            setActiveFloorKey('f');
            setSelectedSlot(null);
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm ${
            activeFloorKey === 'f'
              ? 'bg-primary text-white'
              : 'bg-white text-surface-muted border border-surface-border hover:bg-slate-50'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>First Floor (24 Two-Wheeler Bays)</span>
          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
            ₹15/hr
          </span>
        </button>

        <button
          onClick={() => {
            setActiveFloorKey('s');
            setSelectedSlot(null);
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm ${
            activeFloorKey === 's'
              ? 'bg-primary text-white'
              : 'bg-white text-surface-muted border border-surface-border hover:bg-slate-50'
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Second Floor (24 EV Charging Bays)</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
            ₹35/hr
          </span>
        </button>
      </div>

      {/* Transparent Smart Parking Recommendation */}
      {recommendation && (
        <RecommendationCard
          recommendation={recommendation}
          onSelectSlot={(slot) => setSelectedSlot(slot)}
        />
      )}

      {/* 2D Interactive Floor Layout */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-surface-border p-16 text-center shadow-card">
          <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-surface-muted">
            Calculating real-time bay availability and floor schedules...
          </p>
        </div>
      ) : (
        <FloorPlan2D
          floorKey={activeFloorKey}
          floorName={currentFloor.name}
          hourlyRate={currentFloor.hourlyRate}
          vehicleType={currentFloor.vehicleType}
          slots={slots}
          selectedSlot={selectedSlot}
          onSelectSlot={(s) => setSelectedSlot(s)}
          onProceedBooking={handleProceedBooking}
        />
      )}
    </div>
  );
};
