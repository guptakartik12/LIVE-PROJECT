import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  ShieldCheck,
  Calendar,
  Percent,
  Clock,
  ArrowRight,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const MembershipPage = () => {
  const { user, isMember, upgradeMembership } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      showToast('Please sign in or register to join ParkEase Premium.', 'error');
      return;
    }

    setLoading(true);
    try {
      await upgradeMembership();
      showToast('Welcome to ParkEase VIP Premium! 20% discount active.', 'success');
    } catch (err) {
      showToast(err.message || 'Upgrade failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const comparisonFeatures = [
    {
      feature: 'Advance Bay Pre-Booking',
      normal: 'Up to 1 Day (24 Hours)',
      premium: 'Up to 7 Days Ahead',
      highlight: true
    },
    {
      feature: 'Parking Bay Discount',
      normal: 'Standard Rates (0%)',
      premium: '20% Automatic Off All Bays',
      highlight: true
    },
    {
      feature: 'Priority EV Fast Charging Bays',
      normal: 'Subject to general availability',
      premium: 'Priority Allocation & Notifications'
    },
    {
      feature: 'Automated Boom Barrier Access',
      normal: 'Standard optical QR code',
      premium: 'Express High-Speed Pass'
    },
    {
      feature: 'Free Reservation Cancellation',
      normal: 'Up to 2 hours before window',
      premium: 'Up to 30 minutes before window'
    },
    {
      feature: 'Dedicated Customer Support',
      normal: 'Standard email support',
      premium: '24/7 Priority Concierge'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>PARKEASE PRIVILEGE CLUBS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">
          Compare Membership Plans
        </h1>
        <p className="text-xs sm:text-sm text-surface-muted">
          Choose the right plan for your parking habits. Save up to 20% on every trip with ParkEase Premium.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Normal Plan */}
        <div className="bg-white rounded-3xl border border-surface-border p-8 shadow-card flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-primary">Standard Driver</h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Default Free Plan
              </span>
            </div>
            <div className="text-3xl font-extrabold text-primary">
              ₹0 <span className="text-xs text-surface-muted font-normal">/ year</span>
            </div>
            <p className="text-xs text-surface-muted leading-relaxed">
              Ideal for occasional weekend parkers and visitors needing reliable same-day reservations.
            </p>

            <ul className="space-y-3 text-xs pt-4 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>1-Day advance slot booking</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Digital QR pass for entry & exit</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Find My Car pedestrian walking guide</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <X className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <span>No hourly parking discount (0%)</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <X className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <span>No multi-day advance booking</span>
              </li>
            </ul>
          </div>

          <button
            disabled
            className="w-full py-3 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs cursor-default"
          >
            Current Standard Tier
          </button>
        </div>

        {/* Premium VIP Plan */}
        <div className="bg-gradient-to-b from-primary to-primary-light rounded-3xl border-2 border-secondary p-8 shadow-elevated text-white flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-secondary text-white text-[10px] font-extrabold px-4 py-1 rounded-bl-xl tracking-wider uppercase">
            MOST POPULAR
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">ParkEase Premium</h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-900">
                VIP
              </span>
            </div>

            <div className="text-3xl font-extrabold text-white">
              ₹999 <span className="text-xs text-slate-300 font-normal">/ year</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Designed for regular commuters, office workers, and EV drivers who want priority and savings.
            </p>

            <ul className="space-y-3 text-xs pt-4 border-t border-slate-700/60">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-secondary-light flex-shrink-0" />
                <span className="font-semibold text-white">7-Day advance pre-booking access</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-secondary-light flex-shrink-0" />
                <span className="font-semibold text-white">20% automatic discount on all parking slots</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-secondary-light flex-shrink-0" />
                <span>Priority access to 22 kW & 50 kW EV charging bays</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-secondary-light flex-shrink-0" />
                <span>Priority lane boom barrier gate passes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-secondary-light flex-shrink-0" />
                <span>Flexible cancellation up to 30 mins before arrival</span>
              </li>
            </ul>
          </div>

          {isMember ? (
            <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>You are an Active Premium Member</span>
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Activating VIP Membership...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Join Premium for ₹999 / year</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Comparison Feature Table */}
      <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-card space-y-4">
        <h3 className="text-lg font-bold text-primary pb-3 border-b border-surface-border">
          Comprehensive Feature Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-surface-muted">
                <th className="py-3 font-bold">Feature Privilege</th>
                <th className="py-3 font-bold">Standard Tier</th>
                <th className="py-3 font-bold text-secondary">Premium VIP Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonFeatures.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 font-semibold text-primary">{row.feature}</td>
                  <td className="py-3.5 text-surface-muted">{row.normal}</td>
                  <td className="py-3.5 font-bold text-secondary">{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
