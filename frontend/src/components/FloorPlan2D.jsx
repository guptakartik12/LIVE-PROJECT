import React, { useState } from 'react';
import {
  Car,
  Bike,
  Zap,
  Info,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  ArrowRight
} from 'lucide-react';

export const FloorPlan2D = ({
  floorKey,
  slots = [],
  selectedSlot,
  onSelectSlot,
  onProceedBooking,
  hourlyRate = 40,
  floorName = 'Basement Level',
  vehicleType = 'Car'
}) => {
  const [activeSlotModal, setActiveSlotModal] = useState(null);

  // Generate fallback slots if live slots are still loading so the grid is never blank
  const displaySlots = (slots && slots.length > 0)
    ? slots
    : Array.from(
        { length: floorKey === 'b' ? 36 : 24 },
        (_, i) => {
          const num = i + 1;
          const prefix = floorKey === 'b' ? 'B' : floorKey === 'f' ? 'F' : 'S';
          return {
            _id: `fallback_${prefix}${num}`,
            slotId: `${prefix}${num}`,
            slotNumber: num,
            floorKey,
            floorName,
            vehicleType,
            pricePerHour: hourlyRate,
            hasEVCharging: floorKey === 's',
            chargingPower: floorKey === 's' ? (num <= 12 ? '50 kW DC Fast' : '22 kW AC Fast') : '',
            landmark: num <= 6 ? 'Near Elevator' : 'Standard Bay',
            status: 'available',
            isUnderMaintenance: false
          };
        }
      );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
          dot: 'bg-emerald-500',
          label: 'Available'
        };
      case 'occupied':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-300',
          dot: 'bg-rose-500',
          label: 'Occupied'
        };
      case 'reserved':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-300',
          dot: 'bg-amber-500',
          label: 'Reserved'
        };
      case 'maintenance':
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          label: 'Maintenance'
        };
    }
  };

  const getSlotCardStyles = (slot) => {
    const isSelected = selectedSlot && selectedSlot.slotId === slot.slotId;
    if (isSelected) {
      return 'border-2 border-secondary bg-blue-50/70 shadow-md ring-2 ring-blue-300 ring-opacity-50 scale-[1.03]';
    }

    switch (slot.status) {
      case 'available':
        return 'border border-emerald-200 bg-white hover:border-emerald-500 hover:shadow-card hover:-translate-y-0.5 cursor-pointer';
      case 'occupied':
        return 'border border-rose-200 bg-rose-50/40 cursor-not-allowed opacity-90';
      case 'reserved':
        return 'border border-amber-200 bg-amber-50/30 cursor-not-allowed opacity-90';
      case 'maintenance':
      default:
        return 'border border-slate-200 bg-slate-100/70 cursor-not-allowed opacity-60';
    }
  };

  const handleSlotClick = (slot) => {
    if (slot.status === 'available') {
      onSelectSlot(slot);
    } else {
      setActiveSlotModal(slot);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-border p-5 sm:p-6 shadow-card">
      {/* Floor Plan Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-surface-border gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <h3 className="text-lg font-bold text-primary">{floorName} — 2D Interactive Bay Layout</h3>
          </div>
          <p className="text-xs text-surface-muted mt-1">
            Standard Bay Rate: ₹{hourlyRate}/hr · Select any green bay to reserve. Click occupied slots for schedule.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Occupied
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Reserved
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" /> Maintenance
          </span>
        </div>
      </div>

      {/* Driveway & Elevator Indicators */}
      <div className="flex items-center justify-between py-3 px-4 my-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 font-medium">
        <span className="flex items-center gap-1.5">
          🚪 <b className="text-primary">North Elevator & Pedestrian Lobby</b> (Slots 1–6)
        </span>
        <span className="hidden md:inline text-slate-400">
          🚗 Internal Two-Way Traffic Driveway (Speed limit 10 km/h)
        </span>
        <span className="flex items-center gap-1.5">
          🚶 <b>South Fire Exit Staircase</b>
        </span>
      </div>

      {/* 2D Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 my-4">
        {displaySlots.map((slot) => {
          const isSelected = selectedSlot && selectedSlot.slotId === slot.slotId;
          const statusBadge = getStatusBadge(slot.status);

          return (
            <div
              key={slot.slotId}
              onClick={() => handleSlotClick(slot)}
              className={`relative rounded-xl p-3.5 transition-all duration-200 flex flex-col justify-between h-32 ${getSlotCardStyles(
                slot
              )}`}
            >
              {/* Top row: Slot ID & Vehicle Icon */}
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-primary tracking-tight">
                  {slot.slotId}
                </span>
                <div className="flex items-center gap-1">
                  {slot.hasEVCharging && (
                    <span className="p-1 rounded-md bg-emerald-100 text-emerald-800" title="EV Fast Charging">
                      <Zap className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {slot.vehicleType === 'Car' ? (
                    <Car className="w-4 h-4 text-surface-muted" />
                  ) : slot.vehicleType === 'Bike' ? (
                    <Bike className="w-4 h-4 text-surface-muted" />
                  ) : (
                    <Zap className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
              </div>

              {/* Middle row: Landmark or feature note */}
              <div className="my-1 text-[11px] text-surface-muted truncate">
                {slot.landmark || 'Standard Bay'}
              </div>

              {/* Bottom row: Price and Status Pill */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-xs font-semibold text-primary">
                  ₹{slot.pricePerHour}/hr
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${statusBadge.bg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                  {statusBadge.label}
                </span>
              </div>

              {/* Selected Tick Indicator */}
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Slot Action Bar */}
      {selectedSlot && (
        <div className="mt-6 p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary text-white font-extrabold text-lg flex items-center justify-center shadow-sm">
              {selectedSlot.slotId}
            </div>
            <div>
              <div className="font-bold text-primary flex items-center gap-2">
                <span>Selected Bay: {selectedSlot.slotId}</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  Available
                </span>
              </div>
              <p className="text-xs text-surface-muted">
                {floorName} · {selectedSlot.landmark} · ₹{selectedSlot.pricePerHour}/hr
                {selectedSlot.hasEVCharging ? ` · ${selectedSlot.chargingPower || 'EV Fast Bay'}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onProceedBooking}
            className="px-6 py-2.5 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <span>Proceed to Reservation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Occupied / Maintenance Slot Info Modal */}
      {activeSlotModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-elevated border border-surface-border animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">Bay {activeSlotModal.slotId}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(activeSlotModal.status).bg}`}>
                  {getStatusBadge(activeSlotModal.status).label}
                </span>
              </div>
              <button
                onClick={() => setActiveSlotModal(null)}
                className="text-surface-muted hover:text-primary text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between text-surface-muted">
                <span>Floor Level</span>
                <b className="text-primary">{floorName}</b>
              </div>
              <div className="flex justify-between text-surface-muted">
                <span>Vehicle Type</span>
                <b className="text-primary">{activeSlotModal.vehicleType}</b>
              </div>
              <div className="flex justify-between text-surface-muted">
                <span>Location Landmark</span>
                <b className="text-primary">{activeSlotModal.landmark}</b>
              </div>

              {activeSlotModal.status === 'maintenance' && (
                <div className="p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Maintenance Notice
                  </p>
                  <p className="mt-1 text-[11px]">{activeSlotModal.maintenanceReason || 'Under routine bay inspection and sensor testing.'}</p>
                </div>
              )}

              {activeSlotModal.activeBooking && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-semibold text-primary">Active Reservation Window</div>
                  <div className="flex justify-between text-surface-muted">
                    <span>Driver</span>
                    <b>{activeSlotModal.activeBooking.userName}</b>
                  </div>
                  <div className="flex justify-between text-surface-muted">
                    <span>Vehicle Plate</span>
                    <b className="font-mono">{activeSlotModal.activeBooking.vehiclePlate}</b>
                  </div>
                  <div className="flex justify-between text-surface-muted">
                    <span>Window</span>
                    <b>
                      {new Date(activeSlotModal.activeBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                      {new Date(activeSlotModal.activeBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </b>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveSlotModal(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-primary font-semibold text-xs rounded-xl transition-colors"
            >
              Close Bay Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
