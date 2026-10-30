import React, { useState, useEffect } from 'react';
import {
  Shield,
  Car,
  Users,
  DollarSign,
  Activity,
  Layers,
  Clock,
  AlertTriangle,
  Sparkles,
  BarChart3,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'slots' | 'bookings' | 'users'
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [floors, setFloors] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [selectedFloorForSlots, setSelectedFloorForSlots] = useState('b');
  const [searchQuery, setSearchQuery] = useState('');
  const [newFloorPrice, setNewFloorPrice] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const { showToast } = useNotification();

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartsRes, floorsRes, bookingsRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminCharts(),
        api.getFloors(),
        api.getAdminBookings(),
        api.getAdminUsers()
      ]);

      setStats(statsRes.stats);
      setCharts(chartsRes.charts);
      setFloors(floorsRes.floors || []);
      setBookings(bookingsRes.bookings || []);
      setUsers(usersRes.users || []);

      // Load slots for selected floor
      const slotsRes = await api.getFloorSlots(selectedFloorForSlots);
      setAllSlots(slotsRes.slots || []);
    } catch (err) {
      console.warn('Admin load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [selectedFloorForSlots]);

  const handleToggleMaintenance = async (slotId, currentStatus) => {
    try {
      await api.toggleSlotMaintenance(slotId, !currentStatus, !currentStatus ? 'Maintenance flagged by Admin' : '');
      showToast(`Slot maintenance status toggled!`, 'success');
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Failed to update slot maintenance', 'error');
    }
  };

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    if (!newFloorPrice || isNaN(newFloorPrice)) return;
    setUpdatingPrice(true);
    try {
      await api.updateFloorPrice(selectedFloorForSlots, parseFloat(newFloorPrice));
      showToast(`Floor hourly price updated to ₹${newFloorPrice}/hr!`, 'success');
      setNewFloorPrice('');
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Failed to update price', 'error');
    } finally {
      setUpdatingPrice(false);
    }
  };

  const handleAdminCancelBooking = async (bookingId) => {
    if (!window.confirm(`Admin Action: Cancel booking ${bookingId} and refund user?`)) return;
    try {
      await api.cancelBooking(bookingId);
      showToast(`Booking ${bookingId} cancelled by Admin`, 'info');
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Failed to cancel', 'error');
    }
  };

  const handleResetAllData = async () => {
    if (!window.confirm('WARNING: Are you sure you want to reset all data? This will clear all test bookings and restore the original factory database state.')) {
      return;
    }
    try {
      await api.resetAllData();
      showToast('All database records reset to factory state!', 'success');
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Failed to reset data', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-border gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary flex items-center gap-2">
              <Shield className="w-7 h-7 text-secondary" />
              ParkEase Central Operations Center
            </h1>
          </div>
          <p className="text-xs text-surface-muted mt-1">
            Real-time telemetry, bay management, revenue analytics, and transaction logs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={loadAdminData}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-primary text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Stats</span>
          </button>
          <button
            onClick={handleResetAllData}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-danger border border-rose-200 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <span>Reset All Data</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-card space-y-2">
            <span className="text-xs font-semibold text-surface-muted block">Total Parking Capacity</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-primary">{stats.totalCapacity} Bays</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {stats.availableSlots} Open
              </span>
            </div>
            <div className="text-[11px] text-surface-muted">
              {stats.occupiedSlots} Occupied · {stats.reservedSlots} Reserved · {stats.maintenanceSlots} In Maint.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-card space-y-2">
            <span className="text-xs font-semibold text-surface-muted block">Occupancy Percentage</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-secondary">{stats.occupancyPercentage}%</span>
              <span className="text-xs font-bold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                {stats.activeParkingSessions} Active Now
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-secondary h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, stats.occupancyPercentage)}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-card space-y-2">
            <span className="text-xs font-semibold text-surface-muted block">Total System Revenue</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">₹{stats.totalRevenue}</span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Paid
              </span>
            </div>
            <div className="text-[11px] text-surface-muted">
              Across {stats.totalBookings} total completed reservations
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-card space-y-2">
            <span className="text-xs font-semibold text-surface-muted block">Registered Users</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-primary">{stats.totalUsers}</span>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {stats.membership?.premium || 0} VIPs
              </span>
            </div>
            <div className="text-[11px] text-surface-muted">
              {stats.membership?.normal || 0} standard registered driver profiles
            </div>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Analytics & Charts' },
          { id: 'slots', label: 'Bay & Pricing Control' },
          { id: 'bookings', label: `All Reservations (${bookings.length})` },
          { id: 'users', label: `User Accounts (${users.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-surface-muted hover:text-primary hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Charts & Analytics */}
      {activeTab === 'overview' && charts && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Floor Breakdown Bar Progress */}
            <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
              <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-secondary" /> Occupancy & Rates by Floor
              </h3>

              <div className="space-y-4 pt-2">
                {charts.floorBreakdown?.map((fb) => {
                  const pct = fb.total > 0 ? Math.round((fb.occupied / fb.total) * 100) : 0;
                  return (
                    <div key={fb.floorKey} className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-primary">{fb.floorName} ({fb.occupied}/{fb.total} Booked)</span>
                        <span className="text-secondary font-mono">₹{fb.rate}/hr · {pct}% Occupancy</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-secondary h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(10, pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Category Distribution */}
            <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
              <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                <Car className="w-4 h-4 text-secondary" /> Bookings by Vehicle Category
              </h3>

              <div className="grid grid-cols-3 gap-3 pt-4 text-center">
                {charts.vehicleDistribution?.map((v) => (
                  <div key={v._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-xs font-bold text-surface-muted block uppercase">{v._id}</span>
                    <span className="text-xl font-extrabold text-primary block">{v.count}</span>
                    <span className="text-[11px] font-semibold text-emerald-600 block">₹{v.revenue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Paid Transactions Table */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-secondary" /> Real-time Live Financial Transactions
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-surface-muted">
                    <th className="py-2.5 font-bold">Pass ID</th>
                    <th className="py-2.5 font-bold">Driver Name</th>
                    <th className="py-2.5 font-bold">Plate Number</th>
                    <th className="py-2.5 font-bold">Assigned Bay</th>
                    <th className="py-2.5 font-bold">Gateway Method</th>
                    <th className="py-2.5 font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.recentTransactions?.map((t) => (
                    <tr key={t.bookingId} className="hover:bg-slate-50">
                      <td className="py-3 font-mono font-bold text-primary">{t.bookingId}</td>
                      <td className="py-3 font-medium text-slate-700">{t.userName}</td>
                      <td className="py-3 font-mono">{t.vehiclePlate}</td>
                      <td className="py-3 font-bold text-secondary">{t.slotId}</td>
                      <td className="py-3 text-surface-muted">{t.paymentDetails?.method || 'Razorpay UPI'}</td>
                      <td className="py-3 font-bold text-emerald-600">₹{t.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Slot & Pricing Control */}
      {activeTab === 'slots' && (
        <div className="space-y-6">
          {/* Controls: Floor selector & Price update */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Select Level:</label>
              {floors.map((fl) => (
                <button
                  key={fl.key}
                  onClick={() => setSelectedFloorForSlots(fl.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedFloorForSlots === fl.key
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {fl.name} (₹{fl.hourlyRate}/hr)
                </button>
              ))}
            </div>

            <form onSubmit={handleUpdatePrice} className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Change Hourly Rate:</span>
              <input
                type="number"
                min="5"
                placeholder="₹ Rate"
                value={newFloorPrice}
                onChange={(e) => setNewFloorPrice(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-xl border border-surface-border text-xs font-bold focus:outline-none"
              />
              <button
                type="submit"
                disabled={updatingPrice}
                className="px-3.5 py-1.5 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-secondary-dark"
              >
                Update
              </button>
            </form>
          </div>

          {/* Slots Table with Maintenance Toggle */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
            <h3 className="font-bold text-sm text-primary">
              Bays on Level ({allSlots.length} Total) — Click toggle to flag maintenance
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {allSlots.map((slot) => (
                <div
                  key={slot._id}
                  className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                    slot.isUnderMaintenance
                      ? 'bg-slate-100 border-slate-300 opacity-70'
                      : 'bg-white border-surface-border hover:shadow-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <b className="text-sm font-extrabold text-primary">{slot.slotId}</b>
                    <span className="text-[10px] text-surface-muted">₹{slot.pricePerHour}/hr</span>
                  </div>

                  <div className="my-2 text-[10px] text-surface-muted truncate">
                    {slot.landmark}
                  </div>

                  <button
                    onClick={() => handleToggleMaintenance(slot._id, slot.isUnderMaintenance)}
                    className={`w-full py-1 rounded text-[10px] font-bold transition-colors ${
                      slot.isUnderMaintenance
                        ? 'bg-amber-100 text-amber-900 hover:bg-emerald-100 hover:text-emerald-900'
                        : 'bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-900'
                    }`}
                  >
                    {slot.isUnderMaintenance ? 'In Maint. (Enable)' : 'Mark Maint.'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: All Reservations */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="font-bold text-sm text-primary">Master Bookings Log</h3>
            <span className="text-xs text-surface-muted">{bookings.length} Total Bookings in DB</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-surface-muted">
                  <th className="py-2.5 font-bold">Pass ID</th>
                  <th className="py-2.5 font-bold">Driver & Plate</th>
                  <th className="py-2.5 font-bold">Bay & Floor</th>
                  <th className="py-2.5 font-bold">Window</th>
                  <th className="py-2.5 font-bold">Amount</th>
                  <th className="py-2.5 font-bold">Status</th>
                  <th className="py-2.5 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.bookingId} className="hover:bg-slate-50">
                    <td className="py-3 font-mono font-bold text-primary">{b.bookingId}</td>
                    <td className="py-3">
                      <div className="font-medium text-slate-900">{b.userName}</div>
                      <code className="text-[10px] text-surface-muted">{b.vehiclePlate}</code>
                    </td>
                    <td className="py-3 font-semibold text-secondary">{b.slotId} ({b.floorName})</td>
                    <td className="py-3 text-slate-600">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                      {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 font-bold text-emerald-600">₹{b.totalAmount}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        b.bookingStatus === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.bookingStatus === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      {b.bookingStatus !== 'cancelled' && b.bookingStatus !== 'completed' && (
                        <button
                          onClick={() => handleAdminCancelBooking(b.bookingId)}
                          className="text-[11px] font-bold text-danger hover:underline"
                        >
                          Cancel & Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: User Accounts */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="font-bold text-sm text-primary">Registered Driver Accounts</h3>
            <span className="text-xs text-surface-muted">{users.length} Users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-surface-muted">
                  <th className="py-2.5 font-bold">Name</th>
                  <th className="py-2.5 font-bold">Email</th>
                  <th className="py-2.5 font-bold">Phone</th>
                  <th className="py-2.5 font-bold">Role</th>
                  <th className="py-2.5 font-bold">Tier</th>
                  <th className="py-2.5 font-bold">Registered Plate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="py-3 font-bold text-primary">{u.name}</td>
                    <td className="py-3 text-slate-600 font-mono">{u.email}</td>
                    <td className="py-3 text-surface-muted">{u.phone || 'N/A'}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.membership?.type === 'PREMIUM' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.membership?.type || 'NORMAL'}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-800">{u.plate || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
