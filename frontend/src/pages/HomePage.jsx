import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car,
  Bike,
  Zap,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  QrCode,
  Compass,
  Star,
  Users
} from 'lucide-react';
import { api } from '../services/api';
import { InteractiveLocationMap } from '../components/InteractiveLocationMap';
import { useAuth } from '../context/AuthContext';

export const HomePage = () => {
  const { user, isMember } = useAuth();
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState('City Center Mall');
  const [selectedVehicle, setSelectedVehicle] = useState('Car');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedHour, setSelectedHour] = useState(10);
  const [floors, setFloors] = useState([]);
  const [loadingFloors, setLoadingFloors] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [locsRes, floorsRes] = await Promise.all([
          api.getLocations(),
          api.getFloors({ location: selectedLoc })
        ]);
        setLocations(locsRes.locations || []);
        setFloors(floorsRes.floors || []);
      } catch (err) {
        console.warn('Failed to load home data:', err);
      } finally {
        setLoadingFloors(false);
      }
    };
    loadData();
  }, [selectedLoc]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const floorKey = selectedVehicle === 'Car' ? 'b' : selectedVehicle === 'Bike' ? 'f' : 's';
    navigate(`/find-parking?loc=${encodeURIComponent(selectedLoc)}&fl=${floorKey}&veh=${selectedVehicle}&date=${selectedDate}&hour=${selectedHour}`);
  };

  const totalAvailableAcrossFloors = floors.reduce((acc, f) => acc + (f.availableSlots || 0), 0);
  const totalOccupiedAcrossFloors = floors.reduce((acc, f) => acc + (f.occupiedSlots || 0), 0);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary text-white pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-light/80 border border-secondary/30 text-xs font-semibold text-secondary-light tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              <span>Next-Generation Smart Parking Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Find. Book. Park.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-light to-secondary">
                Done.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              ParkEase delivers real-time parking slot tracking, automated digital QR gate passes, and 2D indoor walking directions. Reserve guaranteed bays in seconds.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/find-parking"
                className="px-6 py-3.5 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-bold text-sm shadow-card flex items-center gap-2 transition-all"
              >
                <span>Find Parking Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/gate-simulation"
                className="px-6 py-3.5 rounded-xl bg-primary-light/60 hover:bg-primary-light text-white font-semibold text-sm border border-slate-700 flex items-center gap-2 transition-all"
              >
                <QrCode className="w-4 h-4 text-secondary-light" />
                <span>Try Gate Barrier Demo</span>
              </Link>
            </div>
          </div>

          {/* Quick Search Widget */}
          <div className="mt-12 max-w-4xl mx-auto bg-white rounded-2xl p-5 sm:p-6 shadow-elevated border border-surface-border text-primary">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-secondary" /> Location
                </label>
                <select
                  value={selectedLoc}
                  onChange={(e) => setSelectedLoc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-secondary"
                >
                  {locations.length > 0 ? (
                    locations.map((l) => (
                      <option key={l.name} value={l.name}>
                        {l.name}
                      </option>
                    ))
                  ) : (
                    <option value="City Center Mall">City Center Mall</option>
                  )}
                </select>
              </div>

              {/* Vehicle Category */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-secondary" /> Vehicle Type
                </label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-secondary"
                >
                  <option value="Car">Car (Basement Level)</option>
                  <option value="Bike">Bike (First Floor)</option>
                  <option value="EV">Electric Vehicle (Second Floor)</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-secondary" /> Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-secondary"
                />
              </div>

              {/* Search CTA */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <span>Check Availability</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Live Availability Preview Strip */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-surface-muted">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {totalAvailableAcrossFloors} Open Bays Live
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600 font-medium">
                  {totalOccupiedAcrossFloors} Occupied / Reserved
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                ⭐ {isMember ? 'VIP Member Privilege: 7-Day Pre-Book' : 'Standard Users: 1-Day Pre-Book Available'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Floors Preview Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">
              Facility Level Status — {selectedLoc}
            </h2>
            <p className="text-sm text-surface-muted mt-1">
              Explore dedicated parking levels with tailored charging bays and secure bays.
            </p>
          </div>
          <Link
            to={`/find-parking?loc=${encodeURIComponent(selectedLoc)}`}
            className="text-xs font-bold text-secondary hover:text-secondary-dark flex items-center gap-1"
          >
            <span>View Full 2D Layouts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {floors.map((floor) => (
            <div
              key={floor.key}
              className="bg-white rounded-2xl border border-surface-border p-6 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-extrabold text-lg text-primary">
                    {floor.prefix}
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {floor.availableSlots} / {floor.totalSlots} Free
                  </span>
                </div>

                <h3 className="text-lg font-bold text-primary">{floor.name}</h3>
                <p className="text-xs text-surface-muted mt-1">{floor.tagline}</p>
                <div className="mt-3 text-sm font-semibold text-secondary">
                  ₹{floor.hourlyRate} <span className="text-xs text-surface-muted font-normal">/ hour</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {floor.vehicleType === 'Car' ? 'Standard & SUV' : floor.vehicleType === 'Bike' ? 'Two Wheelers' : 'Fast EV Priority'}
                </span>
                <Link
                  to={`/find-parking?loc=${encodeURIComponent(selectedLoc)}&fl=${floor.key}`}
                  className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-light text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Select</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive OpenStreetMap Facility Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InteractiveLocationMap
          locations={locations}
          selectedLocation={locations.find((l) => l.name === selectedLoc)}
          onSelectLocation={(loc) => setSelectedLoc(loc.name)}
        />
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold tracking-wider uppercase text-secondary">Simple 3-Step Process</span>
          <h2 className="text-3xl font-extrabold text-primary">How ParkEase Works</h2>
          <p className="text-sm text-surface-muted">
            Seamless parking management from reservation to express automated barrier exit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-secondary flex items-center justify-center font-extrabold text-lg">
              1
            </div>
            <h3 className="text-base font-bold text-primary">Search & Select Bay</h3>
            <p className="text-xs text-surface-muted leading-relaxed">
              Pick your garage, floor level, and specific bay on our interactive 2D blueprint. View EV chargers and landmark proximity.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-lg">
              2
            </div>
            <h3 className="text-base font-bold text-primary">Pay & Receive Pass</h3>
            <p className="text-xs text-surface-muted leading-relaxed">
              Complete seamless payment via Razorpay test gateway (UPI or Cards). Instantly generate your dynamic optical QR gate pass.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-extrabold text-lg">
              3
            </div>
            <h3 className="text-base font-bold text-primary">Scan & Indoor Navigation</h3>
            <p className="text-xs text-surface-muted leading-relaxed">
              Scan pass at the boom barrier gate to enter. Use Find My Car indoor walking directions and horn synthesizer when returning.
            </p>
          </div>
        </div>
      </section>

      {/* Membership Banner Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-light p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-elevated">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[11px] tracking-wide">
              ⭐ PARKEASE PREMIUM MEMBERSHIP
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Unlock 7-Day Advance Pre-Booking & 20% Off Every Slot
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Join thousands of smart drivers who save time and money. Enjoy priority EV charging bays, flexible cancelations, and express gate passes.
            </p>
          </div>

          <Link
            to="/membership"
            className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>Explore Member Plans</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">Loved by Urban Drivers</h2>
          <p className="text-xs text-surface-muted">Real experiences from daily commuters and corporate professionals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-3">
            <div className="flex text-amber-400">
              {'★★★★★'}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Finding parking at City Center Mall used to take 25 minutes of circling. With ParkEase, I book slot B4 ahead of time and the boom barrier opens instantly!"
            </p>
            <div className="pt-2 text-xs">
              <b className="text-primary block">Vikram Mehta</b>
              <span className="text-surface-muted text-[11px]">Daily Mall Commuter · Honda City</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-3">
            <div className="flex text-amber-400">
              {'★★★★★'}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "The EV charging bay reservation on the Second Floor is a lifesaver. My car was fully charged on the 22 kW AC fast bay while I was at my meeting."
            </p>
            <div className="pt-2 text-xs">
              <b className="text-primary block">Priya Sharma</b>
              <span className="text-surface-muted text-[11px]">EV Owner · Tata Nexon EV</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-3">
            <div className="flex text-amber-400">
              {'★★★★★'}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "The Find My Car feature with pedestrian directions and the honk simulator guided me straight to my vehicle in the underground garage without getting lost."
            </p>
            <div className="pt-2 text-xs">
              <b className="text-primary block">Arjun Kapoor</b>
              <span className="text-surface-muted text-[11px]">Premium Member · Skoda Octavia</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
