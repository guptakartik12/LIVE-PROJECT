import React, { useState } from 'react';
import {
  Compass,
  Volume2,
  Navigation,
  Footprints,
  MapPin,
  Clock,
  Car,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { sound } from '../services/soundSynthesizer';

export const FindMyCarMap = ({ booking }) => {
  const [isHonking, setIsHonking] = useState(false);
  const [honkMessage, setHonkMessage] = useState('');

  if (!booking) {
    return (
      <div className="bg-white rounded-2xl border border-surface-border p-8 text-center text-surface-muted">
        <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="font-semibold text-primary">No Active Parked Vehicle Found</p>
        <p className="text-xs text-surface-muted mt-1">
          Reserve a parking bay and enter through the barrier gate to view live indoor walking directions.
        </p>
      </div>
    );
  }

  const handleHonk = () => {
    sound.playHonk();
    setIsHonking(true);
    setHonkMessage(`Hazard lights flashing & horn honking at Slot ${booking.slotId}!`);
    setTimeout(() => {
      setIsHonking(false);
      setHonkMessage('');
    }, 2800);
  };

  const steps = [
    {
      num: 1,
      title: 'Take the Pedestrian Elevator / Staircase',
      desc: `From the main concourse lobby, take Elevator Tower B down to ${booking.floorName || 'Basement Level'}.`
    },
    {
      num: 2,
      title: 'Follow the Yellow Pedestrian Safety Lane',
      desc: `Exit the glass elevator lobby doors and follow the demarcated walking lane straight ahead past Pillar C2.`
    },
    {
      num: 3,
      title: `Arrive at Bay ${booking.slotId} (${booking.landmark || 'Standard Bay'})`,
      desc: `Your vehicle with registration ${booking.vehiclePlate} is parked in Bay ${booking.slotId} on your right side.`
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-6">
      {/* Top Hero Pill with Spot Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900 text-white gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-secondary text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {booking.slotId}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">{booking.floorName}</span>
              <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full">
                Bay Pinned
              </span>
            </div>
            <div className="text-xs text-slate-300 font-mono mt-0.5">
              Plate: <b className="text-amber-400">{booking.vehiclePlate}</b> · {booking.location}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-secondary-light" />
              <span>{booking.landmark || 'Near Elevator Lobby'}</span>
            </div>
          </div>
        </div>

        {/* Honk Horn & Flash Lights Simulator Button */}
        <button
          onClick={handleHonk}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
            isHonking
              ? 'bg-amber-400 text-slate-950 animate-pulse ring-4 ring-amber-300'
              : 'bg-white text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Volume2 className="w-4 h-4 text-primary" />
          <span>{isHonking ? 'Honking & Flashing...' : 'Flash Lights & Honk Horn'}</span>
        </button>
      </div>

      {honkMessage && (
        <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>{honkMessage}</span>
        </div>
      )}

      {/* 2D Indoor Schematic Map */}
      <div className="border border-surface-border rounded-xl p-4 bg-slate-50">
        <div className="flex items-center justify-between pb-3 text-xs font-semibold text-primary">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-secondary" /> Indoor Schematic Floor Blueprint
          </span>
          <span className="text-surface-muted">Predefined 2D Pedestrian Route</span>
        </div>

        {/* Blueprint Layout */}
        <div className="relative h-64 bg-slate-200 rounded-lg border border-slate-300 overflow-hidden flex flex-col justify-between p-4">
          {/* Top schematic row: Elevator and Stair lobby */}
          <div className="flex items-center justify-between">
            <div className="px-3 py-1.5 rounded-md bg-white border border-slate-300 shadow-sm text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              🚪 <span>Elevator Lobby (You Start Here)</span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-white border border-slate-300 shadow-sm text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              🚶 <span>South Stairway</span>
            </div>
          </div>

          {/* Dotted Walking Path Indicator */}
          <div className="relative my-auto flex items-center justify-center">
            <div className="w-full border-t-2 border-dashed border-secondary flex items-center justify-around">
              <span className="bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <Footprints className="w-3 h-3" /> Pedestrian Walking Lane
              </span>
            </div>
          </div>

          {/* Bottom schematic bays row */}
          <div className="grid grid-cols-6 gap-2">
            {['1', '2', '3', '4', '5', '6'].map((col) => {
              const bayCode = `${booking.floorKey ? booking.floorKey.toUpperCase() : 'B'}${col}`;
              const isTargetBay = booking.slotId.includes(col);

              return (
                <div
                  key={col}
                  className={`h-16 rounded-md border flex flex-col items-center justify-center text-xs font-bold transition-all ${
                    isTargetBay
                      ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-md ring-2 ring-amber-300'
                      : 'bg-white border-slate-300 text-slate-500'
                  }`}
                >
                  <span>{bayCode}</span>
                  {isTargetBay && (
                    <div className="text-[9px] font-semibold flex items-center gap-0.5 text-slate-900">
                      <Car className="w-3 h-3" />
                      <span>YOUR CAR</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Pedestrian Walking Directions */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-primary flex items-center gap-2">
          <Navigation className="w-4 h-4 text-secondary" />
          Turn-by-Turn Walking Directions
        </h4>

        <div className="space-y-2.5">
          {steps.map((st) => (
            <div
              key={st.num}
              className="flex items-start gap-3 p-3 rounded-xl bg-white border border-surface-border hover:bg-slate-50 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {st.num}
              </div>
              <div>
                <b className="text-xs text-primary block">{st.title}</b>
                <p className="text-[11px] text-surface-muted mt-0.5">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
