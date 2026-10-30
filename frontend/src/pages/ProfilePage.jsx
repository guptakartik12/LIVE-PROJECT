import React, { useState } from 'react';
import {
  User,
  Car,
  Mail,
  Phone,
  Shield,
  Sparkles,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Link } from 'react-router-dom';

export const ProfilePage = () => {
  const { user, isMember, updateProfile } = useAuth();
  const { showToast } = useNotification();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [plate, setPlate] = useState(user?.plate || '');
  const [vehicles, setVehicles] = useState(user?.vehicles || []);
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleType, setNewVehicleType] = useState('Car');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name,
        phone,
        plate,
        vehicles
      });
      showToast('Profile & vehicle fleet updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVehicle = () => {
    if (!newVehiclePlate.trim()) return;
    const updated = [
      ...vehicles,
      {
        plate: newVehiclePlate.trim().toUpperCase(),
        type: newVehicleType,
        model: newVehicleModel.trim(),
        isPrimary: vehicles.length === 0
      }
    ];
    setVehicles(updated);
    setNewVehiclePlate('');
    setNewVehicleModel('');
  };

  const handleRemoveVehicle = (index) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-border gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">
            Driver Profile & Vehicle Management
          </h1>
          <p className="text-xs text-surface-muted mt-1">
            Manage your personal contact info, registered license plates, and VIP privileges.
          </p>
        </div>

        {isMember ? (
          <span className="text-xs font-extrabold px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            ParkEase VIP Member
          </span>
        ) : (
          <Link
            to="/membership"
            className="text-xs font-bold text-secondary hover:underline"
          >
            Upgrade to Premium (20% Off)
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Account Summary Card */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-6 h-fit">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold mx-auto shadow-sm">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <h3 className="font-extrabold text-base text-primary">{user?.name}</h3>
            <p className="text-xs text-surface-muted font-mono">{user?.email}</p>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-surface-muted">Role</span>
              <b className="text-primary font-bold">{user?.role}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-muted">Membership Tier</span>
              <b className={isMember ? 'text-amber-600 font-bold' : 'text-slate-600'}>
                {user?.membership?.type || 'NORMAL'}
              </b>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-muted">Pre-Booking Window</span>
              <b className="text-primary">{user?.membership?.advanceDays || 1} Day(s) Ahead</b>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-muted">Discount Benefit</span>
              <b className="text-emerald-600 font-bold">{user?.membership?.discountPercent || 0}% Off</b>
            </div>
          </div>
        </div>

        {/* Right: Profile Edit & Vehicle List */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-primary pb-2 border-b border-surface-border">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Full Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:border-secondary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Phone Number</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm font-mono focus:outline-none focus:border-secondary"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Default Primary Plate</span>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm font-mono font-bold uppercase focus:outline-none focus:border-secondary"
              />
            </label>

            {/* Vehicle Fleet Manager */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-xs font-bold text-primary block">
                Registered Vehicles Fleet ({vehicles.length})
              </span>

              <div className="space-y-2">
                {vehicles.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <Car className="w-4 h-4 text-surface-muted" />
                      <div>
                        <span className="font-mono font-bold text-primary">{v.plate}</span>
                        <span className="text-surface-muted ml-2">({v.type}{v.model ? ` · ${v.model}` : ''})</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVehicle(i)}
                      className="text-danger hover:text-red-700 p-1"
                      title="Remove vehicle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Vehicle Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <input
                  type="text"
                  value={newVehiclePlate}
                  onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                  placeholder="Plate (e.g. DL 03 EF 3003)"
                  className="px-3 py-2 rounded-xl border border-surface-border text-xs font-mono uppercase"
                />
                <select
                  value={newVehicleType}
                  onChange={(e) => setNewVehicleType(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-surface-border text-xs"
                >
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="EV">Electric Vehicle (EV)</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    placeholder="Model (e.g. Brezza)"
                    className="w-full px-3 py-2 rounded-xl border border-surface-border text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddVehicle}
                    className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-bold text-sm shadow-sm transition-colors disabled:opacity-50 mt-4"
            >
              {saving ? 'Saving Changes...' : 'Save Profile & Vehicles'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
